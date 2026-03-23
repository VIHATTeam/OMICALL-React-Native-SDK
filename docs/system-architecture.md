# System Architecture

**Last Updated:** 2026-03-06
**Version:** 4.0.1

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        React Native App                             │
│                                                                     │
│   import { startCall, omiEmitter, OmiCallEvent } from 'omikit-plugin'
│                              │                                      │
│              ┌───────────────┴────────────────┐                    │
│              │         omikit.tsx              │                    │
│              │   (JS/TS API Layer)             │                    │
│              │                                 │                    │
│              │  Architecture Detection:        │                    │
│              │  global.__turboModuleProxy?     │                    │
│              │     Yes → TurboModule           │                    │
│              │     No  → NativeModule (Bridge) │                    │
│              └───────────────┬────────────────┘                    │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
           ┌───────────────────┴────────────────────┐
           │                                         │
    New Architecture                         Old Architecture
    (RN 0.74+ with NewArch on)              (RN 0.74+ NewArch off, or older)
           │                                         │
    TurboModuleRegistry                      NativeModules.OmikitPlugin
    .get('OmikitPlugin')                     (Bridge / MessageQueue)
           │                                         │
           └───────────────────┬────────────────────┘
                               │
           ┌───────────────────┴────────────────────┐
           │                                         │
      ┌────┴─────┐                           ┌───────┴──────┐
      │  iOS     │                           │   Android    │
      │ OmikitPlugin (Swift/ObjC)            │ OmikitPluginModule.kt
      │ + CallManager.swift                  │              │
      └────┬─────┘                           └───────┬──────┘
           │                                         │
      ┌────┴─────┐                           ┌───────┴──────┐
      │ OmiKit   │                           │ OmiSDK       │
      │ (1.10.34)│                           │ (2.6.4)      │
      └────┬─────┘                           └───────┬──────┘
           │                                         │
           └─────────────────┬───────────────────────┘
                             │
                    ┌────────┴────────┐
                    │  OMICALL SIP    │
                    │  Server         │
                    │  vh.omicrm.com  │
                    └─────────────────┘
```

---

## 2. New Architecture Support (v4.0.0+)

### 2.1 TurboModule Integration

React Native New Architecture replaces the asynchronous JSON bridge with JSI (JavaScript Interface), enabling synchronous native calls. The plugin implements this via:

**Codegen Spec** (`src/NativeOmikitPlugin.ts`):
```typescript
export interface Spec extends TurboModule {
  startCall(data: { phoneNumber: string; isVideo: boolean }): Promise<{...}>;
  // ... all ~45 methods
}
export default TurboModuleRegistry.get<Spec>('OmikitPlugin') as Spec | null;
```

**Runtime Detection** (`src/omikit.tsx`):
```typescript
const isTurboModuleEnabled = (global as any).__turboModuleProxy != null;

const OmikitPlugin: Spec = (() => {
  if (isTurboModuleEnabled) {
    const turboModule = TurboModuleRegistry.get<Spec>('OmikitPlugin');
    if (turboModule) return turboModule;
  }
  return NativeModules.OmikitPlugin || new Proxy({}, { get() { throw new Error(LINKING_ERROR); }});
})();
```

### 2.2 Codegen Configuration

`package.json`:
```json
"codegenConfig": {
  "name": "RNOmikitPluginSpec",
  "type": "all",
  "jsSrcsDir": "src",
  "android": { "javaPackageName": "com.omikitplugin" }
}
```

- `type: "all"` generates both TurboModule (native methods) and Fabric (view components) specs
- Android Codegen generates Java stubs in the `com.omikitplugin` package
- iOS Codegen generates Objective-C headers for Swift interop

### 2.3 Fabric Video Components

Video rendering components (`OmiLocalCameraView`, `OmiRemoteCameraView`) are compatible with Fabric via the interop layer. No custom Fabric implementation was needed - the existing ViewManager approach works through Fabric's backward compatibility mode. Both platforms now use unified `Omi*` naming convention.

### 2.4 NativeEventEmitter on New Architecture

On New Architecture, `NativeModules.OmikitPlugin` is `undefined`. Passing it to `NativeEventEmitter` causes a crash. Solution:
```typescript
const omiEmitter = Platform.OS === 'ios'
  ? new NativeEventEmitter(isTurboModuleEnabled ? undefined as any : NativeModules.OmikitPlugin)
  : DeviceEventEmitter;
