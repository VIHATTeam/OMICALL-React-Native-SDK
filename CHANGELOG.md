# Changelog

All notable changes to this project will be documented in this file.

## 4.1.7 [19/05/2026]

### Feature — Backend device registration check APIs (iOS 1.11.19 / Android 2.6.21)

**Files:** `ios/Library/OmikitPlugin.m`, `ios/Library/OmikitPlugin.swift`, `android/src/main/java/com/omikitplugin/OmikitPluginModule.kt`, `src/NativeOmikitPlugin.ts`, `src/omikit.tsx`, `src/types/index.d.ts`

- **[FEATURE] `getOmiDevices()`** — New public API that fetches the list of devices currently registered on the OMI backend for the active SIP user. Returns `Promise<OmiDeviceInfo[]>` with normalized camelCase shape per device: `deviceId`, `token`, `deviceType` (`"ios"` / `"android"`), `voipToken`, `appId`, `createdTime`, `projectId`, `sipNumber`. Returns empty array on logout, network failure, or parse error — never rejects. Use to verify the local device record was not lost on the backend (e.g. after reinstall or backend cleanup).
- **[FEATURE] `isCurrentDeviceRegistered()`** — Verifies whether the local `deviceId` + `appId` pair appears in `getOmiDevices()` payload. Returns `false` early when not logged in, avoiding unnecessary HTTP.
- **[FEATURE] `needsReLogin()`** — Convenience guard built on `isCurrentDeviceRegistered`. Returns `true` when a SIP user is set locally but no matching device exists on backend — i.e. the local session is stale and the user must logout + login again to re-register. Recommended call sites: app foreground, before critical operations.
- **[FEATURE] `findSipNumberByDeviceId(devices, deviceId)`** — Pure JS helper that returns the `sipNumber` for a given `deviceId` in the devices array (or `null` if not found). Useful for comparing the active SIP account against the local device entry.
- **[FEATURE] `logoutAndWait()`** — Callback-aware logout that resolves **only after** the SDK finishes the backend `devices/remove` HTTP call and clears local state. Eliminates race conditions when the next operation (e.g. `initCallWithUserPassword`) needs to issue `devices/add` immediately. iOS uses `OmiClient.logoutWithCompletion:`; Android uses `OmiClient.logout(onCompleted)` with the SDK's internal 5-second wait window.

### Feature — JS event emitter unified on `DeviceEventEmitter` (Old Arch + New Arch)

**Files:** `ios/Library/OmikitPlugin.swift`, `src/omikit.tsx`

**Root cause:** In React Native New Architecture / bridgeless mode, the codegen TurboModule wrapper does not forward `addListener` / `removeListeners` calls to the underlying `RCTEventEmitter` instance, so its internal `_listenerCount` stays at `0`. `super.sendEvent` then short-circuits with *"sending event with no listeners registered"* and silently drops every event reaching JS — breaking `onCallStateChanged`, `onMuted`, `onSpeaker`, `onHold`, `onCallQuality`, etc. The previous per-module `NativeEventEmitter(module)` JS-side wrapper also did not receive events that the native bridge routed through `RCTDeviceEventEmitter`.

**Fix (iOS):** `OmikitPlugin.swift` now overrides `addListener` / `removeListeners` / `sendEvent` with a 3-tier dispatch strategy:
1. **Tier 1** — `super.sendEvent` when JS listener count > 0 (uses RN-wired path for the active architecture; works on both Old & New Arch).
2. **Tier 2** — `bridge.enqueueJSCall("RCTDeviceEventEmitter", "emit", …)` for Old Arch / interop bridge fallback.
3. **Tier 3** — `callableJSModules.invokeModule(...)` for bridgeless / pure New Arch fallback.

A local `jsListenerCount` mirrors the listener state via overridden `addListener` / `removeListeners`, guaranteeing `startObserving` / `stopObserving` fire at the right boundaries even when the codegen wrapper does not forward to `super`.

**Fix (JS):** `omiEmitter` is now exported as the global `DeviceEventEmitter` on both platforms (iOS & Android, Old Arch & New Arch). This matches the native bridge's `RCTDeviceEventEmitter` dispatch — every event emitted natively is now observable in JS regardless of architecture.

### Improvement — `getDeviceId` / `getAppId` now match `getOmiDevices` payload (Android)

- **[CHANGE] Android `getDeviceId` / `getAppId`** now prefer the new SDK public APIs `OmiClient.getDeviceId()` / `OmiClient.getAppId()` (OmiSDK 2.6.21+) over `OmiClient.registrationInfo` cache. Guarantees the returned values match the `device_id` / `app_id` returned by `getOmiDevices()` so client code can match its own device entry without knowing the internal pattern (`Settings.Secure.ANDROID_ID` / `context.packageName`). Falls back to `registrationInfo` → direct OS lookup on older SDKs.

