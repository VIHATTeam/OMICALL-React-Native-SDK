# Code Standards

**Last Updated:** 2026-03-06
**Applies to:** omikit-plugin v4.0.x+

---

## 1. TypeScript / JavaScript Standards

### 1.1 Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Functions | camelCase | `startCall`, `getProjectId` |
| Constants/Enums | PascalCase | `OmiCallEvent`, `OmiCallState` |
| Enum values | camelCase | `OmiCallState.confirmed` |
| Event name strings | SCREAMING_SNAKE_CASE | `CALL_STATE_CHANGED` |
| Parameters/fields | camelCase | `phoneNumber`, `isVideo`, `fcmToken` |

### 1.2 Function Signatures

All public functions must:
- Return a `Promise<T>` (async native bridge)
- Accept strongly-typed parameter objects (not raw `any` where avoidable)
- Be declared in both `src/omikit.tsx` (implementation) and `src/types/index.d.ts` (declaration)
- Have a matching entry in `src/NativeOmikitPlugin.ts` (TurboModule spec)

```typescript
// Good: typed parameter object
export function startCall(data: {
  phoneNumber: string;
  isVideo: boolean;
}): Promise<{ status: number; message: string; _id: string }>;

// Avoid: raw any where structure is known
export function startCall(data: any): Promise<any>;
```

### 1.3 TurboModule Spec (`NativeOmikitPlugin.ts`)

- Must import `TurboModule` from `'react-native'`
- Interface name: `Spec extends TurboModule`
- Every method must have explicit parameter types and return types
- `getConstants()` must return an object with all event name string constants
- Group methods with comments matching their category

### 1.4 Type Declarations (`src/types/index.d.ts`)

- Use `declare module 'omikit-plugin'` wrapper
- Export all enums as TypeScript `enum` (not const enum)
- Export `OmiCallEvent` as `const` with explicit string types
- Export `omiEmitter` with its `NativeEventEmitter` type
- Platform-specific functions (Android-only) return `Promise<null>` on iOS

### 1.5 Comments

All comments in source code must be written in English.

---

## 2. Android (Kotlin) Standards

### 2.1 Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Classes | PascalCase | `OmikitPluginModule`, `OmiRegistrationStatus` |
| Functions | camelCase | `startCall`, `getProjectId` |
| Constants | SCREAMING_SNAKE_CASE | `CALL_STATE_CHANGED`, `NAME` |
| Parameters | camelCase | `phoneNumber`, `isVideo` |
| Private fields | camelCase | `permissionPromise`, `isCallInProgress` |
| Companion object | `companion object` | Standard pattern |

### 2.2 React Native Module Pattern

```kotlin
// Class must extend ReactContextBaseJavaModule
class OmikitPluginModule(reactContext: ReactApplicationContext?) :
  ReactContextBaseJavaModule(reactContext), OmiListener {

  // NAME constant for module registration
  companion object {
    const val NAME = "OmikitPlugin"
    @Volatile var moduleInstance: OmikitPluginModule? = null
  }

  // Module name exposed to JavaScript
  override fun getName(): String = NAME

  // Export constants to JavaScript
  override fun getConstants(): MutableMap<String, Any> {
    return mutableMapOf(
      "CALL_STATE_CHANGED" to CALL_STATE_CHANGED,
      // ... all event constants
    )
  }

  // All @ReactMethod functions must accept Promise as last parameter
  @ReactMethod
  fun startCall(data: ReadableMap, promise: Promise) {
    // implementation
  }
}
```

### 2.3 Promise Handling Rules

- Every `@ReactMethod` must resolve or reject its `Promise`; never let it hang
- Always check for null context/activity before proceeding:
  ```kotlin
  val activity = currentActivity ?: run {
    promise.resolve(false)
    return
  }
  ```
- Use `try/catch` blocks and resolve on exception (not reject, unless error info is needed)
- For permission callbacks, always resolve in all branches (granted and denied)
- For `onActivityResult`, match `requestCode` before resolving

### 2.4 Thread Safety

- Use `CoroutineScope(Dispatchers.Main)` for UI-thread operations
- Use `Mutex` (kotlinx.coroutines) for shared OmiClient access:
  ```kotlin
  private val omiClientMutex = Mutex()
  omiClientMutex.withLock { /* OmiClient operation */ }
  ```
- Use `synchronized(callStateLock)` for call state boolean flags
- Mark shared fields with `@Volatile` when accessed from multiple threads
- Never use `Thread.sleep()` - use coroutine `delay()` only when necessary, prefer callbacks

### 2.5 Safe Type Casting

Always use safe casts for data from OmiSDK callbacks:
```kotlin
// Good
val name = audioInfo["name"] as? String ?: ""
val type = audioInfo["type"] as? Int ?: 0

// Bad - can throw ClassCastException
val name = audioInfo["name"] as String
```

### 2.6 Network Check

Use `NetworkCapabilities` API (not deprecated `activeNetworkInfo`):
```kotlin
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
  val network = connectivityManager.activeNetwork ?: return false
  val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
  capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
} else {
  @Suppress("DEPRECATION")
  connectivityManager.activeNetworkInfo?.isConnectedOrConnecting == true
}
```

### 2.7 WritableMap Creation

Use the `createSafeWritableMap()` helper for all event payloads:
```kotlin
val eventData = mapOf(
  "callerNumber" to phoneNumber,
  "status" to callState.value,
  "isVideo" to isVideo
)
val map = createSafeWritableMap(eventData)
sendEvent(CALL_STATE_CHANGED, map)
```

