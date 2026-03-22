# Project Roadmap

**Last Updated:** 2026-03-06
**Current Version:** 4.0.1

---

## Recently Completed (v3.3.27 - v4.0.1)

### v4.0.1 (2026-03-06) - Stability Release
- [x] Getter functions: `getProjectId`, `getAppId`, `getDeviceId`, `getFcmToken`, `getSipInfo`, `getVoipToken`
- [x] Fix iOS `getUserInfo` selector mismatch (typo `getUserInfor`)
- [x] Fix `NativeEventEmitter` crash on iOS New Architecture
- [x] Fix Android name collision — renamed `FL*` → `Omi*`, merged Module into ViewManager
- [x] Fix null guard for `refreshLocalCamera` / `refreshRemoteCamera` on iOS
- [x] Update OmiKit iOS to 1.10.34
- [x] Update OmiSDK Android to 2.6.4

### v4.0.0 (2026-03-05) - New Architecture
- [x] TurboModule codegen spec (`NativeOmikitPlugin.ts`)
- [x] Runtime auto-detection (TurboModule vs NativeModule)
- [x] `getConstants()` method for event constants on both platforms
- [x] Codegen configuration in `package.json`
- [x] iOS TurboModule conformance
- [x] React Native peer dependency >= 0.74.0

### v3.3.29 (2026-03-04)
- [x] Getter functions (iOS + Android)
- [x] 16 KB page size policy support (Google Play)
- [x] OmiKit iOS 1.10.11, OmiSDK Android 2.5.17

### v3.3.25 (2025-10-17)
- [x] Android 15/16 incoming call fixes
- [x] Login devices check API
- [x] OmiSDK Android 2.4.25, OmiKit iOS 1.8.53

### Android Bug Fixes (v3.3.x series)
- [x] Fixed double-firing events in `autoUnregisterListener`
- [x] Fixed promise hanging with null activity checks
- [x] Fixed permission promise never resolved
- [x] Fixed overlay permission `onActivityResult`
- [x] Removed `Thread.sleep()` blocking calls
- [x] Fixed ghost instance in notification handler
- [x] Safe casts for audio info (prevent `ClassCastException`)
- [x] Fixed deprecated `activeNetworkInfo` → `NetworkCapabilities`
- [x] Fixed double-resolve in `initCallWithUserPassword`
- [x] Replaced `delay()` with logout callback for deterministic login flow
- [x] Host defaults to `"vh.omicrm.com"` when empty string passed

---

## Planned (Near-Term)

### v4.1.0 - Quality & Diagnostics
- [x] Call quality metrics API - expose MOS score to JavaScript
- [x] Diagnostic logging API - let apps retrieve SDK logs for support
- [x] Network quality indicator events (jitter, packet loss, RTT)
- [x] Retry mechanism hooks - expose retry state to JavaScript

### v4.2.0 - Enhanced Permissions
- [ ] Unified permissions API across iOS and Android
- [ ] Pre-flight permission check before login (consolidated API)
- [ ] Background task permission support for Android 15+
- [ ] Bluetooth permission handling for Android 12+

### v4.3.0 - Video Improvements
- [ ] Mirror mode toggle for local camera
- [ ] Video quality settings (resolution, bitrate)
- [ ] Background blur support
- [ ] Screen sharing support (Android)

---

## Planned (Mid-Term)

### v5.0.0 - Major Refactor (Potential Breaking Changes)
- [ ] Full Fabric native component implementation (replace ViewManager interop layer)
- [ ] Typed event payloads (replace `any` in event data types)
- [ ] Unified call info object - standardize payload structure across iOS/Android
- [ ] Remove all deprecated APIs: `preventAutoUnregister`, `prepareForIncomingCall`, `prepareForOutgoingCall`
- [ ] Expo module compatibility (bare workflow without `react-native-builder-bob`)

---

## Backlog / Under Consideration

- [ ] Conference call support (multi-party)
- [ ] Call recording API
- [ ] Custom STUN/TURN server configuration via JavaScript API
- [ ] React Native Web support (WebRTC-based)
- [ ] TypeScript strict mode - eliminate all remaining `any` types
- [ ] Unit test coverage for JavaScript layer (Jest)
- [ ] Integration tests with Detox
- [ ] Expo plugin for managed workflow support

---

## Maintenance Commitments

- **Active maintenance:** Patch releases for critical bugs within 1-2 weeks of report
- **OmiKit iOS updates:** Tracked with each OmiKit release
- **OmiSDK Android updates:** Tracked with each OmiSDK release
- **React Native compatibility:** Test against each new RN minor release
- **Android API level:** Target SDK always kept within 1 level of current Android release
- **16 KB page size:** Maintained for all Android releases (Google Play requirement)

---

## Known Limitations / Technical Debt

| Item | Status | Priority |
|------|--------|----------|
| `autoUnregisterListener` timing edge cases | Monitoring | Medium |
| iOS VoIP background wakeup time constraint (30s) | Platform limitation | N/A |
| `getKeepAliveStatus` / `triggerKeepAlivePing` not documented | Documentation debt | Low |
| `preventAutoUnregister`, `prepareForIncomingCall` deprecated but not removed | Technical debt | Low |
| ~~`FLLocalCameraModule` / `FLLocalCameraView` name similarity~~ | **Resolved** in v4.1.0 — merged into `OmiLocalCameraView` | Done |
| No automated tests for native modules | Testing gap | High |
| Example app `GoogleService-Info.plist` in repo | Security hygiene | Medium |