```
Android always uses `DeviceEventEmitter`, which does not require a module reference.

---

## 3. iOS Architecture

### 3.1 Module Registration

```
OmikitPlugin-Protocol.h          → Declares @protocol for Objective-C
OmikitPlugin (Swift class)       → Main ReactNative module
  ├── Conforms to: RCTBridgeModule, NativeOmikitPluginSpec (TurboModule)
  ├── Delegates to: CallManager.shareInstance()
  └── Emits events via: RCTEventEmitter
```

### 3.2 Lazy Initialization Pattern

`CallManager.swift` uses lazy initialization to prevent crashes when the TurboModule is loaded before the PJSIP library is ready:

```swift
private lazy var omiLib: OMISIPLib = {
  return OMISIPLib.sharedInstance()
}()
```

### 3.3 Push Notifications (VoIP)

```
APNs VoIP push
      ↓
PKPushRegistry (PushKit)
      ↓
reportNewIncomingCall (CallKit)
      ↓
CallKit UI shown
      ↓
incomingReceived() callback
      ↓
CALL_STATE_CHANGED event (status=2/incoming)
      ↓
App navigation to call screen
```

### 3.4 iOS Call State Callbacks

OmiKit iOS SDK callbacks handled by the native module:
- `incomingReceived(callerId, phoneNumber, isVideo)` → status: 2
- `onCallEstablished(callerId, phoneNumber, isVideo, startTime, transactionId)` → status: 5
- `onCallEnd(callInfo, statusCode)` → status: 6
- `onConnecting()` → status: 4
- `onRinging(callerId, transactionId)` → status: 3
- `onOutgoingStarted(callerId, phoneNumber, isVideo)` → status: 1

---

## 4. Android Architecture

### 4.1 Module Structure

```
OmikitPluginModule.kt
  ├── Extends: ReactContextBaseJavaModule
  ├── Implements: ActivityEventListener, OmiListener
  ├── Singleton reference: moduleInstance (for notification handler)
  ├── Helper objects:
  │   ├── OmiRegistrationStatus  - status code → error string mapping
  │   └── ValidationHelper       - param validation + safe OmiClient access
  └── Coroutine scope: CoroutineScope(Dispatchers.Main)
```

### 4.2 Call State Management

```kotlin
private var isCallInProgress: Boolean = false
private var lastCallTime: Long = 0
private val callCooldownMs: Long = 2000
private val callStateLock = Any()

// Check before starting call
fun canStartNewCall(): Boolean {
  synchronized(callStateLock) {
    return !isCallInProgress && timeSinceLastCall >= callCooldownMs
  }
}
```

### 4.3 Thread Safety Architecture

```
Main Thread (UI)
  ↑ Handler.post()
  │
  ├── OmiClient callbacks (OmiListener)
  │    Dispatched via Handler(Looper.getMainLooper())
  │
  └── @ReactMethod functions
       Run on React Native JS thread
       → CoroutineScope(Dispatchers.Main) for UI ops
       → omiClientMutex.withLock { } for OmiClient access
```

### 4.4 Push Notifications (FCM)

```
FCM push message received
      ↓
FirebaseMessageReceiver
      ↓
OmiClient.handleFCMData(data)
      ↓
NotificationService (ForegroundService)
      ↓
Show fullscreen incoming call notification
      ↓
incomingReceived() callback
      ↓
CALL_STATE_CHANGED event (status=2/incoming)
      ↓
App navigation to call screen
```

### 4.5 Permissions Architecture (Android 13+/14+/15+)

```
Permission codes:
  450 = RECORD_AUDIO (required for Android 14+)
  451 = FOREGROUND_SERVICE_MICROPHONE (required)
  452 = POST_NOTIFICATIONS (required for Android 13+)

Flow:
  checkPermissionStatus()
    → Returns {code, granted} for each required permission

  checkAndRequestPermissions({isVideo})
    → Requests all needed permissions
    → Returns true if all granted

  requestPermissionsByCodes([450, 451, 452])
    → Requests specific permissions by code

  requestSystemAlertWindowPermission()
    → Requests SYSTEM_ALERT_WINDOW (overlay)
    → Uses onActivityResult for result