### 2.8 Event Listener Deduplication

Event listeners registered via `client.addCallStateListener()` must not double-fire. The `autoUnregisterListener` pattern:
```kotlin
val autoUnregisterListener = object : OmiListener {
  override fun onCallEnd(...) {
    client.removeCallStateListener(this) // Remove self after first fire
    // handle event
  }
}
```

---

## 3. iOS (Swift) Standards

### 3.1 Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Classes | PascalCase | `CallManager`, `OmiUtils` |
| Functions | camelCase | `endCall`, `rejectCall` |
| Properties | camelCase | `isSpeaker`, `videoManager` |
| Constants | camelCase | `guestPhone` |
| Static instances | `instance` | Singleton pattern |

### 3.2 Singleton Pattern

```swift
class CallManager {
  static private var instance: CallManager? = nil

  static func shareInstance() -> CallManager {
    if instance == nil {
      instance = CallManager()
    }
    return instance!
  }
}
```

### 3.3 Lazy Initialization for Heavy Resources

To prevent crashes during New Architecture module loading, use lazy initialization:
```swift
// Good: lazy prevents crash during module init
private lazy var omiLib: OMISIPLib = {
  return OMISIPLib.sharedInstance()
}()

// Bad: eager init crashes during TurboModule loading
private var omiLib = OMISIPLib.sharedInstance()
```

### 3.4 Null Safety

Always use optional chaining and guard statements:
```swift
guard let callInfo = omiLib.getCurrentCall() else { return }
guard callInfo.callState != .disconnected else { return }
```

### 3.5 Method Selector Matching

Objective-C bridge method names must exactly match the Swift function names. Common mistake:
```swift
// Wrong (typo causes selector mismatch)
@objc func getUserInfor(...) // <- "Infor" typo

// Correct
@objc func getUserInfo(...)
```

### 3.6 NativeEventEmitter Compatibility

For New Architecture (TurboModule), pass `undefined` as the module to avoid crash:
```typescript
// In omikit.tsx - correct pattern
const omiEmitter = Platform.OS === 'ios'
  ? new NativeEventEmitter(isTurboModuleEnabled ? undefined as any : NativeModules.OmikitPlugin)
  : DeviceEventEmitter;
```

---

## 4. Event Naming Standards

All event names are defined as constants and must be consistent across native and JavaScript layers:

```
Native constant name    →   JS OmiCallEvent key        →   JS string value
─────────────────────────────────────────────────────────────────────────
CALL_STATE_CHANGED      →   onCallStateChanged         →   'CALL_STATE_CHANGED'
MUTED                   →   onMuted                    →   'MUTED'
HOLD                    →   onHold                     →   'HOLD'
SPEAKER                 →   onSpeaker                  →   'SPEAKER'
REMOTE_VIDEO_READY      →   onRemoteVideoReady         →   'REMOTE_VIDEO_READY'
CLICK_MISSED_CALL       →   onClickMissedCall          →   'CLICK_MISSED_CALL'
SWITCHBOARD_ANSWER      →   onSwitchboardAnswer        →   'SWITCHBOARD_ANSWER'
CALL_QUALITY            →   onCallQuality              →   'CALL_QUALITY'
AUDIO_CHANGE            →   onAudioChange              →   'AUDIO_CHANGE'
REQUEST_PERMISSION      →   onRequestPermissionAndroid →   'REQUEST_PERMISSION'
```

---

## 5. API Design Guidelines

### 5.1 Parameter Objects vs Positional Args

Prefer parameter objects for native bridge calls (maps to `ReadableMap` on Android):
```typescript
// Good - extensible, named parameters
startCall({ phoneNumber: '0901234567', isVideo: false })

// Avoid - positional args are hard to extend
startCall('0901234567', false)
```

### 5.2 Return Types

| Function type | Return type |
|--------------|-------------|
| Simple action | `Promise<boolean>` |
| Data retrieval | `Promise<T \| null>` |
| Call initiation | `Promise<{ status: number; message: string; _id: string }>` |
| Credential check | `Promise<{ success: boolean; statusCode?: number; message?: string }>` |
| Void actions | `Promise<void>` |

### 5.3 Platform-Specific Functions

Wrap Android-only functions with platform check:
```typescript
export function checkPermissionStatus(): Promise<any> {
  if (Platform.OS !== 'android') {
    return Promise.resolve(null);
  }
  return OmikitPlugin.checkPermissionStatus();
}
```

### 5.4 Deprecation

- Do not remove deprecated methods immediately; mark with JSDoc `@deprecated`
- Keep backward compatibility for at least one major version
- Document migration path in CHANGELOG.md

---

## 6. Codegen Configuration

The `package.json` `codegenConfig` section configures New Architecture code generation:

```json
"codegenConfig": {
  "name": "RNOmikitPluginSpec",
  "type": "all",
  "jsSrcsDir": "src",
  "android": {
    "javaPackageName": "com.omikitplugin"
  },
  "ios": {}
}
```

- `name`: Must match the spec name used in native registration
- `type: "all"`: Generates both TurboModule and Fabric specs
- `jsSrcsDir`: Points to the directory containing `NativeOmikitPlugin.ts`

---

## 7. Versioning

Follow semantic versioning (SemVer):
- **Major** (4.x.x): Breaking changes or major architecture shifts
- **Minor** (x.0.x): New features, new API methods (non-breaking)
- **Patch** (x.x.1): Bug fixes, dependency updates, minor improvements

Release process uses `release-it` with `@release-it/conventional-changelog` plugin.