### Bug Fix (iOS): toggleMute bypasses CallKit — lock screen / banner never updates

**Files:** `ios/CallProcess/CallManager.swift`, `ios/Library/OmikitPlugin.swift`

**Root cause:** `CallManager.toggleMute()` called `call.toggleMute()` directly on the `OMICall` object, bypassing `OMISIPLib.callManager.toggleMute(for:completion:)`. Audio-level mute worked (OMISIP conference bridge connected/disconnected correctly) but CallKit was never notified via `CXSetMutedCallAction` → lock screen mic icon and native call banner always showed mic active. `sendMuteStatus()` and `resolve()` were also called immediately after the direct call, before OMISIP had finished the operation — `call.muted` could be read before it was flipped.

**Fix:**
- `CallManager.toggleMute()` now calls `omiLib.callManager.toggleMute(for:completion:)` — routes through `CXSetMutedCallAction` → CallKit updates native UI → `performSetMutedCallAction:` → OMISIP → `OMICallMediaStateChangedNotification`.
- `OmikitPlugin.toggleMute` moves `resolve()` and `sendMuteStatus()` inside the completion block — `call.muted` is authoritative at that point.
- `toggleMute` resolve/reject params now declared `@escaping` to allow capture inside async completion block.

### Developer Workflow

- **[ADD] `scripts/sync-to-example.sh`** — Syncs `lib/`, `src/`, `ios/`, `android/`, `*.podspec` from the plugin root into `example/node_modules/omikit-plugin/`. Bridges the gap from yarn `file:..` protocol (which copies instead of symlinking) so plugin changes are reflected in the example app without a full `yarn install`.
- **[ADD] npm scripts** in root `package.json`: `yarn sync`, `yarn dev:ios`, `yarn dev:android`, `yarn dev:metro` — sync + run example app in one command.

### Notes

- No caching implemented in this version — each `getOmiDevices` / `isCurrentDeviceRegistered` / `needsReLogin` call performs a fresh HTTP request. Recommended usage: call once after login or on app foreground, not in tight loops.
- These APIs are read-only diagnostics: the SDK never auto-logouts or auto-cleans up backend records. Client apps must decide the recovery action (typically: show alert → `logoutAndWait()` → prompt user to login again).
- On iOS, SDK device-list API is synchronous (blocking HTTP) — bridge wraps in background `DispatchQueue` to keep the JS thread responsive. On Android, the SDK API is `suspend fun` already — bridge uses `Dispatchers.IO`.
- Native side returns snake_case keys on both iOS & Android for backward compatibility with existing internal pipelines; the JS layer normalizes to camelCase via `normalizeDevice()` before returning to client code.

### Dependencies

- Upgrade OmiKit iOS SDK: `1.11.18` → `1.11.19`
- Upgrade OMICore Android SDK: `2.6.20` → `2.6.21`

---

## 4.1.7-mute [04/05/2026] _(superseded — merged into 4.1.7 above)_

### Bug Fix (iOS): toggleMute bypasses CallKit — lock screen / banner never updates

**Files:** `ios/CallProcess/CallManager.swift`, `ios/Library/OmikitPlugin.swift`

**Root cause:** `CallManager.toggleMute()` called `call.toggleMute()` directly on the `OMICall` object, bypassing `OMISIPLib.callManager.toggleMute(for:completion:)`. Audio-level mute worked (OMISIP conference bridge connected/disconnected correctly) but CallKit was never notified via `CXSetMutedCallAction` → lock screen mic icon and native call banner always showed mic active. `sendMuteStatus()` and `resolve()` were also called immediately after the direct call, before OMISIP had finished the operation — `call.muted` could be read before it was flipped.

**Fix:**
- `CallManager.toggleMute()` now calls `omiLib.callManager.toggleMute(for:completion:)` — routes through `CXSetMutedCallAction` → CallKit updates native UI → `performSetMutedCallAction:` → OMISIP → `OMICallMediaStateChangedNotification`.
- `OmikitPlugin.toggleMute` moves `resolve()` and `sendMuteStatus()` inside the completion block — `call.muted` is authoritative at that point.

---

## 4.1.6 [14/04/2026]

### Bug Fixes
- **Fix Android Kotlin 2.0 compile error (all versions)** — refactored `getCurrentUser`, `getGuestUser`, `getUserInfo` to use `val` return from `withContext` + shared `resolveUserResult()` helper, eliminating `if`-as-expression issue compatible with all Kotlin versions