```

### 4.6 Registration Status Codes

```
200  = Registration successful
400  = Missing required parameters
401  = Invalid credentials
450  = Missing RECORD_AUDIO permission
451  = Missing FOREGROUND_SERVICE permission
452  = Missing POST_NOTIFICATIONS permission
500  = Failed to start SIP service
501  = SIP service not available
502  = Service degraded
600  = Network unavailable
601  = Connection timeout
403  = Access denied (realm/domain)
404  = Realm not found
408  = Connection timeout
503  = Service temporarily unavailable
999  = Unknown error
```

---

## 5. Data Flow Diagrams

### 5.1 Outgoing Call

```
JS: startCall({ phoneNumber, isVideo })
         ↓
    OmikitPlugin (native module)
         ↓
    Validate permissions (mic/camera/overlay)
         ↓ [if permission error]
    Resolve { status: 450/451/452, message: ... }
         ↓ [if permissions ok]
    OmiClient.startCall(phoneNumber, isVideo)
         ↓
    OmiListener.onOutgoingStarted()
         ↓
    sendEvent(CALL_STATE_CHANGED, { status: 1/calling })
         ↓ [180 Ringing received]
    OmiListener.onRinging()
         ↓
    sendEvent(CALL_STATE_CHANGED, { status: 3/early })
         ↓ [200 OK received]
    OmiListener.onCallEstablished()
         ↓
    sendEvent(CALL_STATE_CHANGED, { status: 5/confirmed })
```

### 5.2 Login Flow (initCallWithUserPassword)

```
JS: initCallWithUserPassword({ userName, password, realm, host, isVideo, fcmToken })
         ↓
    Validate required fields (userName, password, realm, fcmToken)
         ↓ [host empty?]
    host = "vh.omicrm.com"  ← default
         ↓
    OmiClient.initCallWithUserPassword(...)
         ↓
    OmiAccountListener.onAccountStatus(online)
    + OmiClient logout callback
         ↓
    promise.resolve(true/false)
```

### 5.3 Getter Functions Flow

```
JS: getProjectId() / getAppId() / getDeviceId()
         ↓
    OmiClient.getInstance(context)
         ↓
    client.getProjectId() / client.getAppId() / ...
         ↓
    promise.resolve(value ?? null)

JS: getSipInfo()
         ↓
    OmiClient.getSipInfo()  →  "sipUser@realm"
         ↓
    promise.resolve(sipInfo ?? null)

JS: getVoipToken()
         ↓ [iOS only]
    PKPushRegistry stored token
    promise.resolve(voipToken ?? null)
         ↓ [Android]
    promise.resolve(null)
```

---

## 6. Video Call Architecture

### 6.1 Video Components

Both platforms use unified `Omi*` naming convention:

```
OmiLocalCameraView   (Android: SimpleViewManager<LinearLayout> + @ReactMethod refresh)
                     (iOS: RCTViewManager + refresh)
     ↓
OmiClient.initLocalCamera(view)

OmiRemoteCameraView  (Android: SimpleViewManager<TextureView> + @ReactMethod refresh)
                     (iOS: RCTViewManager + refresh)
     ↓
OmiClient.initRemoteCamera(view)
```

Android: ViewManager also registered as NativeModule — `refresh()` accessible via `NativeModules.OmiLocalCameraView.refresh()`.

### 6.2 Video Event Flow

```
JS: registerVideoEvent()
      ↓
Native video event registered
      ↓
Remote video stream becomes available
      ↓
sendEvent(REMOTE_VIDEO_READY)
      ↓
JS renders <OmiRemoteCameraView>
```

---

## 7. Security Architecture

- SIP credentials (username/password) transmitted over TLS to OMICALL server
- FCM token passed to OmiClient for push notification registration; not stored by the plugin
- VoIP token (iOS) managed by PushKit; passed to OmiClient
- Overlay permission (`SYSTEM_ALERT_WINDOW`) requested explicitly and checked via `Settings.canDrawOverlays()`
- No credentials stored locally by the plugin layer; all credential management delegated to OmiKit native SDK

---

## 8. Build Targets

### 8.1 JavaScript
| Output | Path | Format |
|--------|------|--------|
| CommonJS | `lib/commonjs/index.js` | CJS for Metro bundler |
| ES Module | `lib/module/index.js` | ESM for bundlers |
| Types | `src/types/index.d.ts` | TypeScript declarations |

### 8.2 iOS
- CocoaPods integration; `omikit-plugin.podspec` defines dependencies
- OmiKit framework linked via `pod 'OmiKit', '~> 1.10.34'`

### 8.3 Android
- Gradle module; `android/build.gradle` defines dependencies
- OmiSDK via Maven: `vn.vihat.omicall:omisdk:2.6.4`
- 16 KB page size support enabled
- Target SDK: 35 (Android 15)
- Min SDK: 21 (Android 5.0)
