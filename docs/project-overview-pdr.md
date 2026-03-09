# Project Overview & Product Development Requirements (PDR)

**Last Updated:** 2026-03-06
**Version:** 4.0.1
**Status:** Active Maintenance

---

## 1. Project Overview

### 1.1 Summary

`omikit-plugin` is a React Native SDK that enables VoIP/SIP calling via the OMICALL platform. It wraps the native OmiKit SDKs (iOS Swift + Android Kotlin) and exposes a unified JavaScript/TypeScript API. The plugin supports both Old Architecture (Bridge) and New Architecture (TurboModules/Fabric) with runtime auto-detection.

- **npm package:** [omikit-plugin](https://www.npmjs.com/package/omikit-plugin)
- **Repository:** https://github.com/VIHATTeam/OMICALL-React-Native-SDK
- **Author:** ViHAT Group
- **License:** MIT

### 1.2 Core Value Proposition

- Easy integration with the OMICALL VoIP platform
- Custom Call UI/UX support
- Optimized voice codecs
- Full interface for audio/ringtone/codec control
- Supports push notifications (APNs VoIP + FCM) for background/killed-app call reception
- React Native New Architecture (TurboModules) support from v4.0.0+

---

## 2. Compatibility Matrix

| omikit-plugin | React Native | Architecture | Native iOS SDK | Native Android SDK |
|---------------|--------------|--------------|----------------|-------------------|
| **4.0.1** (latest) | 0.74+ | Old + New (auto) | OmiKit 1.10.34 | OmiSDK 2.6.4 |
| 4.0.0 | 0.74+ | Old + New (auto) | OmiKit 1.10.34 | OmiSDK 2.6.4 |
| 3.3.29 | 0.60-0.73 | Old only | OmiKit 1.10.11 | OmiSDK 2.5.17 |
| 3.3.27 | 0.60-0.73 | Old only | OmiKit 1.10.11 | OmiSDK 2.5.17 |

**Node.js requirement:** >= 16.0.0
**React Native peer dependency:** >= 0.74.0 (for v4.x)

---

## 3. Product Development Requirements (PDR)

### 3.1 Functional Requirements

#### FR-01: Authentication & Registration
- **FR-01.1:** Support login via username/password (`initCallWithUserPassword`)
- **FR-01.2:** Support login via API key (`initCallWithApiKey`)
- **FR-01.3:** Support credential validation without establishing connection (`checkCredentials`)
- **FR-01.4:** Support registration with granular control over notifications and auto-unregister (`registerWithOptions`)
- **FR-01.5:** Logout must be deterministic - use callback-based approach, no arbitrary delays
- **FR-01.6:** Default host to `vh.omicrm.com` when empty string is passed

#### FR-02: Call Lifecycle Management
- **FR-02.1:** Initiate outgoing calls by phone number (`startCall`)
- **FR-02.2:** Initiate outgoing calls by user UUID (`startCallWithUuid`)
- **FR-02.3:** Accept incoming calls (`joinCall`)
- **FR-02.4:** End active calls, sends BYE (`endCall`)
- **FR-02.5:** Reject incoming calls, does not cancel ringing on other devices (`rejectCall`)
- **FR-02.6:** Drop/cancel calls, sends code 603 - cancels ringing on all devices (`dropCall`)
- **FR-02.7:** Transfer active calls to another number (`transferCall`)

#### FR-03: Media Control
- **FR-03.1:** Toggle microphone mute (`toggleMute`)
- **FR-03.2:** Toggle speakerphone (`toggleSpeaker`)
- **FR-03.3:** Toggle call hold (`toggleHold`, `onHold`)
- **FR-03.4:** Send DTMF tones (`sendDTMF`)
- **FR-03.5:** Switch camera during video call (`switchOmiCamera`)
- **FR-03.6:** Toggle video stream (`toggleOmiVideo`)
- **FR-03.7:** Enumerate and select audio output devices (`getAudio`, `setAudio`, `getCurrentAudio`)

#### FR-04: Push Notifications
- **FR-04.1:** Configure push notification parameters (`configPushNotification`)
- **FR-04.2:** Retrieve initial call data on cold start (`getInitialCall`)
- **FR-04.3:** Hide system notification safely without unregistering (`hideSystemNotificationSafely`)
- **FR-04.4:** Hide system notification only (`hideSystemNotificationOnly`)
- **FR-04.5:** Hide system notification and trigger unregistration (`hideSystemNotificationAndUnregister`)

#### FR-05: User & Session Information
- **FR-05.1:** Retrieve current logged-in user details (`getCurrentUser`)
- **FR-05.2:** Retrieve guest user details (`getGuestUser`)
- **FR-05.3:** Look up user info by phone number (`getUserInfo`)

#### FR-06: Getter Functions (Added in v3.3.29 / v4.0.1)
- **FR-06.1:** Get current project ID (`getProjectId`)
- **FR-06.2:** Get current app ID (`getAppId`)
- **FR-06.3:** Get current device ID (`getDeviceId`)
- **FR-06.4:** Get FCM push token (`getFcmToken`)
- **FR-06.5:** Get SIP registration info in `user@realm` format (`getSipInfo`)
- **FR-06.6:** Get VoIP token - iOS only, returns null on Android (`getVoipToken`)

#### FR-07: Permissions (Android)
- **FR-07.1:** Check current permission status (`checkPermissionStatus`)
- **FR-07.2:** Check and request required permissions (`checkAndRequestPermissions`)
- **FR-07.3:** Request system alert window permission (`requestSystemAlertWindowPermission`, `systemAlertWindow`)
- **FR-07.4:** Open system alert settings (`openSystemAlertSetting`)
- **FR-07.5:** Request specific permissions by error codes 450/451/452 (`requestPermissionsByCodes`)

#### FR-08: Video Calls
- **FR-08.1:** Register for remote video events (`registerVideoEvent`)
- **FR-08.2:** Remove video event listeners (`removeVideoEvent`)
- **FR-08.3:** Render local camera view (native component: `FLLocalCameraView`)
- **FR-08.4:** Render remote camera view (native component: `FLRemoteCameraView`)

#### FR-09: Keep-Alive
- **FR-09.1:** Get keep-alive connection status (`getKeepAliveStatus`)
- **FR-09.2:** Manually trigger keep-alive ping (`triggerKeepAlivePing`)

### 3.2 Non-Functional Requirements

#### NFR-01: Architecture Compatibility
- Must support React Native New Architecture (TurboModules + Fabric) from RN 0.74+
- Must maintain full backward compatibility with Old Architecture (RN 0.60-0.73)
- Architecture detection must be automatic at runtime, requiring zero developer configuration

#### NFR-02: Performance
- TurboModule method call latency: 0.1-0.5ms (vs 2-5ms on Old Architecture bridge)
- No blocking `Thread.sleep()` calls on the main or coroutine thread
- All async native operations must use coroutines with proper dispatchers
- Mutex-based locking for thread-safe OmiClient access

#### NFR-03: Stability & Bug Prevention
- Event emitters must not double-fire; `autoUnregisterListener` must fire once per event
- Promises must never hang; null activity checks must resolve promises before returning
- Permission promises must always resolve (granted or denied)
- `onActivityResult` for overlay permission must correctly resolve the pending promise
- Notification handler must not create ghost instances

#### NFR-04: Android-Specific
- Use `NetworkCapabilities` API instead of deprecated `activeNetworkInfo`
- Support 16 KB page size policy (Google Play requirement)
- Target SDK 35 (Android 15)
- Safe casts for all audio device info to prevent ClassCastException

#### NFR-05: TypeScript
- All exported functions must have accurate TypeScript type declarations in `src/types/index.d.ts`
- TurboModule spec (`NativeOmikitPlugin.ts`) must match native implementation exactly
- Enums: `OmiCallState`, `OmiStartCallStatus`, `OmiAudioType`

---

## 4. Acceptance Criteria

| Requirement | Acceptance Criteria |
|-------------|---------------------|
| New Architecture | App running RN New Arch receives and makes calls without crashes |
| Getter Functions | All 6 getter functions return correct values after successful login |
| No Double Events | `CALL_STATE_CHANGED` fires exactly once per state transition |
| Permission Promises | `checkAndRequestPermissions` always resolves (never hangs) |
| Overlay Permission | `requestSystemAlertWindowPermission` resolves after user grants/denies |
| Host Default | Passing `host: ""` uses `vh.omicrm.com` automatically |
| Logout Deterministic | `logout()` resolves only after SDK confirms logout callback |
| Network API | No deprecation warnings for `activeNetworkInfo` on Android M+ |

---

## 5. Version History

| Version | Date | Key Changes |
|---------|------|-------------|
| 4.0.1 | 2026-03-06 | Getter functions, iOS getUserInfo typo fix, NativeEventEmitter crash fix, OmiKit iOS 1.10.34 |
| 4.0.0 | 2026-03-05 | New Architecture (TurboModule) support, Codegen spec, runtime auto-detection |
| 3.3.29 | 2026-03-04 | Getter functions, OmiKit iOS 1.10.11, OmiSDK Android 2.5.17, 16 KB policy |
| 3.3.27 | 2025-02-09 | OmiKit updates, 16 KB policy support |
| 3.3.25 | 2025-10-17 | Android 15/16 incoming call fixes, login devices API |
| 3.3.7-8 | 2025-08-18 | Required permissions before login, Android crash fixes |
| 3.2.82 | - | OmiSDK 2.3.67, improved codec, MOS calculation, performance |
| 3.0.0 | - | BREAKING: Call lifecycle support, startCallStatus return |