## 4.1.5 [14/04/2026]

### Bug Fixes
- **Fix iOS `codeEndCall` intermittently missing** — `callDealloc` now extracts `OMINotificationEndCauseKey` from the `OMICallDealloc` notification (matching native app behavior) instead of relying on `call.lastStatus` which may not be set at disconnect time
- **Fix iOS `tempCallInfo` cleared too early** — `callStateChanged` no longer resets `tempCallInfo` after disconnect event; `callDealloc` retains and clears it after use, ensuring `codeEndCall` is always available regardless of notification order

## 4.1.4 [14/04/2026]

### Bug Fixes
- **Fix Android build error on Kotlin 2.0+** — `if` without `else` in `withContext` block caused `'if' must have both main and 'else' branches if used as an expression` compile error in `getCurrentUser`

### Dependencies
- Upgrade OMICore Android SDK: 2.6.8 → 2.6.9


## 4.1.3 [13/04/2026]

### Bug Fixes
- **Fix `getCurrentUser` returning `null`/`undefined`** — added debug logging on both iOS and Android to diagnose timing issues where `getCurrentUser` is called before SIP registration completes
- **Fix iOS `getCurrentUser` returning empty object `{}`** — now returns `nil` instead of `[:]` when user not found, so JS receives `undefined` instead of misleading empty object


## 4.1.2 [07/04/2026]

### New Architecture (React Native 0.76+)
- **Fix "supports new architecture: false" warning** — podspec now uses `install_modules_dependencies` (RN 0.71+ standard) instead of manual `ENV['RCT_NEW_ARCH_ENABLED']` check
- **iOS TurboModule declaration** — `OmikitPlugin` conforms to codegen-generated `NativeOmikitPluginSpec` protocol when `RCT_NEW_ARCH_ENABLED=1` via Swift extension
- **Android TurboReactPackage** — migrated `OmikitPluginPackage` from `ReactPackage` to `TurboReactPackage` with lazy module loading via `getModule()` + `getReactModuleInfoProvider()`
- Fully compatible with Old Architecture, New Architecture (interop layer), and bridgeless mode

### Bug Fixes
- **Fix `ClassCastException` on Android (Old Architecture)** — `getInitialCall` was declared as `fun getInitialCall(counter: Int, promise)` but JS passes `{ counter: N }` as a `ReadableMap`; refactored to accept `ReadableMap` and extract `counter` correctly
- **Fix ViewManager instance sharing** — `OmiLocalCameraView` / `OmiRemoteCameraView` are now guaranteed to be the same instance when registered as both NativeModule and ViewManager (prevents `NativeModules.OmiLocalCameraView.refresh()` from affecting a different object than the rendered view)

### Documentation
- Document `tools:node="remove"` for `WRITE_CALL_LOG` permission — users who do not want calls saved to device call history can opt out via `AndroidManifest.xml`

### TurboModule Spec
- Add missing iOS-only methods to `NativeOmikitPlugin.ts` spec: `setCameraConfig`, `setupVideoContainers`, `attachRemoteView`, `attachLocalView`
- Add missing exports to `omikit.tsx`: `getKeepAliveStatus`, `triggerKeepAlivePing`

### Dependencies
- Upgrade OMICore Android SDK: 2.6.5 → 2.6.8
- Upgrade OmiKit iOS SDK: 1.11.4 → 1.11.9

## 4.1.1 [26/03/2026]

### Video Call Optimization
- **Fix video delay 9-10 seconds** (Android → iOS/Web) — real-time video, HD quality
- **Fix switch camera failure** (`PJ_EINVAL` error)
- **Android video auto-scale** — remote video fills screen with correct aspect ratio for app-to-app and app-to-web calls
- **Android video borderRadius** — `OmiLocalCameraView` / `OmiRemoteCameraView` now respect `borderRadius`, `overflow: 'hidden'` from React style props via native `ViewOutlineProvider` + `clipToOutline`

### Expo / RN 0.81+ Compatibility
- **Fix `Unresolved reference: currentActivity`** on Expo 54+ / RN 0.81 bridgeless mode — replaced all direct `currentActivity` access (15+ call sites) with `safeActivity` helper that uses `reactApplicationContext?.currentActivity`
- **Fix `Unresolved reference: runOnUiThread`** — same root cause, `runOnUiThread` accessed via `safeActivity?.runOnUiThread`
- Fully compatible with Old Architecture (bridge), New Architecture (bridgeless), and Expo managed workflow

