# Codebase Summary

**Last Updated:** 2026-03-06
**Version:** 4.0.1
**Package:** omikit-plugin

---

## 1. Repository Structure

```
OMICALL-React-Native-SDK/
├── src/                          # TypeScript/JavaScript source
│   ├── index.ts                  # Main entry point (re-exports)
│   ├── omikit.tsx                # All exported API functions + event constants
│   ├── NativeOmikitPlugin.ts     # TurboModule Codegen spec (New Architecture)
│   └── types/
│       └── index.d.ts            # Public TypeScript type declarations
│
├── android/                      # Android native module
│   └── src/main/java/com/omikitplugin/
│       ├── OmikitPluginModule.kt     # Main ReactNativeModule (bridge + TurboModule)
│       ├── OmikitPluginPackage.kt    # Package registration
│       ├── OmiLocalCameraView.kt     # Local camera ViewManager + refresh (unified)
│       ├── OmiRemoteCameraView.kt    # Remote camera ViewManager + refresh (unified)
│       ├── constants/                # Event name constants
│       ├── state/
│       │   └── CallState.kt         # Call state enum
│       └── utils/
│           └── OmiKitUtils.kt       # Utility functions
│
├── ios/                          # iOS native module
│   ├── OmikitPlugin-Protocol.h  # Objective-C bridge header
│   ├── OmikitPlugin-Bridging-Header.h
│   ├── OmikitPlugin.xcodeproj/
│   ├── CallProcess/
│   │   ├── CallManager.swift     # Core call logic singleton
│   │   ├── CallState.swift       # iOS call state enum
│   │   └── OmiUtils.swift        # iOS utility functions
│   ├── Constant/                 # iOS constants
│   ├── Library/                  # Library wrappers
│   ├── Model/                    # Data models
│   └── VideoCall/                # Video call UI components
│
├── example/                      # Example React Native app
│   ├── src/
│   │   └── screens/              # Demo screens including getter function test UI
│   ├── android/
│   └── ios/
│
├── docs/                         # Project documentation
│   ├── project-overview-pdr.md
│   ├── codebase-summary.md       # This file
│   ├── code-standards.md
│   ├── system-architecture.md
│   └── project-roadmap.md
│
├── lib/                          # Built output (generated, not committed)
├── package.json                  # Package config + Codegen config
├── omikit-plugin.podspec         # iOS CocoaPods spec
├── CHANGELOG.md
└── README.md
```

---

## 2. Key Source Files

### 2.1 `src/omikit.tsx` - Main JS/TS API

The primary JavaScript module. Contains:
- **Architecture detection:** `isTurboModuleEnabled = global.__turboModuleProxy != null`
- **Module resolution:** Tries `TurboModuleRegistry.get('OmikitPlugin')` first, falls back to `NativeModules.OmikitPlugin`
- **Event emitter setup:** `NativeEventEmitter` for iOS, `DeviceEventEmitter` for Android
- **All exported functions:** ~40 async functions wrapping native calls
- **`OmiCallEvent` constant object:** Maps JS event names to native event string values

Key function groups:
| Group | Functions |
|-------|-----------|
| Auth | `startServices`, `initCallWithUserPassword`, `initCallWithApiKey`, `logout`, `checkCredentials`, `registerWithOptions` |
| Call Control | `startCall`, `startCallWithUuid`, `joinCall`, `endCall`, `rejectCall`, `dropCall`, `transferCall`, `getInitialCall` |
| Media | `toggleMute`, `toggleSpeaker`, `toggleHold`, `onHold`, `sendDTMF`, `switchOmiCamera`, `toggleOmiVideo` |
| Audio | `getAudio`, `setAudio`, `getCurrentAudio` |
| Notifications | `configPushNotification`, `hideSystemNotificationSafely`, `hideSystemNotificationOnly`, `hideSystemNotificationAndUnregister` |
| Permissions | `checkPermissionStatus`, `checkAndRequestPermissions`, `requestSystemAlertWindowPermission`, `requestPermissionsByCodes`, `systemAlertWindow`, `openSystemAlertSetting` |
| User Info | `getCurrentUser`, `getGuestUser`, `getUserInfo` |
| Getters (new) | `getProjectId`, `getAppId`, `getDeviceId`, `getFcmToken`, `getSipInfo`, `getVoipToken` |
| Video | `registerVideoEvent`, `removeVideoEvent` |
| Keep-Alive | `getKeepAliveStatus`, `triggerKeepAlivePing` |

### 2.2 `src/NativeOmikitPlugin.ts` - TurboModule Spec

Codegen specification file for React Native New Architecture. Defines the `Spec` interface extending `TurboModule` with typed signatures for all ~45 native methods. Used by the Codegen tool to generate native stubs.

Configured in `package.json`:
```json
"codegenConfig": {
  "name": "RNOmikitPluginSpec",
  "type": "all",
  "jsSrcsDir": "src",
  "android": { "javaPackageName": "com.omikitplugin" }
}
```

### 2.3 `src/types/index.d.ts` - TypeScript Declarations

Public type declarations for consumers of the npm package. Contains:
- All function signatures
- `OmiCallState` enum (0-7)
- `OmiStartCallStatus` enum (validation/permission/call/success error codes)
- `OmiAudioType` enum (receiver/speaker/bluetooth/headphones)
- `OmiCallEvent` constant object type
- `omiEmitter` export type

