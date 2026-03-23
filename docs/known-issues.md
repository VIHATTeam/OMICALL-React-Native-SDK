# Known Issues & Limitations

## iOS — Video Call on New Architecture (Fabric)

### 1. Camera Switch Delay (~3-6s)

**Symptom:** When calling `switchOmiCamera()`, remote video freezes for 3-6 seconds before resuming with the new camera.

**Root Cause:** OmiKit SDK's Metal renderer requires a "3s stabilization period" after each camera switch. During this time, the SDK suppresses re-INVITE and waits for Metal stream to stabilize.

**SDK Logs:**
```
📹 [switchCamera] Camera switch STARTED (gen=N) — re-INVITE suppressed during switch
📹 [switchCamera] FIX X2: Camera switch COMPLETED — starting 3s Metal stabilization
📹 [switchCamera] FIX X2+Z: Metal stabilization complete — isCameraSwitching cleared
```

**Impact:** User experiences brief video freeze. Audio continues normally.

**Workaround:** Show a "Switching camera..." indicator in UI during the switch. Listen for the delay and hide indicator after ~4s.

**Fix Required:** OmiKit native SDK optimization — reduce Metal stabilization timeout or implement seamless camera hot-swap.

---

### 2. RCTViewManager.view() Not Called on Fabric

**Symptom:** `<OmiRemoteCameraView>` and `<OmiLocalCameraView>` render as empty/blank views on iOS with New Architecture (Fabric) enabled.

**Root Cause:** React Native 0.76 Fabric renderer does **not** call `RCTViewManager.view()` for legacy ViewManagers, even with:
- `unstable_reactLegacyComponentNames` configured
- `RCTLegacyViewManagerInteropComponentView supportLegacyViewManagerWithName:` called
- `bridgelessEnabled = NO`

This is a known limitation of RN 0.76 Fabric interop layer.

**Impact:** Video cannot render inside React view hierarchy on iOS Fabric. Requires native window rendering workaround.

**Current Workaround:**
- Plugin creates native containers via `setupVideoContainers()` and adds them directly to `UIWindow`
- Video renders on top portion of window (~60-75%)
- React controls render below video area (not overlaid)
- User adjusts video position/size via `setCameraConfig()`

**Ideal Fix:** Create proper Fabric C++ component views (`RCTViewComponentView` subclass). Requires Fabric component `.mm` files compiled within the app target (not pod), which is not practical for a library SDK. Waiting for RN to improve Fabric interop for library ViewManagers.

---

### 3. Video + Controls Cannot Overlay on iOS Fabric

**Symptom:** When native video is added to UIWindow, it visually covers React controls. Controls receive touches (via `isUserInteractionEnabled = false`) but are not visible.

**Root Cause:**
- Native video on UIWindow sits **above** React root view in z-order
- React root view (RCTRootView/RCTSurfaceHostingProxyRootView) has **opaque background** managed by RN internals
- Setting transparent background on React views is overridden by React re-renders
- CALayer composition doesn't work because Metal renderer requires UIView in view hierarchy
- Separate UIWindow approach fails because RCTRootView opacity cannot be controlled

**Impact:** On iOS Fabric, video call screen shows video in top area and controls in bottom area (split layout), rather than controls overlaid on full-screen video.

**Current Workaround:**
- Remote video covers top ~60-75% of screen
- Controls panel at bottom ~25-40% — always visible
- User can adjust split ratio via `setCameraConfig()`

**Approaches Tried & Failed:**
1. Video ON TOP + transparent React root → React re-renders override transparency
2. Video BEHIND React root (insertSubview at 0) → RCTRootView opaque
3. Recursive backgroundColor clear → React re-renders override
4. Separate UIWindow below React → RCTRootView opaque
5. Separate PassthroughWindow above React → video visible, controls hidden
6. CALayer composition (insertSublayer) → Metal needs UIView, not just CALayer
7. Fabric C++ component → header dependency issues in pod target

---

## iOS — General

### 4. NativeEventEmitter Not Working on Fabric

**Symptom:** `omiEmitter.addListener()` does not receive events on iOS New Architecture.

**Root Cause:** `NativeEventEmitter` with module parameter does not work correctly in Fabric/bridge hybrid mode on RN 0.76.

**Workaround:** Use `DeviceEventEmitter` directly instead of `omiEmitter`:
```typescript
import { DeviceEventEmitter } from 'react-native';
import { OmiCallEvent } from 'omikit-plugin';

DeviceEventEmitter.addListener(OmiCallEvent.onCallStateChanged, (data) => {
  // Works on both Old and New Architecture
});
```

**Impact:** Example app already uses `DeviceEventEmitter`. Library exports `omiEmitter` for backward compatibility but recommends `DeviceEventEmitter` for New Arch.

---

## Android — General

### 5. Firebase FCM Token Error on Example App

**Symptom:** Login fails with `[messaging/unknown] java.io.IOException: INTERNAL_SERVER_ERROR`

**Root Cause:** Example app's `google-services.json` is configured for a different Firebase project/package name.

**Impact:** Example app only. Customer apps with correct Firebase config are not affected.

**Workaround:** Pass empty `fcmToken: ''` to test login without push notifications. Or replace `google-services.json` with one matching `com.omikitpluginexample`.

---

## Cross-Platform

### 6. Simulator/Emulator Not Supported for VoIP

**Symptom:** App crashes or VoIP features don't work on iOS Simulator or Android Emulator.

**Root Cause:**
- iOS: OmiKit binary is arm64 device-only. CallKit and PushKit don't work on Simulator.
- Android: SIP stack needs real network, microphone routing differs on emulator.

**Impact:** Must test on physical devices. UI/login can be tested on Android emulator but not iOS simulator.

---

## Version Compatibility

| Issue | Affects | Status |
|-------|---------|--------|
| Camera switch delay | iOS (all versions) | SDK limitation |
| ViewManager.view() not called | iOS Fabric (RN 0.76+) | Workaround in place |
| Video + controls overlay | iOS Fabric (RN 0.76+) | Split layout workaround |
| NativeEventEmitter broken | iOS Fabric (RN 0.76+) | Use DeviceEventEmitter |
| FCM token error | Example app only | Config issue |
| Simulator not supported | iOS/Android | Hardware requirement |