### iOS Video Call (Fabric / New Architecture)
- **Native window video rendering** for Fabric mode — video containers added to key window with `isUserInteractionEnabled = false` (touch passthrough)
- **Split layout**: remote video top, React controls bottom (Fabric limitation — legacy ViewManager `view()` not called in Fabric)
- **`setupVideoContainers()`** — native method to initialize video when call confirmed
- **`cleanupVideoContainers()`** — native method to remove video views on disconnect
- **`setCameraConfig()`** — native method to adjust remote/local camera position, size, borderRadius, borderColor, scaleMode from JS
- Old Architecture: `<OmiRemoteCameraView>` / `<OmiLocalCameraView>` in JSX works as before

### Example App Updates
- **Video call screen** — full rewrite with proper call state management, mute/speaker/camera toggle, switch camera, call timer, end call navigation
- **Dial call screen** — audio call with hold, transfer, DTMF support
- **Incoming call routing** — auto-detect audio vs video call, navigate to correct screen
- **Disconnect handling** — `cleanupVideoContainers()` on iOS before navigation to prevent ghost video layer

### TypeScript Definitions
- Add missing exports: `OmiLocalCameraView`, `OmiRemoteCameraView`, `setupVideoContainers`, `cleanupVideoContainers`, `setCameraConfig`
- Add `OmiCallState.disconnecting = 12`
- Update all function signatures with proper return types

### Dependencies
- Upgrade OMICore Android SDK: 2.6.4 → 2.6.5
- Upgrade OmiKit iOS SDK: 1.11.2 → 1.11.4

### CI/CD
- Fix `@types/react-native` resolution error — remove deprecated package (built-in since RN 0.76)
- Regenerate `yarn.lock` without stale entries


## 4.1.0 [19/03/2026]

### Video Call — Major Rewrite (iOS + Android)

**Architecture change (iOS)**: Migrated from `OMIVideoViewManager` (manual Metal view management) to `OMIVideoCallManager` (SDK-managed lifecycle).

- **Stable video rendering** — SDK manages Metal drawable pool, frame watchdog, and error recovery automatically
- **Background/foreground recovery** — video resumes automatically when app returns from background
- **Loading indicator** — SDK shows loading overlay while waiting for video frames
- **Camera switch guard** — prevents race conditions during front/back camera switch

**Android rename & unification**: Renamed all `FL*` prefixed video classes to `Omi*` to match iOS naming convention.

- **Unified naming** — Both platforms now use `OmiLocalCameraView` / `OmiRemoteCameraView`
- **Merged ViewManager + Module** — `refresh()` method now lives directly in ViewManager (matches iOS pattern), eliminating separate `*Module` classes
- **Fixed native module registration** — `getName()` now returns `"OmiLocalCameraView"` / `"OmiRemoteCameraView"` matching JS `requireNativeComponent()` and `NativeModules.*` expectations
- **Thread-safe refresh** — `refresh()` now dispatches to UI thread via `UiThreadUtil.runOnUiThread`

### File Changes (Internal Only — JS API Unchanged)

**iOS:**
| Old (internal) | New (internal) |
|---|---|
| `FLLocalCameraView.swift` / `.m` | `OmiLocalCameraViewManager.swift` / `OmiLocalCameraViewBridge.m` |
| `FLRemoteCameraView.swift` / `.m` | `OmiRemoteCameraViewManager.swift` / `OmiRemoteCameraViewBridge.m` |

**Android:**
| Old (4 files) | New (2 files) |
|---|---|
| `FLLocalCameraView.kt` + `FLLocalCameraModule.kt` | `OmiLocalCameraView.kt` (merged) |
| `FLRemoteCameraView.kt` + `FLRemoteCameraModule.kt` | `OmiRemoteCameraView.kt` (merged) |

### Improvements

- Removed dependency on `OMIVideoViewManager` (deprecated old API)
- Reduced view hierarchy: 2 views instead of 4 (iOS), 2 classes instead of 4 (Android)
- Async video setup — no longer blocks JS thread during call connection
- Camera views accept standard RN `style` props (borderRadius, borderWidth, etc.)
- BG→FG observer in `CallManager` calls `prepareForVideoDisplay()` automatically (iOS)
- Consistent `Omi` prefix across both platforms

### Bug Fixes

- Fixed video freeze when switching camera during active call (iOS)
- Fixed memory leak from unreleased Metal views on call disconnect (iOS)
- Fixed blank remote video on incoming call from background (iOS)
- **Fixed Android video views not rendering** — `getName()` mismatch (`FL*` vs `Omi*`) caused `requireNativeComponent` and `NativeModules` to fail silently
- **Fixed Android `refresh()` crash risk** — view layout ops now run on UI thread