### 2.4 `android/.../OmikitPluginModule.kt` - Android Native Module

Main Android implementation (~1200+ lines). Key architectural elements:

- Extends `ReactContextBaseJavaModule`, implements `ActivityEventListener`, `OmiListener`
- **`OmiRegistrationStatus` object:** Maps registration status codes to error descriptions
- **`ValidationHelper` object:** Validates required params and provides safe `OmiClient` access
- **Thread safety:** `Mutex` (kotlinx.coroutines) for OmiClient operations; `synchronized(callStateLock)` for call state
- **Call deduplication:** `isCallInProgress`, `lastCallTime`, `callCooldownMs = 2000ms`
- **`getConstants()`:** Exports event name constants to JavaScript
- **`createSafeWritableMap()`:** Type-safe WritableMap creation with null safety
- **`isNetworkAvailable()`:** Uses `NetworkCapabilities` API (not deprecated `activeNetworkInfo`)
- **`autoUnregisterListener`:** Fixed to not double-fire events
- **`initCallWithUserPassword`:** Uses logout callback for deterministic login flow (no `delay()`)
- **Host defaulting:** Empty `host` parameter defaults to `"vh.omicrm.com"`

#### Key Bug Fixes Applied (v3.3.27 - v4.0.1)
| Bug | Fix |
|-----|-----|
| Double-firing events in autoUnregisterListener | Listener unregisters itself after first fire |
| Promise hanging with null activity | Null check resolves promise before return |
| Permission promise never resolved | Added resolve in all permission callback paths |
| Overlay permission onActivityResult | Correct requestCode matching + promise resolution |
| `Thread.sleep()` blocking | Removed; replaced with coroutine-based approach |
| Ghost instance in notification handler | Singleton pattern enforced |
| ClassCastException in audio info | Safe casts (`as? String`, `as? Int`) |
| Deprecated `activeNetworkInfo` | Replaced with `NetworkCapabilities` |
| Double-resolve in `initCallWithUserPassword` | Single resolve path via callback |
| Arbitrary `delay()` in logout flow | Replaced with logout callback for determinism |

### 2.5 `ios/CallProcess/CallManager.swift` - iOS Core Logic

Singleton manager for iOS call operations. Key elements:
- `static private var instance: CallManager? = nil` - singleton
- `private lazy var omiLib: OMISIPLib` - lazy init to prevent New Architecture crash during module loading
- Wraps `OMISIPLib.sharedInstance()` from OmiKit framework
- Handles: `transferCall`, `endCall`, `rejectCall`, `dropCall`, audio routing, camera

---

## 3. Event System

Events are emitted from native to JavaScript using:
- **iOS:** `NativeEventEmitter` (wraps `OmikitPlugin` module; passes `undefined` as module on New Architecture to avoid crash)
- **Android:** `DeviceEventEmitter` / `RCTNativeAppEventEmitter`

| Event Constant | JS Key | Payload |
|---------------|--------|---------|
| `CALL_STATE_CHANGED` | `OmiCallEvent.onCallStateChanged` | `{status, callerNumber, isVideo, incoming, transactionId, typeNumber, ...}` |
| `MUTED` | `OmiCallEvent.onMuted` | `boolean` |
| `HOLD` | `OmiCallEvent.onHold` | `boolean` |
| `SPEAKER` | `OmiCallEvent.onSpeaker` | `boolean` |
| `REMOTE_VIDEO_READY` | `OmiCallEvent.onRemoteVideoReady` | - |
| `CLICK_MISSED_CALL` | `OmiCallEvent.onClickMissedCall` | - |
| `SWITCHBOARD_ANSWER` | `OmiCallEvent.onSwitchboardAnswer` | `{sip: string}` |
| `CALL_QUALITY` | `OmiCallEvent.onCallQuality` | `{quality: number}` |
| `AUDIO_CHANGE` | `OmiCallEvent.onAudioChange` | `{data: [{name, type}]}` |
| `REQUEST_PERMISSION` | `OmiCallEvent.onRequestPermissionAndroid` | `{permissions: string[]}` |

---

## 4. Native SDK Dependencies

### iOS (via CocoaPods)
```ruby
# omikit-plugin.podspec
pod 'OmiKit', '1.10.34'
```

### Android (via Maven)
```gradle
// android/build.gradle
implementation 'vn.vihat.omicall:omisdk:2.6.4'
```

---

## 5. Build Configuration

### JavaScript Build
- Builder: `react-native-builder-bob`
- Outputs: `commonjs` (`lib/commonjs/`), `module` (`lib/module/`)
- Types: `src/types/index.d.ts` (not built, referenced directly)

### iOS Build
- CocoaPods integration via `omikit-plugin.podspec`
- Supports static and dynamic frameworks

### Android Build
- Standard Gradle module
- Source: `android/src/main/java/`
- AndroidManifest + permissions declared in module

---

## 6. Example App

Located in `example/`. Demonstrates:
- Login with username/password and API key
- Making/receiving calls
- Audio device selection
- Getter functions test UI (added in v4.0.1)
- Permission handling on Android 15+