### Dependencies

- OmiKit iOS SDK: 1.10.34 → 1.11.2
- OmiSIP framework: Updated with CADisplayLink Metal renderer

---

## 4.0.2 [17/03/2026]

### Bug Fixes — Android Native
- Fix build failure on RN 0.80+ / Kotlin 2.x / Gradle 8.14+ — removed `buildscript` block and `kotlin-bom:1.8.0` from library `build.gradle`
- Fix `currentActivity!!` NPE crash in `checkAndRequestPermissions`, `requestPermissionsByCodes`, `requestPermission` — replaced with null safety
- Fix `getBoolean()` crash when optional params omitted — added `hasKey()` guard (8 call sites)
- Fix `checkPermissionStatus` crash from `Arguments.makeNativeMap` with nested collections — use `WritableNativeMap`
- Fix `systemAlertWindow` / `openSystemAlertSetting` crash on pre-Marshmallow — added runtime API level guard
- Migrate deprecated `lintOptions` → `lint`, `dataBinding` syntax for AGP 8+

### Bug Fixes — JS
- Fix `omiEmitter` undefined crash in New Architecture bridgeless mode — safe module resolution with try-catch fallback chain
- Fix `requireNativeComponent` crash at import time in bridgeless mode — camera views (`OmiLocalCameraView`, `OmiRemoteCameraView`) now use lazy loading via Proxy
- Fix FCM token fetch failure blocking login — wrapped in try-catch with empty string fallback

### New Architecture Support
- `omikit.tsx`: TurboModule → NativeModules → fallback resolution, safe for bridge + bridgeless mode
- `omiEmitter`: `NativeEventEmitter(module)` → `NativeEventEmitter()` → `DeviceEventEmitter` fallback
- Tested on RN 0.80.3 (Kotlin 2.1.20, Gradle 8.14.1) — both Old and New Architecture

### Documentation
- Add API Integration Guide for App-to-App service (`docs/api-integration-guide.md`)
- README: Add App-to-App API section, `startServices()` usage note, VoIP/FCM setup link, Logout API warning
- Add CHANGELOG for v4.0.2

### Build & CI
- Add GitHub Actions workflow for Android build validation on `main-v2`
- Update `gradle.properties` defaults: compileSdk 33→35, Kotlin 1.8.20→2.0.21 (fallback only)

## 4.0.1 [09/03/2026]

### New Features
- Add getter functions: `getProjectId`, `getAppId`, `getDeviceId`, `getFcmToken`, `getSipInfo`, `getVoipToken` (iOS only)
- New Architecture support: TurboModule codegen spec with runtime auto-detection
- `getConstants()` method for exporting event constants to JavaScript
- Add `isSkipDevices` parameter to `initCallWithUserPassword` — set `true` for Customer mode (hotline only), `false` for Agent mode (full outbound)
- Full Quality & Diagnostics: `onCallQuality` event now returns `{ quality, stat: { mos, jitter, latency, packetLoss, lcn } }`
- Add `noNetwork` (11) and `accountTurnOffNumberInternal` (10) to `OmiStartCallStatus` enum

### Bug Fixes
- Fix iOS `getUserInfo` selector mismatch (typo `getUserInfor`)
- Fix NativeEventEmitter crash on iOS New Architecture
- Fix Android name collision between FLLocalCameraModule and FLLocalCameraView
- Fix null guard for `refreshLocalCamera` / `refreshRemoteCamera` on iOS
- Fix Android `networkHealth` only passing `quality` int — now passes full stat map (mos, jitter, latency, packetLoss, lcn)
- Fix iOS `updateNetworkHealth` only passing `quality` int — now passes full stat data (mos, jitter, latency, packetLoss)

### Improvements
- Runtime architecture detection - automatically uses TurboModule or NativeModule
- Enhanced TypeScript definitions with proper return types
- Codegen configuration in `package.json` for automatic native code generation
- iOS TurboModule conformance and constants export
- Android `getConstants()` for event name constants
- Comprehensive README rewrite with API reference, call flow diagrams, end-call status codes, and Quality & Diagnostics documentation

### Security
- Remove `example/android/gradle.properties` from git tracking

### Dependencies
- Update OMIKIT android to version 2.6.4
- Update OMIKIT iOS to version 1.10.34
- React Native peer dependency >= 0.74.0

## 4.0.0 [05/03/2026]

### New Architecture Support
- TurboModule codegen spec (`NativeOmikitPlugin.ts`) with runtime auto-detection
- Fabric component support via interop layer (backward compatible)
- Codegen configuration in `package.json` for automatic native code generation
- iOS TurboModule conformance and `getConstants()` export
- Android `getConstants()` for event name constants
- Runtime architecture detection - automatically uses TurboModule or NativeModule

### Bug Fixes
- Fix iOS `getUserInfo` selector mismatch (typo `getUserInfor`)
- Fix NativeEventEmitter crash on iOS New Architecture
- Fix Android name collision between FLLocalCameraModule and FLLocalCameraView
- Fix null guard for `refreshLocalCamera` / `refreshRemoteCamera` on iOS

### Improvements
- Enhanced TypeScript definitions with proper return types
- React Native peer dependency >= 0.74.0

### Security
- Remove `example/android/gradle.properties` from git tracking

## 3.3.29 [04/03/2026]
- Update OMIKIT android to version 2.5.17
- Update OMIKIT iOS to version 1.10.11
- Add getter functions: `getProjectId`, `getAppId`, `getDeviceId`, `getFcmToken`, `getSipInfo`, `getVoipToken` (iOS only)
- Support 16 Kb Policy of Google

## 3.3.27 [09/02/2025]
- Update OMIKIT android to version 2.5.17
- Update OMIKIT iOS to version 1.10.11
- Support 16 Kb Policy off Google

## 3.3.25 [17/10/2025]
- Update OMIKIT android to version 2.4.25
- Update OMIKIT iOS to version 1.8.53
- Add API check login devices
- Fix issues incoming call in android 15-16


## 3.3.24 [10/10/2025]
- Update OMIKIT android to version 2.4.16
- Fix 

## 3.3.22 [08/10/2025]
- Update OMIKIT android to version 2.4.15
- Update OMIKIT iOS to version 1.8.47


## 3.3.21 [02/10/2025]
- Update OMIKIT android to version 2.4.14
- Fix ARN android


## 3.3.20 [23/09/2025]
- Update OMIKIT android to version 2.4.6


## 3.3.19 [23/09/2025]
- Update OMIKIT android to version 2.4.3
- Support policy 16kb off CH Play


## 3.3.18 [23/09/2025]
- Update OMIKIT android to version 2.4.2
- Update OMIKIT iOS to version 1.8.45
- Improve performance app android sdk  

## 3.3.15 [18/09/2025]
- Remove func check permission off func initCallWithApiKey

## 3.3.14 [17/09/2025]
- Update OMIKIT android to version 2.3.94
- Fix crash SDK Android 
- Hot Fix crash when call func startCallWithUUID 

## 3.3.9 [16/09/2025]
- Update OMIKIT android to version 2.3.90
- Fix crash SDK Android 
- Hot Fix crash when call func startCallWithUUID 


## 3.3.7, 3.3.8 [18/08/2025]
- Update OMIKIT android to version 2.3.88
- Fix crash SDK Android 
- Add func required permission before login OMI

## 3.3.5 [15/08/2025]
- Update OMIKIT android to version 2.3.87
- Fix crash SDK Android 

## 3.3.4 [29/07/2025]
- Update OMIKIT android to version 2.3.84
- Fix crash SDK Android 


## 3.3.3 [29/07/2025]
- Update OMIKIT android to version 2.3.79

  

## 3.3.2 [28/07/2025]
- Update OMIKIT android to version 2.3.78
- Remove permission `camera` at foregroundType 
  

## 3.3.1 [26/07/2025]
- Update OMIKIT android to version 2.3.77
- Update targetSDK 35
  

## 3.2.93
- Update OMIKIT android to version 2.3.76
- Fix show missed call in android
  
## 3.2.92
- Update OMIKIT iOS to version 1.8.44
- Update OMIKIT android to version 2.3.75
- Add API check show missed call 
- Import quality call android

## 3.2.91
- Update OMIKIT iOS to version 1.8.42
- Fix missed transaction_id ở step early khi gọi ra


## 3.2.90
- Fix wrong name isAnswerCallcd a

## 3.2.89
- Update OMIKIT iOS to version 1.8.40
- Update OMIKIT Android to version 2.3.71
- Hot fix reject call android

## 3.2.88
- Update OMIKIT iOS to version 1.8.38
- Hot fix crash khi ở background open foreground

## 3.2.87
- Update OMIKIT Android to version 2.3.70
- Vá lỗi từ chối cuộc gọi ở kịch bản tiêu chí
 

## 3.2.86
- Fix cú pháp swift trong class CallManager


## 3.2.85
- Update OMIKIT iOS to version 1.8.37
- Update OMIKIT Android to version 2.3.69
- Thêm func config từ chối cuộc gọi ở callkit 
- Thêm func dropCall 

## 3.2.84
- Update OMIKIT iOS to version 1.8.32

## 3.2.83
- Update OMIKIT iOS to version 1.8.27

## 3.2.82
- Update OMIKIT Android to version 2.3.67
- Update OMIKIT iOS to version 1.8.20
- Cải thiện codec, fix lỗi codec không reset khi end cuộc gọi 
- Tối ưu SDK Android, cải tiến hiệu năng
- Cải thiện công thức tính MOS
- Nâng cao chất lượng âm thanh, kết nối của cuộc gọi 


## 3.2.81
- Update OMIKIT Android to version 2.3.23

## 3.2.80
- Update OMIKIT iOS to version 1.8.16
- Update show name missed call in ios notification


## 3.2.79
- Update OMIKIT iOS to version 1.8.14
- Update show name missed call in ios notification


## 3.2.78
- Update show name missed call in ios notification

## 3.2.77
- Update OMIKIT iOS to version 1.8.12
- Fix show name missed call in ios from flow call ZCC

## 3.2.75, 3.2.76
- Update OMIKIT iOS to version 1.8.11
- Fix DNS network user block call in iOS
  

## 3.2.74
- Update OMIKIT iOS to version 1.8.10
  

## 3.2.73
- Update documents

## 3.2.72
- Update OMIKIT iOS to version 1.8.9
- Update OMIKIT android to version 2.3.22
- Format data return Client with format camelCase 
- Fix crash when login OMICAll not success 

## 3.2.70
- Update OMIKIT to version 1.8.8
- Add func toggle speaker

## 3.2.69
- Update OMIKIT to version 1.8.8
- Add func toggle speaker

## 3.2.68
- Update OMIKIT to version 1.8.6
- Fix audio when change options

## 3.2.67
- Update OMIKIT to version 1.8.5
- Update OMIKIT android to version 2.3.19

## 3.2.66
- Update Codec property 

## 3.2.65
- Update Codec property 

## 3.2.64
- Hot fix change import file Objective C

## 3.2.63 
- add format import file OmiKitNotification.m 

## 3.2.62
- Add func rejectCall for incoming call

## 3.2.52
- Add event 'onRequestPermissionAndroid' for android

## 3.2.52
- Add func toggle Hold call for ios and android 

## 3.2.51
- Config typescript for ios
  
## 3.2.50
- Try config for static library 

## 3.2.48
- Try config for static library 

## 3.2.47
- Support static library 

## 3.2.46
- Change direction import for ios

## 3.2.45
- Fix error off func getUserInfo for Typescript

## 3.2.44
- Add config for Typescript 

## 3.2.43
- Add config for Typescript 

## 3.2.42
- Add config for Typescript 


## 3.2.41
- fix sendEvent null error on react native 0.76


## 3.2.40
- Update message Error off end call 


## 3.2.39
- Update OMI core Android to version 2.3.12
- Update OMI core Android to version 1.8.1
- Update message Error off end call 
  

## 3.2.38
- Update OMI core Android to version 2.2.85
- Change repo maven
- Update OMI core Android to version 1.7.25
- Fix missed omi_call id off incoming call

## 3.2.37
- Update OMI core Android to version 2.2.83
- Change permission at android 14

## 3.2.36
- Add representName for android 


## 3.2.35
- Update OMI core Android to version 2.2.82
- Fix the error of missing 0 at the beginning of the dialed number

## 3.2.34
- Update OMI core IOS to version 1.7.23
- Update OMI core Android to version 2.2.80
- Fix accept call second for ios
- Improve start call for ios
- Improve FCM for android
- Update new format FCM for android

## 3.2.33
- Update OMI core IOS to version 1.7.17
- Fix call_id off func joinCall

## 3.2.32
- Update OMI core android to version 2.2.42
- Update BroadcastReceiver for Android 14+

## 3.2.31
- Update android maven config


## 3.2.30
- Remove glide android 


## 3.2.29
- Update OMI core android to version 2.2.41
- Remove dependencies glide in Android

## 3.2.28
- Update OMI core android to version 1.7.16

## 3.2.27
- Update OMI core android to version 2.2.40


## 3.2.26
- Update OMI core ios to version 1.7.15
- Fix callkit bug when forwarding multiple times back to self
- Update OMI core android to version 2.2.35
- Improved long call quality for android

## 3.2.25
- Update OMI core ios to version 1.6.38
- Fix missing transactionID 

## 3.2.24
- Update OMI core android to version 2.1.46
- Fix error ARN in android 


## 3.2.23
- Update OMI core android to version 2.1.45
- Update OMI core IOS to version 1.6.37
- Fix error of not being able to turn off notifications when making a call and then killing the app.
- Add log information call, you can easy see quality call in web. 

## 3.2.22
- Update core android to version 2.1.27
- Update ios to version 1.6.34
- Update audio and call quality off Android.
- Fix connection errors related to NAT in Android/iOS.
- Fix crash error related to NAT in iOS


## 3.2.21

- Update Readme
- Add field 'code_end_call' for get code end call 

## 3.2.20

- Pump core android 2.0.80
- Pump core ios 1.6.14

## 3.2.19

- Pump core android

## 3.2.18

- Turn on Log Debug

## 3.2.16

- Turn on Log Debug

## 3.2.15
  - Pump core android
  - Remove function updateToken
  - Prevent registering account multiple times
  - Add params token in fnc register

## 3.2.14
  - Pump core android
  - Add delay check get call info 


## 3.2.12
  - Pump core android

## 3.2.11
  - Pump core android

## 3.2.10
  - Pump core android

## 3.2.9
  - Pump core android

## 3.2.8
  - Pump core android

## 3.2.7
  - Pump core android

## 3.2.6
  - Pump core android

## 3.2.5
  - Pump core android


## 3.2.2
  - Pump core android
  - Add more logs call 

## 3.2.1
  - Pump core android
  - Add more logs call 

## 3.2.0
  - Pump core android
  - Add more logs call 

## 3.1.9
  - Pump core android

## 3.1.8
  - Pump core android


## 3.1.7
  - Pump core android


## 3.1.6
  - Pump core android
  - Pump core ios

## 3.1.5
  - Pump core android
  - Optimize Android performance

## 3.1.4
  - Pump core android
  - Fix issues first call with wifi of android

## 3.1.2
  - Pump core android
  - Fix issues call outgoing with wifi in android

## 3.1.0
  - Pump core android
  - Pump core ios
  - Fix issues call outgoing with wifi in android

## 3.0.9
  - Pump core android
  - Add transfer call android 

## 3.0.8
  - Pump core ios
  - Fix status call ios when endcall

## 3.0.6
  - Pump core android
  - Add function transferCall 

## 3.0.5
  - Fix bug android join call with end call 


## 3.0.4
  - Fix missing file ios



  ## 3.0.3
  - Increase android core
  - Increase android ios
  - Update State call


## 3.0.2
  - Increase android core
  - Increase android ios
  - Update State call 

## 3.0.1
  - Increase android core
  - Update new readme
  - Update sample

## 3.0.0
- **BREAKING CHANGE**
  - Increase android/core core
  - We support lifecycle for calling
  - Support cancel a call 
  - Return `startCallStatus`
  - Update sample

## 2.4.0
- **BREAKING CHANGE**
  - Increase android/core core
  - Support Swift document
  - Support to return `outgoing`, `ringing`, `connecting`, `calling` status
  - Fix null point on release mode Android
  - Improve performance
  - Update sample

## 2.3.4
  - Increase android/iOS core
  - Support to custom channel id
  - Return call quality
  - Update sample

## 2.3.3
  - Increase android core
  - Add `systemAlertWindow`, `openSystemAlertSetting` to check system alert window permission
  - Update sample

## 2.3.2
  - Increase android core
  - Improve background and kill app state
  - Update sample

## 2.3.1
  - Increase android core
  - Improve setup camera
  - Update sample

## 2.3.0
  - Increase android/iOS core
  - Support to receive switchboard
  - Update sample

## 2.2.3
  - Increase android core
  - Allow to set image for the incoming notification
  - Update sample

## 2.2.2
  - Increase android/ ios core
  - Support to change notification icon on Android
  - Update sample

## 2.2.1
  - Update readme

## 2.2.0
  - Increase Android/iOS core version
  - Replace `FMService` to `FirebaseMessageReceiver` in AndroidManifest.xml
  - Support missed call
  - Return call information after the call ending.
  - Add `getCurrentUser`, `getGuestUser` and `getUserInfo` to get user information.
  - Update document and sample
  
## 2.1.2
  - Fix crash when startCall on Android

## 2.1.1
  - Increase Android/iOS core version
  - Add `registerVideoEvent` to register remote video ready.
  - Update document and sample

## 2.1.0
  - Increase Android/iOS core version
  - Add `logout` function
  - Remove appId and deviceId in `updateToken`
  - Update sample
