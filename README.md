# 📦 OMICALL SDK FOR React-Native

The OmiKit exposes the 📦 <a href="https://www.npmjs.com/package/omikit-plugin">omikit-plugin</a>.

The most important part of the framework is :

- ✅ Help to easy integrate with Omicall.
- ✅ Easy custom Call UI/UX.
- ✅ Optimize codec voip for you.
- ✅ Full inteface to interactive with core function like sound/ringtone/codec.

### 📝 Status

Currently active maintenance and improve performance
<br>

## 📋 Compatibility & Version Guide

**Choose the right version for your React Native project:**

| omikit-plugin | React Native | Architecture Support | Installation |
|---------------|--------------|---------------------|--------------|
| **4.0.x** ✨ | **0.74+** | Old + New (Auto-detect) | `npm install omikit-plugin@latest` |
| **3.3.x** | **0.60 - 0.73** | Old Architecture Only | `npm install omikit-plugin@3.3.27` |

### 🎯 How to Choose:

```bash
# Check your React Native version
npx react-native --version

# If React Native 0.74+:
npm install omikit-plugin@latest  # Get v4.0.x with New Architecture support

# If React Native 0.60 - 0.73:
npm install omikit-plugin@3.3.27  # Stable Old Architecture version
```

### ⚡ New in v4.0.x:
- ✅ **TurboModules** - 4-10x faster method calls (0.1-0.5ms vs 2-5ms)
- ✅ **Fabric Components** - Optimized video rendering
- ✅ **100% Backward Compatible** - Works on Old Architecture too
- ✅ **Zero Breaking Changes** - Drop-in replacement for v3.x on RN 0.74+

> **Note:** If you're on React Native 0.74+ but not ready for New Architecture, v4.0.x will automatically use Old Architecture. You get the same stability as v3.x with future-proof code.

<br>

## 🏗️ Architecture Support

### ⚡ New Architecture (React Native 0.74+)
✅ **Fully Supported** - Automatic detection and optimization

This SDK uses:
- **TurboModules** for fast native method calls (JSI-based)
- **Fabric** for optimized video rendering
- **Type-safe** Codegen specifications

### 🔄 Old Architecture (React Native 0.60-0.73)
✅ **Fully Supported** - No changes needed

The SDK automatically falls back to legacy bridge when needed.

### 🚀 No Configuration Required
The SDK detects your architecture at runtime. **No flags, no setup.**

Want New Architecture performance? See [Migration Guide](./docs/NEW_ARCHITECTURE_MIGRATION.md)

<br>

## 📚 Enums Reference

### OmiCallState
Call state enum for tracking call lifecycle:

```typescript
import { OmiCallState } from 'omikit-plugin';

enum OmiCallState {
  unknown = 0,      // Initial state
  calling = 1,      // Outgoing call initiated
  incoming = 2,     // Incoming call received
  early = 3,        // Ringing (outgoing)
  connecting = 4,   // Call being established
  confirmed = 5,    // Call active ✅
  disconnected = 6, // Call ended
  hold = 7,         // Call on hold
}
```

### OmiStartCallStatus
Status codes returned by `startCall()` function:

```typescript
import { OmiStartCallStatus } from 'omikit-plugin';

enum OmiStartCallStatus {
  // Validation errors (0-3)
  invalidUuid = 0,              // Invalid user UUID
  invalidPhoneNumber = 1,       // Invalid phone number format
  samePhoneNumber = 2,          // Cannot call same phone number
  maxRetry = 3,                 // Maximum retry attempts reached

  // Permission errors (4, 450-452)
  permissionDenied = 4,         // Microphone/Camera permission denied
  permissionMicrophone = 450,   // Microphone permission required (Android 15+)
  permissionCamera = 451,       // Camera permission required (Android 15+)
  permissionOverlay = 452,      // System alert window permission required

  // Call errors (5-7)
  couldNotFindEndpoint = 5,     // Could not find endpoint
  accountRegisterFailed = 6,    // Account registration failed
  startCallFailed = 7,          // Start call failed

  // Success statuses (8, 407)
  startCallSuccess = 8,         // Call initiated successfully (Android)
  startCallSuccessIOS = 407,    // Call initiated successfully (iOS)

  // Other errors (9+)
  haveAnotherCall = 9,          // Already have another call in progress
}
```

### OmiAudioType
Audio output types for `setAudio()` function:

```typescript
import { OmiAudioType } from 'omikit-plugin';

enum OmiAudioType {
  receiver = 0,     // Phone receiver (earpiece)
  speaker = 1,      // Phone speaker
  bluetooth = 2,    // Bluetooth device
  headphones = 3,   // Wired headphones
}

// Usage example
import { setAudio, OmiAudioType } from 'omikit-plugin';

// Switch to speaker
setAudio({ portType: OmiAudioType.speaker });

// Switch to bluetooth
setAudio({ portType: OmiAudioType.bluetooth });
```

<br>

## 📞 Call Flow Diagram

### Incoming Call Flow (iOS with CallKit)

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Remote  │   │OMI Server│   │   APNS   │   │  OmiKit  │   │ CallKit  │   │   App    │
└────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │              │              │              │
     │  1. INVITE   │              │              │              │              │
     │─────────────>│              │              │              │              │
     │              │  2. VoIP Push│              │              │              │
     │              │─────────────>│              │              │              │
     │              │              │  3. Push payload            │              │
     │              │              │─────────────────────────────>              │
     │              │              │              │  4. VoIPPushHandler.handle()│
     │              │              │              │<─────────────────────────────
     │              │              │              │  5. Report incoming call    │
     │              │              │              │─────────────>│              │
     │              │              │              │              │ 6. Show CallKit UI
     │              │              │              │              │─────────────>│
     │              │              │              │  7. State: incoming (2)     │
     │              │              │              │─────────────────────────────>
     │              │              │              │              │              │
     │              │              │              │  User accepts call          │
     │              │              │              │              │<─────────────│
     │              │              │              │  8. InboundCallAccepted     │
     │              │              │              │<──────────────              │
     │              │              │              │  9. joinCall()              │
     │              │  10. 200 OK  │              │<─────────────────────────────
     │<───────────────────────────────────────────│              │              │
     │              │              │              │  11. State: connecting (4)  │
     │              │              │              │─────────────────────────────>
     │              │              │              │  12. State: confirmed (5) ✅│
     │              │              │              │─────────────────────────────>
     │              │              │              │              │  13. Navigate to ActiveCallView
     │              │              │              │              │              │ Start timer, Audio ON
     │              │              │              │              │              │
     │              │    ═══════════ CALL IN PROGRESS  ═══════════              │
     │              │              │              │              │              │
     │  14. BYE     │              │              │              │              │
     │─────────────>│              │              │              │              │
     │              │              │              │  15. State: disconnected (6)│
     │              │              │              │─────────────────────────────>
     │              │              │              │  16. OMICallDealloc (602)   │
     │              │              │              │─────────────────────────────>
     │              │              │              │              │  17. Hide call UI
     │              │              │              │              │              │ Stop timer
```

### Incoming Call Flow (Android)

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Remote  │   │OMI Server│   │   FCM    │   │  OmiKit  │   │   App    │
└────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │              │              │
     │  1. INVITE   │              │              │              │
     │─────────────>│              │              │              │
     │              │  2. FCM Push │              │              │
     │              │─────────────>│              │              │
     │              │              │  3. Push data (phone, isVideo)
     │              │              │─────────────>│              │
     │              │              │              │  4. Start ForegroundService
     │              │              │              │─────────────>│
     │              │              │              │  5. Show fullscreen incoming call
     │              │              │              │              │ Notification + Activity
     │              │              │              │  6. State: incoming (2)
     │              │              │              │─────────────>│
     │              │              │              │              │
     │              │              │              │  User accepts│
     │              │              │              │<─────────────│
     │              │              │              │  7. joinCall()
     │              │  8. 200 OK   │              │<─────────────│
     │<───────────────────────────────────────────│              │
     │              │              │              │  9. State: confirmed (5) ✅
     │              │              │              │─────────────>│
     │              │              │              │              │ Navigate to ActiveCallView
     │              │              │              │              │ Start timer, Audio ON
     │              │              │              │              │
     │              │    ═══════════ CALL IN PROGRESS ═══════════
     │              │              │              │              │
     │  10. BYE     │              │              │              │
     │─────────────>│              │              │              │
     │              │              │              │  11. State: disconnected (6)
     │              │              │              │─────────────>│
     │              │              │              │  12. Stop ForegroundService
     │              │              │              │              │ Hide call UI
```

### Outgoing Call Flow

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│   App    │   │  OmiKit  │   │OMI Server│   │  Callee  │
└────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │              │
     │  1. startCall({phoneNumber, isVideo})      │
     │─────────────>│              │              │
     │              │  2. Validate permissions    │
     │              │              │              │
     │              │  3. INVITE   │              │
     │              │─────────────>│              │
     │              │              │  4. Push     │
     │              │              │─────────────>│
     │              │  5. State: calling (1)      │
     │<──────────────              │              │
     │              │              │  6. 180 Ringing
     │              │<──────────────              │
     │              │  7. State: early (3) 🔔     │
     │<──────────────              │              │
     │              │              │  8. 200 OK   │
     │              │<─────────────────────────────
     │              │  9. State: confirmed (5) ✅ │
     │<──────────────              │              │
     │              │  10. REMOTE_VIDEO_READY [if video]
     │<──────────────              │              │
     │              │              │              │
     │   Navigate to ActiveCallView│              │
     │   Start timer, Audio ON     │              │
     │              │              │              │
     │    ═══════════ CALL IN PROGRESS ═══════════
     │              │              │              │
     │  11. endCall()              │              │
     │─────────────>│              │              │
     │              │  12. BYE     │              │
     │              │─────────────>│              │
     │              │              │  13. 200 OK  │
     │              │<──────────────              │
     │              │  14. State: disconnected (6)│
     │<──────────────              │              │
     │  Hide call UI │             │              │
```

### Call State Machine

```
                    ┌─────────────┐
                    │   Unknown   │ (0) - App Start
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
         startCall()              Receive Push
              │                         │
              ▼                         ▼
      ┌──────────────┐          ┌──────────────┐
      │   Calling    │ (1)      │   Incoming   │ (2)
      └──────┬───────┘          └──────┬───────┘
             │                         │
             │ 180 Ringing        ┌────┴─────┐
             ▼                    │          │
      ┌──────────────┐      joinCall()  rejectCall()
      │    Early     │ (3)       │          │
      └──────┬───────┘           │          │
             │                   │          │
             │ Answered          ▼          ▼
             └────────────>┌──────────────┐ ┌──────────────┐
                           │  Confirmed   │ │ Disconnected │ (6)
                           │      (5)     │ └──────────────┘
                           └──────┬───────┘        ▲
                                  │                │
                           toggleHold()            │
                                  │                │
                                  ▼                │
                           ┌──────────────┐        │
                           │     Hold     │ (7)    │
                           └──────┬───────┘        │
                                  │                │
                           toggleHold()            │
                                  │                │
                                  └────────────────┘
                                       endCall()

States:
  0 = Unknown      - Initial state
  1 = Calling      - Outgoing call initiated
  2 = Incoming     - Incoming call received
  3 = Early        - Ringing (outgoing)
  4 = Connecting   - Call being established
  5 = Confirmed    - Call active ✅
  6 = Disconnected - Call ended
  7 = Hold         - Call on hold
```

### 📱 Handling Incoming Calls from CallKit (iOS) / System Notification (Android)

When a call comes in while the app is in background or killed, you need to navigate to your calling screen. Here's how to implement this properly:

#### Step 1: Listen to `onCallStateChanged` Event in Root Component

```typescript
// In your root App.tsx or main navigation component
import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import {
  omiEmitter,
  OmiCallEvent,
  OmiCallState,
  getInitialCall
} from 'omikit-plugin';

// For Android with TypeScript, use DeviceEventEmitter
import { DeviceEventEmitter } from 'react-native';

export const App = () => {
  const navigationRef = useRef<any>(null);
  const isNavigatingToCall = useRef(false);

  useEffect(() => {
    // Handle call state changes from CallKit/System
    const handleCallStateChanged = (data: any) => {
      const { status, incoming, isVideo } = data;

      // When incoming call is received (from CallKit on iOS / FCM on Android)
      if (status === OmiCallState.incoming && incoming) {
        // Prevent duplicate navigation
        if (isNavigatingToCall.current) return;
        isNavigatingToCall.current = true;

        // Navigate to your calling screen
        navigationRef.current?.navigate('DialCall', {
          status: OmiCallState.incoming,
          isOutGoingCall: false,
          callerNumber: data.callerNumber || data.source_number,
          isVideo: isVideo || false,
        });

        // Reset flag after navigation
        setTimeout(() => {
          isNavigatingToCall.current = false;
        }, 1000);
      }

      // When call is disconnected, go back
      if (status === OmiCallState.disconnected) {
        navigationRef.current?.goBack();
      }
    };

    // For iOS: use omiEmitter
    // For Android: use DeviceEventEmitter (more reliable with TypeScript)
    const emitter = Platform.OS === 'ios'
      ? omiEmitter
      : DeviceEventEmitter;

    const subscription = emitter.addListener(
      OmiCallEvent.onCallStateChanged,
      handleCallStateChanged
    );

    // Check for initial call when app opens (cold start from CallKit)
    checkInitialCall();

    return () => {
      subscription.remove();
    };
  }, []);

  // Handle cold start - app opened from CallKit/notification
  const checkInitialCall = async () => {
    try {
      const callInfo = await getInitialCall();
      if (callInfo && callInfo !== false) {
        navigationRef.current?.navigate('DialCall', {
          status: callInfo.status || OmiCallState.incoming,
          isOutGoingCall: callInfo.direction === 'outbound',
          callerNumber: callInfo.callerNumber || callInfo.source_number,
          isVideo: callInfo.isVideo || false,
        });
      }
    } catch (error) {
      console.log('No initial call:', error);
    }
  };

  return (
    <NavigationContainer ref={navigationRef}>
      {/* Your navigation structure */}
    </NavigationContainer>
  );
};
```

#### Step 2: Handle Different Scenarios

| Scenario | iOS Behavior | Android Behavior | Your Action |
|----------|--------------|------------------|-------------|
| **App in Foreground** | `onCallStateChanged` fires with `status: 2 (incoming)` | `onCallStateChanged` fires with `status: 2 (incoming)` | Navigate to DialCall screen |
| **App in Background** | CallKit shows native UI → User accepts → `onCallStateChanged` fires with `status: 4 (connecting)` | Fullscreen notification → User accepts → `onCallStateChanged` fires | Navigate when `connecting` or `confirmed` |
| **App Killed (Cold Start)** | CallKit shows → User accepts → App launches → Use `getInitialCall()` | Notification → User taps → App launches → Use `getInitialCall()` | Check `getInitialCall()` on app start |

#### Step 3: Complete DialCall Screen Event Handling

```typescript
// In DialCallScreen.tsx
import { DeviceEventEmitter } from 'react-native';
import { OmiCallEvent, OmiCallState, joinCall, endCall } from 'omikit-plugin';

export const DialCallScreen = ({ route, navigation }) => {
  const { status: initialStatus, isOutGoingCall } = route.params;
  const [currentStatus, setCurrentStatus] = useState(initialStatus);

  useEffect(() => {
    const handleCallStateChanged = (data: any) => {
      const { status } = data;
      setCurrentStatus(status);

      // Auto-navigate back when call ends
      if (status === OmiCallState.disconnected) {
        navigation.goBack();
      }
    };

    // Register listener
    const listener = DeviceEventEmitter.addListener(
      OmiCallEvent.onCallStateChanged,
      handleCallStateChanged
    );

    return () => {
      listener.remove();
    };
  }, [navigation]);

  // Answer incoming call
  const handleAnswerCall = async () => {
    await joinCall();
  };

  // End/reject call
  const handleEndCall = () => {
    endCall();
    navigation.goBack();
  };

  // Show answer button only for incoming calls not yet answered
  const showAnswerButton =
    (currentStatus === OmiCallState.incoming || currentStatus === OmiCallState.early)
    && !isOutGoingCall;

  return (
    <View>
      {/* Your call UI */}
      <TouchableOpacity onPress={handleEndCall}>
        <Text>End Call</Text>
      </TouchableOpacity>

      {showAnswerButton && (
        <TouchableOpacity onPress={handleAnswerCall}>
          <Text>Answer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
```

#### iOS-Specific: CallKit Integration Notes

1. **VoIP Push**: When a VoIP push arrives, OmiKit automatically shows CallKit UI
2. **User Accepts**: CallKit triggers `joinCall()` internally
3. **Your App Opens**: `onCallStateChanged` event fires with `status: connecting (4)`
4. **Navigate**: Your app should navigate to DialCall screen
5. **Call Active**: Status changes to `confirmed (5)`

#### Android-Specific: Foreground Service Notes

1. **FCM Push**: When FCM push arrives, OmiKit starts ForegroundService
2. **Fullscreen Notification**: System shows fullscreen incoming call UI
3. **User Accepts**: `onCallStateChanged` fires with `status: connecting (4)`
4. **Your App Opens**: Navigate to DialCall screen
5. **Call Active**: Status changes to `confirmed (5)`

### Event Flow

```
                                   ┌──────────────┐
                                   │  OmiKit SDK  │
                                   │ Native Layer │
                                   └──────┬───────┘
                                          │
                                   emit() │
                                          ▼
                                   ┌──────────────┐
                                   │ omiEmitter   │
                                   │ (EventBus)   │
                                   └──────┬───────┘
                                          │
                      ┌───────────────────┼───────────────────┐
                      │                   │                   │
                      ▼                   ▼                   ▼
            ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
            │CALL_STATE_CHANGED│ │      MUTED       │ │     SPEAKER      │
            │   Update UI      │ │ Toggle Mic Icon  │ │ Toggle Spk Icon  │
            └─────────┬────────┘ └─────────┬────────┘ └─────────┬────────┘
                      │                    │                    │
                      ▼                    ▼                    ▼
            ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
            │       HOLD       │ │REMOTE_VIDEO_READY│ │   CALL_QUALITY   │
            │  Show Hold UI    │ │  Render Video    │ │ Network Indicator│
            └─────────┬────────┘ └─────────┬────────┘ └─────────┬────────┘
                      │                    │                    │
                      ▼                    ▼                    ▼
            ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
            │  AUDIO_CHANGE    │ │REQUEST_PERMISSION│ │SWITCHBOARD_ANSWER│
            │ Update Audio UI  │ │ Show Permission  │ │ Handle Callback  │
            └─────────┬────────┘ └─────────┬────────┘ └─────────┬────────┘
                      │                    │                    │
                      └────────────────────┴────────────────────┘
                                          │
                                          ▼
                                   ┌──────────────┐
                                   │  Your App UI │
                                   │   Updates    │
                                   └──────────────┘
```

### Architecture Flow (New Architecture)

```
                    ┌────────────────────────────────────────────────────────────┐
                    │                   JavaScript Layer                         │
                    ├────────────────────────────────────────────────────────────┤
                    │                                                            │
                    │                    ┌──────────┐                            │
                    │                    │ Your App │                            │
                    │                    └─────┬────┘                            │
                    │                          │                                 │
                    │   import { startCall, omiEmitter } from 'omikit-plugin'    │
                    │                          │                                 │
                    │                          ▼                                 │
                    │                  ┌──────────────┐                          │
                    │                  │ OmiKit Plugin│                          │
                    │                  │  (src/index) │                          │
                    │                  └──────┬───────┘                          │
                    │                         │                                  │
                    │   Runtime Detection: global.__turboModuleProxy != null     │
                    │                         │                                  │
                    │                         ▼                                  │
                    │           ┌──────────────────────────┐                     │
                    │           │ Is TurboModule Available?│                     │
                    │           └─────┬─────────────┬──────┘                     │
                    │                 │             │                            │
                    │        YES (New Arch)   NO (Old Arch)                      │
                    └─────────────────┼─────────────┼────────────────────────────┘
                                      │             │
                    ┌─────────────────▼──┐      ┌──▼─────────────────┐
                    │  NEW ARCHITECTURE  │      │  OLD ARCHITECTURE  │
                    ├────────────────────┤      ├────────────────────┤
                    │                    │      │                    │
                    │ TurboModuleRegistry│      │  NativeModules     │
                    │       .get()       │      │  .OmikitPlugin     │
                    │         │          │      │         │          │
                    │         ▼          │      │         ▼          │
                    │  ┌──────────────┐  │      │ ┌──────────────┐   │
                    │  │Codegen Spec  │  │      │ │ JSON Bridge  │   │
                    │  │(Type-safe)   │  │      │ │(Serialization)│  │
                    │  └──────┬───────┘  │      │ └──────┬───────┘   │
                    │         │          │      │        │           │
                    │         ▼          │      │        ▼           │
                    │  ┌──────────────┐  │      │ ┌──────────────┐   │
                    │  │  JSI Bridge  │  │      │ │  RCTBridge   │   │
                    │  │ (C++ Direct) │  │      │ │ (JSON async) │   │
                    │  └──────┬───────┘  │      │ └──────┬───────┘   │
                    └─────────┼──────────┘      └────────┼───────────┘
                              │                          │
                              └────────────┬─────────────┘
                                           │
                    ┌──────────────────────▼──────────────────────┐
                    │             Native Layer                    │
                    ├─────────────────────────────────────────────┤
                    │                                             │
                    │      ┌─────────────────────────────┐        │
                    │      │   OmikitPlugin Module       │        │
                    │      │  Android: OmikitPluginModule│        │
                    │      │      iOS: OmikitPlugin      │        │
                    │      └──────────┬──────────────────┘        │
                    │                 │                           │
                    │                 ▼                           │
                    │      ┌─────────────────────────────┐        │
                    │      │  CallManager Singleton      │        │
                    │      │   - Call state management   │        │
                    │      │   - Audio/Video controls    │        │
                    │      │   - Permission handling     │        │
                    │      └──────────┬──────────────────┘        │
                    │                 │                           │
                    │                 ▼                           │
                    │      ┌─────────────────────────────┐        │
                    │      │  OmiKit SDK (Native)        │        │
                    │      │  Android: OmiSDK v@last    │        │
                    │      │     iOS: OmiKit v@last     │        │
                    │      └──────────┬──────────────────┘        │
                    │                 │                           │
                    └─────────────────┼───────────────────────────┘
                                      │
                                      ▼
                            ┌──────────────────┐
                            │   OMISIP Engine     │
                            │  VoIP/RTP/SRTP   │
                            └──────────────────┘

                        Performance Comparison
        ┌────────────────┬──────────────┬──────────────┬──────────┐
        │     Metric     │  Old Arch    │   New Arch   │ Speedup  │
        ├────────────────┼──────────────┼──────────────┼──────────┤
        │  Method Call   │   2-5 ms     │  0.1-0.5 ms  │  4-10x   │
        │  Type Safety   │   Runtime    │   Compile    │   100%   │
        │    Memory      │   Higher     │    Lower     │   -30%   │
        └────────────────┴──────────────┴──────────────┴──────────┘
```

<br>

## 🛠️ Configuration

### 🛠️ Install 
<br>

✅ Install via npm:

```ruby
npm install omikit-plugin@latest
```

✅ Install via yarn:
```ruby
yarn add omikit-plugin --latest
```

#### 🛠️ Step 1: Config native file 

##### 🚀 Android:
📌 **Config gradle file**
- Add these settings in `build.gradle`:

```gradle 
jcenter() // This func will replace soon 
maven {
  url "https://maven.pkg.github.com/omicall/OMICall-SDK"
  credentials {
      username = project.findProperty("OMI_USER") ?: "" // Please connect with developer OMI for get information 
      password = project.findProperty("OMI_TOKEN") ?: ""
  }
  authentication {
      basic(BasicAuthentication)
  }
}

```


```kotlin
// gradle.properties
OMI_USER=omicall
OMI_TOKEN=${OMI_TOKEN} // connect with dev off OMI for get token 
```

```kotlin
// in dependencies
classpath 'com.google.gms:google-services:4.3.13'
// You can choose the version of google-services to suit your project
```

```kotlin
// under buildscript
allprojects {
      repositories {
        maven {
            // All of React Native (JS, Obj-C sources, Android binaries) is installed from npm
            url("$rootDir/../node_modules/react-native/android")
        }
        maven {
            // Android JSC is installed from npm
            url("$rootDir/../node_modules/jsc-android/dist")
        }
        mavenCentral {
            // We don't want to fetch react-native from Maven Central as there are
            // older versions over there.
            content {
                excludeGroup "com.facebook.react"
            }
        }
        google()
        maven { url 'https://www.jitpack.io' }
       maven {
          url "https://maven.pkg.github.com/omicall/OMICall-SDK"
          credentials {
              username = project.findProperty("OMI_USER") ?: ""
              password = project.findProperty("OMI_TOKEN") ?: ""
          }
          authentication {
              basic(BasicAuthentication)
          }
        }
      }
}
```

You can refer <a href="https://github.com/VIHATTeam/OMICALL-React-Native-SDK/blob/main/example/android/build.gradle">android/build.gradle</a> to know more informations.

- Add these settings in `app/build.gradle`:

```kotlin
apply plugin: 'com.android.application'
apply plugin: 'com.google.gms.google-services'
```

You can refer <a href="https://github.com/VIHATTeam/OMICALL-React-Native-SDK/blob/main/example/android/app/build.gradle">android/app/build.gradle</a> to know more informations.

<br>

📌 **Config AndroidManifest.xml file**



```xml
<manifest
      xmlns:tools="http://schemas.android.com/tools">
       // ... your config
      <uses-feature android:name="android.hardware.telephony" android:required="false" />
      <uses-permission android:name="android.permission.INTERNET" />
      <uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />
      <uses-permission android:name="android.permission.WAKE_LOCK" />
      <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
      
      <!-- 🔥 Android 15+ (SDK 35+) Required Permissions -->
      <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
      <uses-permission android:name="android.permission.RECORD_AUDIO"/>
      <uses-permission android:name="android.permission.CALL_PHONE"/>
      <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS"/>
      <uses-permission android:name="android.permission.USE_SIP"/>
      <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE"/>
      <uses-permission android:name="android.permission.FOREGROUND_SERVICE_PHONE_CALL"/>
      <uses-permission android:name="android.permission.CAMERA"/> <!-- For video calls -->
      
      // ... your config

         <application
                android:name=".MainApplication"
                android:alwaysRetainTaskState="true"
                android:largeHeap="true"
                android:exported="true"
                android:supportsRtl="true"
                android:allowBackup="false"
                android:enableOnBackInvokedCallback="true"
                // ... your config
        >
                <activity
                            android:name=".MainActivity"
                            android:windowSoftInputMode="adjustResize"
                            android:showOnLockScreen="true"
                            android:launchMode="singleTask"
                            android:largeHeap="true"
                            android:alwaysRetainTaskState="true"
                            android:supportsPictureInPicture="false"
                            android:showWhenLocked="true"
                            android:turnScreenOn="true"
                            android:exported="true"
                            // ... your config
                            >
                           // ... your config
                          <intent-filter>
                              <action android:name="android.intent.action.MAIN" />
                              <category android:name="android.intent.category.LAUNCHER" />
                          </intent-filter>
                            <intent-filter>
                          <action android:name="android.intent.action.CALL" />
                              <category android:name="android.intent.category.DEFAULT" />
                              <data
                                  android:host="incoming_call"
                                  android:scheme="omisdk" />
                          </intent-filter>
                         // ... your config
                     </activity>
                  // ... your config
                <receiver
                    android:name="vn.vihat.omicall.omisdk.receiver.FirebaseMessageReceiver"
                    android:exported="true"
                    android:enabled="true"
                    tools:replace="android:exported"
                    android:permission="com.google.android.c2dm.permission.SEND">
                    <intent-filter>
                        <action android:name="com.google.android.c2dm.intent.RECEIVE" />
                    </intent-filter>
                </receiver>
                <service
                  android:name="vn.vihat.omicall.omisdk.service.NotificationService"
                  android:enabled="true"
                  android:exported="false">
                </service>
                   // ... your config
           </application>
</manifest>
```

<br>

📌 **Config MainActivity file**
### ✅ For React Native < 0.74

```java
public class MainActivity extends ReactActivity {
  // your config ... 


  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    reactApplicationContext = new ReactApplicationContext(this);
  }

  @Override
  public void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    if (intent != null) {
      OmikitPluginModule.Companion.onGetIntentFromNotification(reactApplicationContext, intent, this);
    }
  }

  @Override
  protected void onResume() {
    super.onResume();
    OmikitPluginModule.Companion.onResume(this);
    Intent intent = getIntent();
    if (intent != null) {
      OmikitPluginModule.Companion.onGetIntentFromNotification(reactApplicationContext, intent, this);
    }
    // your config ... 
  }
}
```

### ✅ For React Native > 0.74

```kotlin
class MainActivity : ReactActivity() {
    // your config ....
    private var reactApplicationContext: ReactApplicationContext? = null
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        intent?.let { intentData ->
            try {
                OmikitPluginModule.Companion.handlePickupIntentEarly(this, intentData)
            } catch (e: Exception) {
                Log.e("MainActivity", "⚠️ PICKUP-FIX: Error handling early intent: ${e.message}")
            }
        }

        val reactInstanceManager: ReactInstanceManager = reactNativeHost.reactInstanceManager
        val currentContext = reactInstanceManager.currentReactContext
        if (currentContext != null && currentContext is ReactApplicationContext) {
            reactApplicationContext = currentContext
            Log.d("MainActivity", "ReactApplicationContext is available.")
        } else {
            Log.d("MainActivity", "ReactApplicationContext Not ready yet, will listen to the event.")
        }

        reactInstanceManager.addReactInstanceEventListener(object : ReactInstanceManager.ReactInstanceEventListener {
            override fun onReactContextInitialized(reactContext: com.facebook.react.bridge.ReactContext) {
                if (reactContext is ReactApplicationContext) {
                    reactApplicationContext = reactContext
                    Log.d("MainActivity", "ReactApplicationContext đã được khởi tạo.")
                }
            }
        })
    }

    override fun onNewIntent(intent: Intent?) {
       super.onNewIntent(intent)
        intent?.let { newIntent ->
            Log.d("MainActivity", "🚀 PICKUP-FIX: New intent received (warm start)")
            // IMPORTANT: Update the activity's intent to the new one
            setIntent(newIntent)
            try {
                // Try to handle immediately if React context is ready
                reactApplicationContext?.let {
                    OmikitPluginModule.Companion.onGetIntentFromNotification(it, newIntent, this)
                } ?: run {
                    OmikitPluginModule.Companion.handlePickupIntentEarly(this, newIntent)
                }
            } catch (e: Exception) {
                Log.e("MainActivity", "❌ PICKUP-FIX: Error in onNewIntent: ${e.message}")
            }
        } ?: Log.e("MainActivity", "Intent in onNewIntent is null.")
    }

    override fun onResume() {
        super.onResume()
        reactApplicationContext?.let { context ->
            OmikitPluginModule.Companion.onResume(this)
            // Handle intent if exists (already updated by onNewIntent or from onCreate)
            intent?.let { intentData ->
                OmikitPluginModule.Companion.onGetIntentFromNotification(context, intentData, this)
            }
        } ?: Log.e("MainActivity", "ReactApplicationContext has not been initialized in onResume.")
    }

     // your config ....
}
```

```kotlin
import com.google.firebase.FirebaseApp;

// This is important because we push incoming calls via Firebase.
class MainApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        if (FirebaseApp.getApps(this).isEmpty()) {
            FirebaseApp.initializeApp(this)
        }
    }
}

```

- ✨ Setup remote push notification: Only support Firebase for remote push notification.

  - ✅ Add `google-service.json` in `android/app` (For more information, you can refer <a href="https://rnfirebase.io/app/usage">Core/App</a>)
  - ✅ Add Firebase Messaging to receive `fcm_token` (You can refer <a href="https://rnfirebase.io/messaging/usage">Cloud Messaging</a> to setup notification for React native)

  - ✅ For more setting information, please refer <a href="https://api.omicall.com/web-sdk/mobile-sdk/android-sdk/cau-hinh-push-notification">Config Push for Android</a>

<br>

*Now let's continue configuring iOS, let's go 🚀*

##### 🚀 Config for IOS

##### 📌 iOS(Object-C):

- ✅ Assets: Add `call_image` into assets folder to update callkit image. We only support png style. *(This will help show your application icon on iOS CallKit when a call comes in)*

- ✅ Add variables in **Appdelegate.h** for **Old Architecture**:

```objc
#import <UIKit/UIKit.h>
#import <UserNotifications/UserNotifications.h>
// #import <OmiKit/OmiKit-umbrella.h>
#import <OmiKit/OmiKit.h>
#import <OmiKit/Constants.h>

@interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate, UNUserNotificationCenterDelegate>

@property (nonatomic, strong) UIWindow *window;
@property (nonatomic, strong) PushKitManager *pushkitManager;
@property (nonatomic, strong) CallKitProviderDelegate * provider;
@property (nonatomic, strong) PKPushRegistry * voipRegistry;

@end
```

- ✅ Add variables in **Appdelegate.h** for **New Architecture**:

```objc
#import <UIKit/UIKit.h>
#import <UserNotifications/UserNotifications.h>
// #import <OmiKit/OmiKit-umbrella.h>
#import <OmiKit/OmiKit.h>
#import <OmiKit/Constants.h>

@interface AppDelegate :  NSObject <UIApplicationDelegate, UNUserNotificationCenterDelegate, RCTBridgeDelegate>

@property (nonatomic, strong) UIWindow *window;
@property (nonatomic, strong) PushKitManager *pushkitManager;
@property (nonatomic, strong) CallKitProviderDelegate * provider;
@property (nonatomic, strong) PKPushRegistry * voipRegistry;

@end

```

- ✅ Update AppDelegate.m:

```objc
#import <OmiKit/OmiKit.h>


- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{

  //  ----- Start OmiKit Config ------
  [OmiClient setEnviroment:KEY_OMI_APP_ENVIROMENT_SANDBOX userNameKey:@"full_name" maxCall:2 callKitImage:@"call_image" typePushVoip:TYPE_PUSH_CALLKIT_DEFAULT];
  _provider = [[CallKitProviderDelegate alloc] initWithCallManager: [OMISIPLib sharedInstance].callManager];
  _voipRegistry = [[PKPushRegistry alloc] initWithQueue:dispatch_get_main_queue()];
  _pushkitManager = [[PushKitManager alloc] initWithVoipRegistry:_voipRegistry];
  if (@available(iOS 10.0, *)) {
        [UNUserNotificationCenter currentNotificationCenter].delegate = (id<UNUserNotificationCenterDelegate>) self;
  }
  //  ----- End OmiKit Config ------

  return YES;

}


//Called when a notification is delivered to a foreground app.
-(void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler
{
  NSLog(@"User Info : %@",notification.request.content.userInfo);
  completionHandler(UNAuthorizationOptionSound | UNAuthorizationOptionAlert | UNAuthorizationOptionBadge);
}

// This function is used to send an event back into the app when the user presses on a missed call notification
- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)())completionHandler {
    NSDictionary *userInfo  = response.notification.request.content.userInfo;
    if (userInfo && [userInfo valueForKey:@"omisdkCallerNumber"]) {
      NSLog(@"User Info : %@",userInfo);
        [OmikitNotification didRecieve:userInfo];
    }
    completionHandler();
}

// This function will terminate all ongoing calls when the user kills the app
- (void)applicationWillTerminate:(UIApplication *)application {
    @try {
        [OmiClient OMICloseCall];
    }
    @catch (NSException *exception) {

    }
}
```

- 📝 Tips: Error Use of undeclared identifier 'OmikitNotification' at file `AppDelegate.m`, please import this line below

```objc
#if __has_include("OmikitNotification.h")
#import "OmikitNotification.h"
#elif __has_include(<OmikitPlugin/OmikitPlugin-Swift.h>)
#import <OmikitPlugin/OmikitPlugin-Swift.h>
#else
#import <omikit_plugin/OmikitNotification.h>
#endif

```
- Add these lines into `Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Need microphone access for make Call</string>
//If you implement video call
<key>NSCameraUsageDescription</key>
<string>Need camera access for video call functions</string>
```

- 💡 Save token for `OmiClient`: if You added `Cloud Messaging` in your project so you don't need add these lines.

```swift
- (void)application:(UIApplication*)app didRegisterForRemoteNotificationsWithDeviceToken:(NSData*)devToken
{
      // parse token bytes to string
     // const char *data = [devToken bytes];
     const unsigned char *data = (const unsigned char *)[devToken bytes];
    NSMutableString *token = [NSMutableString string];
    for (NSUInteger i = 0; i < [devToken length]; i++)
    {
        [token appendFormat:@"%02.2hhX", data[i]];
    }

    // print the token in the console.
    NSLog(@"Push Notification Token: %@", [token copy]);
    [OmiClient setUserPushNotificationToken:[token copy]];
}

```

**✨ Only use under lines when added `Cloud Messaging` plugin in your project**

- ✅ Setup push notification: We only support Firebase for push notification.
- ✅ Add `google-service.json` in `android/app` (For more information, you can refer <a href="https://rnfirebase.io/app/usage">Core/App</a>)
- ✅ Add Firebase Messaging to receive `fcm_token` (You can refer <a href="https://pub.dev/packages/firebase_messaging">Cloud Messaging</a> to setup notification for React Native)
- ✅ For more setting information, please refer <a href="https://api.omicall.com/web-sdk/mobile-sdk/ios-sdk/cau-hinh-push-notification">Config Push for iOS</a>

**✨Important release note**

```
We support 2 environments. So you need set correct key in Appdelegate.
- KEY_OMI_APP_ENVIROMENT_SANDBOX support on debug mode
- KEY_OMI_APP_ENVIROMENT_PRODUCTION support on release mode
- Visit on web admin to select correct enviroment.
```

*📝Note: At Tab Build Setting off Target Project, you need set: **_Enable Modules (C and Objective C)_** : YES*

#### ✅ New Architecture Support (React Native 0.74+)

Starting from **v4.0.x**, OMICALL SDK fully supports React Native New Architecture!

📌 **iOS New Architecture Configuration**

> ⚠️ **Important**: iOS New Architecture works with OMICALL SDK, but **Bridgeless mode must be disabled** due to OmiKit native SDK compatibility.

**Step 1**: Enable New Architecture in Podfile:
```Ruby
use_react_native!(
    :path => config[:reactNativePath],
    :new_arch_enabled => true,  # ✅ Enable New Architecture
    ... your config
  )
```

**Step 2**: Disable Bridgeless mode in `AppDelegate.mm`:
```objc
// In your bundledUrl method or RCTAppDelegate configuration
- (BOOL)bridgelessEnabled {
    return NO;  // ⚠️ REQUIRED: Disable Bridgeless for OmiKit compatibility
}
```

Or if using Swift AppDelegate:
```swift
override func bridgelessEnabled() -> Bool {
    return false  // ⚠️ REQUIRED: Disable Bridgeless for OmiKit compatibility
}
```

📌 **Android New Architecture Configuration**

- Open file **_android/gradle.properties_** and set:
```kotlin
# Enable New Architecture
newArchEnabled=true
```

📌 **Backward Compatibility (Old Architecture)**

If you prefer to stay on Old Architecture:

✅ For iOS:
```Ruby
use_react_native!(
    :path => config[:reactNativePath],
    :new_arch_enabled => false,
   ... your config
  )
```

✅ For Android:
```kotlin
# android/gradle.properties
newArchEnabled=false
```

#### 📌 iOS(Swift):

📝 Notes: The configurations are similar to those for object C above, with only a slight difference in the syntax of the functions

- ✅ Add variables in Appdelegate.swift:

```swift
import OmiKit
import PushKit
import NotificationCenter

var pushkitManager: PushKitManager?
var provider: CallKitProviderDelegate?
var voipRegistry: PKPushRegistry?
```

- ✅ Add these lines into `didFinishLaunchingWithOptions`:

```swift
OmiClient.setEnviroment(KEY_OMI_APP_ENVIROMENT_SANDBOX, userNameKey: "extension", maxCall: 1, callKitImage: "call_image")
provider = CallKitProviderDelegate.init(callManager: OMISIPLib.sharedInstance().callManager)
voipRegistry = PKPushRegistry.init(queue: .main)
pushkitManager = PushKitManager.init(voipRegistry: voipRegistry)
```

- ✅ Add these lines into `Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>Need camera access for video call functions</string>
<key>NSMicrophoneUsageDescription</key>
<string>Need microphone access for make Call</string>
```

- ✅ Save token for `OmiClient`: if you added `firebase_messaging` in your project so you don't need add these lines.

```swift
func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    let deviceTokenString = deviceToken.hexString
    OmiClient.setUserPushNotificationToken(deviceTokenString)
}

extension Data {
    var hexString: String {
        let hexString = map { String(format: "%02.2hhx", $0) }.joined()
        return hexString
    }
}
```

**✨ Only use under lines when added `Cloud Messaging` plugin in your project**

- ✅ Setup push notification: We only support Firebase for push notification.
- ✅ Add `google-service.json` in `android/app` (For more information, you can refer <a href="https://rnfirebase.io/app/usage">Core/App</a>)
- ✅ Add Firebase Messaging to receive `fcm_token` (You can refer <a href="https://pub.dev/packages/firebase_messaging">Cloud Messaging</a> to setup notification for React Native)
- ✅ For more setting information, please refer <a href="https://api.omicall.com/web-sdk/mobile-sdk/ios-sdk/cau-hinh-push-notification">Config Push for iOS</a>
- 

**❌ Important release note**

```
We support 2 environments. So you need set correct key in Appdelegate.
- KEY_OMI_APP_ENVIROMENT_SANDBOX support on debug mode
- KEY_OMI_APP_ENVIROMENT_PRODUCTION support on release mode
- Visit on web admin to select correct enviroment.
```

## 🛠️ Step 2: Integrate into React Native code 

### 🚀 Request permission

**📌 We need you request permission about call before make call:**

- ✅ You can use <a href="https://github.com/zoontek/react-native-permissions">react-native-permissions</a> to do this

```
-Android:
+ PERMISSIONS.ANDROID.RECORD_AUDIO
+ PERMISSIONS.ANDROID.POST_NOTIFICATIONS
+ PERMISSIONS.ANDROID.CALL_PHONE
+ PERMISSIONS.ANDROID.CAMERA; (if you want to make Video calls)

-IOS:
+ PERMISSIONS.IOS.MICROPHONE;
+ PERMISSIONS.IOS.CAMERA; (if you want to make Video calls)

```

### 🔥 **Android Permission Management**

**📌 For Android (SDK), additional permissions are required:**

🔥 Notes:
	
  •	POST_NOTIFICATIONS and RECORD_AUDIO must be requested at runtime in your code.
	
  •	FOREGROUND_SERVICE* permissions only need to be declared in the manifest; Android will enforce them automatically when you call startForegroundService().

```xml
<!-- Runtime permissions -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.RECORD_AUDIO"/>

<!-- Foreground service permissions (manifest only, no runtime request needed) -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_PHONE_CALL"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_CAMERA" tools:node="remove" /> 

<service 
    android:name="net.gotev.sipservice.SipService" 
    android:foregroundServiceType="phoneCall|microphone" 
    tools:replace="android:foregroundServiceType" 
    android:exported="false" 
/>

```

- ✅ Set up <a href="https://rnfirebase.io/messaging/usage">Cloud Messaging</a> plugin:

```
//if you use only on Android. you only implement for Android.
//because we use APNS to push notification on iOS so you don't need add Firebase for iOS.
//But you can use firebase-messaging to get APNS token for iOS.
```
#### 🚀 OMIKIT-Plugin functions 🚀
<br>

📌 **startServices()**

✅ Description:

The `startServices()` function is used to initialize necessary services in `omikit-plugin`.
It should only be called once in the root file of your application.

- Usage:
 ```javascript
 // Import startServices from omikit-plugin
import { startServices } from 'omikit-plugin';

// Call startServices() to initialize the required services
startServices();
 ```
- 📝 Notes:<br>
  •	Do not call this function multiple times; it should be called only once when the application starts. <br>
  •	Ensure that `omikit-plugin` is installed before using this function.

*Add the following code to the root file of your application, such as `App.js` or `index.js`*


📌 **requestLoginPermissions()**

`Note`: Starting from Android 13+, certain foreground services (such as microphone or phone call) require explicit user permission before they can be started.
This means the user must grant these permissions before initiating a call or any service that relies on them.

```TypeScript
import { 
  PERMISSIONS, 
  request, 
  check, 
  RESULTS, 
  requestMultiple 
} from 'react-native-permissions';
import { Platform } from 'react-native';

export async function requestLoginPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  const permissions: string[] = [];

  // Android 13+ cần POST_NOTIFICATIONS
  if (Platform.Version >= 33) {
    permissions.push(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
  }

  // Android 14+ và 15+ cần RECORD_AUDIO trước khi start foreground service
  permissions.push(PERMISSIONS.ANDROID.RECORD_AUDIO);

  const statuses = await requestMultiple(permissions);

  // Check kết quả
  const allGranted = Object.values(statuses).every(
    status => status === RESULTS.GRANTED
  );

  if (!allGranted) {
    console.warn('❌ Some required permissions were not granted');
    return false;
  }

  console.log('✅ All required permissions granted');
  return true;
}
```

Example: use func `requestLoginPermissions()`

```TypeScript
async function handleLogin() {
  const ok = await requestLoginPermissions();
  if (!ok) {
    // Block login, show alert
    return;
  }

  // ✅ Safe để start service login
  // initCallWithApiKey(); 
  initCallWithUserPassword()
}
```


📌 **initCallWithApiKey()**

📝 Notes: The information below is taken from the API, you should connect with our Technical team for support

✅ Description: <br>
  - The `initCallWithApiKey()` function is usually used for your client, who only has a certain function, calling a fixed number. For example, you can only call your hotline number 

```javascript
import { initCallWithApiKey, getCurrentUser } from 'omikit-plugin';
import messaging from '@react-native-firebase/messaging';

let token: String;

// Retrieve the appropriate push notification token based on the platform
if (Platform.OS === "ios") {
  token = await messaging.getAPNSToken(); // Get APNS token for iOS
} else {
  token = await messaging.getToken(); // Get FCM token for Android
}

// Define the login information required for call initialization
const loginInfo = {
  usrUuid: usrUuid,      // Unique user identifier
  fullName: fullName,    // User's full name
  apiKey: apiKey,        // API key for authentication
  phone: phone,          // User's phone number
  fcmToken: token,       // FCM token for Android, APNS token for iOS
  isVideo: isVideo,      // Determines if video calls are enabled
  projectId: projectId   // Firebase project ID
};

// Initialize call functionality using the provided API key
const result = await initCallWithApiKey(loginInfo);

/* ❌ ❌ NOTE: Please check the user information again, if the object is not empty then you have successfully logged in. 
Otherwise, if you have not successfully logged in, you should not navigate to the call screen. When startCall with empty information, it may crash your application or not be clear when receiving the startCall error  ❌❌*/

// Example:

if (result){
  const infoUser = await getCurrentUser()
  if (infoUser != null && Object.keys(infoUser).length > 0) { 
    // ✅ Login OMI Success 
    // Can navigate to call screen or start call 🚀 🚀
  }
}
 ```

📌 **initCallWithUserPassword()**

📝 Notes: The information below is taken from the API, you should connect with our Technical team for support

✅ Description: <br>
  - The `initCallWithUserPassword()` function is for employees. They can call any telecommunications number allowed in your business on the OMI system.
  
```javascript
import { initCallWithUserPassword, getCurrentUser } from 'omikit-plugin';
import messaging from '@react-native-firebase/messaging';

let token: String;

// Retrieve the appropriate push notification token based on the platform
if (Platform.OS === "ios") {
  token = await messaging.getAPNSToken(); // Get APNS token for iOS
} else {
  token = await messaging.getToken(); // Get FCM token for Android
}

// Define the login information required for call initialization
const loginInfo = {
  userName: userName,   // User's SIP username (string)
  password: password,   // User's SIP password (string)
  realm: realm,         // SIP server domain (string)
  isVideo: isVideo,     // Enables or disables video calls (boolean: true/false)
  fcmToken: token,      // FCM token for Android, APNS token for iOS
  projectId: projectId  // Firebase project ID
};

// Initialize call functionality using username and password authentication
 initCallWithUserPassword(loginInfo)
      .then(result => {
        console.log('initCallWithUserPassword success:', result);

        if (result) {
        // ✅ Login OMI Success 
        /* ❌ ❌ NOTE: Please check the user information again, if the object is not empty then you have successfully logged in. 
Otherwise, if you have not successfully logged in, you should not navigate to the call screen. When startCall with empty information, it may crash your application or not be clear when receiving the startCall error  ❌❌*/
          const infoUser = await getCurrentUser()
          if (infoUser != null && Object.keys(infoUser).length > 0) { 
            // ✅ Login OMI Success 
            // Can navigate to call screen or start call 🚀 🚀
          }
        }
      })
      .catch(error => {
        // You can log error and check cause error
        console.error('initCallWithUserPassword error:', error?.code, error?.message);
        if (error?.code === 'ERROR_MISSING_RECORD_AUDIO') { // Please request permission audio
          requestPermission(); 
        }
      })
      .finally(() => {
        // Doing something 
        // setLoading(false);
      });
```
📝 **Detailed Description of Possible Errors(error?.code)**

| **Message**                        | **Description**                                                                 | **Next Action**                                                                 |
|------------------------------------|---------------------------------------------------------------------------------|----------------------------                                        
| `ERROR_MISSING_PARAMETERS`         | Missing required parameters. Please check your configuration.                   | Verify all required fields are provided                                         |
| `ERROR_INVALID_CREDENTIALS`        | Invalid credentials. Please check username/password.                            | Double-check login info                                                         |
| `ERROR_FORBIDDEN`                  | Access denied. Check realm/domain permissions.                                  | Confirm account permissions with provider                                       |
| `ERROR_REALM_NOT_FOUND`            | Realm not found. Check configuration.                                           | Ensure realm/domain is correct                                                  |
| `ERROR_TIMEOUT`                    | Connection timeout                                                              | Retry with stable network                                                       |
| `ERROR_MISSING_RECORD_AUDIO`       | RECORD_AUDIO permission required for Android 14+                                | Ask user to grant microphone permission                                         |
| `ERROR_MISSING_FOREGROUND_SERVICE` | FOREGROUND_SERVICE permission required                                          | Request foreground service permission before starting service                   |
| `ERROR_MISSING_POST_NOTIFICATIONS` | POST_NOTIFICATIONS permission required for Android 13+                          | Request notification permission before registering                              |
| `ERROR_SERVICE_START_FAILED`       | Failed to start SIP service                                                     | Check logs and required permissions                                             |
| `ERROR_SERVICE_NOT_AVAILABLE`      | SIP service not available                                                       | Ensure service is running                                                       |
| `ERROR_SERVICE_DEGRADED`           | Service degraded - may miss calls when app killed                               | Keep app in foreground or request proper permissions                            |
| `ERROR_SERVICE_UNAVAILABLE`        | Service temporarily unavailable                                                 | Try again later                                                                 |
| `ERROR_NETWORK_UNAVAILABLE`        | Network unavailable                                                             | Check network connection                                                        |
| `ERROR_CONNECTION_TIMEOUT`         | Connection timeout                                                              | Verify network and server availability                                          |
| `ERROR_UNKNOWN`                    | Unknown error occurred                                                          | Check logs and report issue                                                     |

📌 **configPushNotification()**

✅ Description: Config push notification: func is used to configure the incoming call popup UI on Android and the representative name for iOS

  ```javascript
import { configPushNotification } from 'omikit-plugin';

// Configure push notifications for incoming calls
configPushNotification({
  notificationIcon: "calling_face", // Notification icon for Android (located in drawable folder)
  prefix: "Cuộc gọi tới từ: ", // Prefix for incoming call notifications
  incomingBackgroundColor: "#FFFFFFFF", // Background color for incoming call screen
  incomingAcceptButtonImage: "join_call", // Image for the accept call button
  incomingDeclineButtonImage: "hangup", // Image for the decline call button
  backImage: "ic_back", // Image for the back button
  userImage: "calling_face", // Default user image for incoming calls
  prefixMissedCallMessage: "Cuộc gọi nhỡ từ", // Prefix message for missed call notifications
  missedCallTitle: "Cuộc gọi nhỡ", // Title for missed call notifications
  userNameKey: "uuid", // User identification key: options are "uuid", "full_name", or "extension"
  channelId: "com.channel.sample", // Custom notification channel ID for Android
  audioNotificationDescription: "Cuộc gọi audio", // Description for audio call notifications
  videoNotificationDescription: "Cuộc gọi video", // Description for video call notifications
  representName: "", // Representative name to display for all incoming calls (e.g., business name)
  isUserBusy: true // By default, it is set to true. The Omicall system will continue ringing the next user if isUserBusy is true. If it is false, the call will be immediately terminated, assuming the call scenario is based on a criteria-based routing.
});

// Note: Ensure that the following images are added to `android/app/src/main/res/drawable`:
// - incomingAcceptButtonImage (join_call)
// - incomingDeclineButtonImage (hangup)
// - backImage (ic_back)
// - userImage (calling_face)
  ```

📌 **getInitialCall()**

✅ Description: Get call when user open application at first time

  ```javascript
import { getInitialCall } from 'omikit-plugin';

// Check if there is an ongoing call when the app initializes
const callingInfo = await getInitialCall();

if (callingInfo !== false) {
  // If there is an active call, navigate to the call screen
  navigation.navigate('DialCall' as never, callingInfo as never);
}

// If callingInfo is not false, it means the user has an ongoing call.
  ```

📌 **startCall()**

✅ Description: Used to initiate a call to a random number, telecommunication number, hotline or internal number

  ```javascript
import { startCall, OmiStartCallStatus, OmiCallState } from 'omikit-plugin';

// Start a call with the given phone number
const result = await startCall({
  phoneNumber: phone, // The phone number to call
  isVideo: false // Set to true for a video call, false for an audio call
});

// Handle result using enum (recommended)
const status = Number(result?.status);

switch (status) {
  case OmiStartCallStatus.startCallSuccess:
  case OmiStartCallStatus.startCallSuccessIOS:
    // ✅ Call initiated successfully
    navigation.navigate('DialCall', {
      status: OmiCallState.calling,
      isOutGoingCall: true,
      isVideo: false,
    });
    break;

  case OmiStartCallStatus.permissionDenied:
  case OmiStartCallStatus.permissionMicrophone:
  case OmiStartCallStatus.permissionCamera:
    // ⚠️ Permission required
    requestPermission();
    break;

  case OmiStartCallStatus.haveAnotherCall:
    // ⚠️ Another call in progress
    alert('Please end current call first');
    break;

  default:
    console.log('Call failed:', status, result?.message);
}
  ```

✨  The result returned by `startCall()` is an object with the following structure:

  ```javascript
  result = {
      "_id": String // This is call_id. it just have id for iOS,
      "status": Number // This is result code when make,
      "message": String // This is a string key, describing the status of the call
    }
  ```

  📝 Detailed Description of Possible Results

| **Message**                               | **Status** | **Description**                                                         |
|-------------------------------------------|------------|-------------------------------------------------------------------------|
| `"INVALID_UUID"`                          | 0          | uid is invalid (we can not find on my page)                             |
| `"INVALID_PHONE_NUMBER"`                  | 1          | sip user is invalid                                                     |
| `"SAME_PHONE_NUMBER_WITH_PHONE_REGISTER"` | 2          | Cannot call same phone number                                           |
| `"MAX_RETRY"`                             | 3          | Call timeout exceeded, please try again later                           |
| `"PERMISSION_DENIED"`                     | 4          | The user has not granted MIC or audio permissions                       |
| `"COULD_NOT_FIND_END_POINT"`              | 5          | Please login before making your call                                    |
| `"REGISTER_ACCOUNT_FAIL"`                 | 6          | Can't log in to OMI (maybe wrong login information)                     |
| `"START_CALL_FAIL"`                       | 7          | Call failed, please try again                                           |
| `"HAVE_ANOTHER_CALL"`                     | 9          | There is another call in progress; please wait for that call to end     |
| `"EXTENSION_NUMBER_IS_OFF"`               | 10         | Extension number off User is turn Off                                   |
| `"START_CALL_SUCCESS"`                    | 8          | START CALL SUCCESSFULLY                                                 |

<br>


📌 **startCallWithUuid()**

✅ Description: Call with UUID (only support with Api key):

```javascript
import { startCallWithUuid } from 'omikit-plugin';

// Initiate a call using the user's UUID. This function works similarly to `startCall()`.
const result = await startCallWithUuid({
  usrUuid: uuid,    // The user's UUID (unique identifier)
  isVideo: false    // Set to true for a video call, false for an audio call
});

// The result returned has the same structure as that from `startCall()`.
```

<br>

📌 **joinCall()**

✅ Description: Used to join (pick up) any incoming call

```javascript
  import {joinCall} from 'omikit-plugin';

  await joinCall();
```

📝 Note: When calling `joinCall`, sdk will check permission of microphone and camera. If have any permission denied, sdk will send a event `onRequestPermissionAndroid` with list permission you need to request. You need to request permission before calling `joinCall` again.


📌 **transferCall()**

✅ Description: Used to forward the current ongoing call to any employee in your business

```javascript
   import {transferCall} from 'omikit-plugin';

  transferCall({
    phoneNumber: 102 // employee's internal number
    })
```

📌 **endCall()**

✅ Description:  We will push a event `endCall` for you.

```javascript
 import {endCall} from 'omikit-plugin';

    const value = await endCall();
    //value is call information
    Sample output:
    {
       "transaction_id":ea7dff38-cb1e-483d-8576...........,
       "direction":"inbound",
       "source_number":111,
       "destination_number":110,
       "time_start_to_answer":1682858097393,
       "time_end":1682858152181,
       "sip_user":111,
       "disposition":"answered"
    }
```

📌 **dropCall()**

✅ Description:   When an incoming call has not yet been answered, and the call scenario is based on criteria, invoking dropCall will cause the OMI system to cancel the ringing on other devices simultaneously.

```javascript
 import {dropCall} from 'omikit-plugin';

 const value = await dropCall(); // return true/false
   
```

📌 **toggleMute()**

✅ Description:  Toggle the audio, On/off audio a call

```javascript
  import {toggleMute} from 'omikit-plugin';

  toggleMute();
```

📌 **toggleSpeaker()**

✅ Description: Toggle the speaker, On/off the phone speaker

```javascript
  import {toggleSpeaker} from 'omikit-plugin';

  toggleSpeaker();
```

📌 **toggleHold()**

✅ Description: hold current call 

```javascript
  import {toggleHold} from 'omikit-plugin';

  toggleHold();
```

📌 **sendDTMF()**

✅ Description: Send character: We only support `1 to 9` and `* #`.

```javascript
    // FUNC IS USED when the user wants key interaction during a call. For example, press key 1, 2, 3.. to move to group
    import {sendDTMF} from 'omikit-plugin';

    sendDTMF({
        character: text,
    });
```

📌 **getCurrentUser()**

✅ Description: Retrieves the current user's information.

```javascript
    import {getCurrentUser} from 'omikit-plugin';
    final user = await getCurrentUser();
```

✨ Output Sample:

```javascript
{
    "extension": "111",
    "full_name": "chau1",
    "avatar_url": "",
    "uuid": "122aaa"
}
```

📌 **getGuestUser()**

✅ Description: Get guest user information:

```javascript
    import {getGuestUser} from 'omikit-plugin';
    final user = await getGuestUser();
```

✨ Output Sample:

```javascript
{
    "extension": "111",
    "full_name": "chau1",
    "avatar_url": "",
    "uuid": "122aaa"
}
```

📌 **ggetUserInfo()**

✅ Description: Get user information from internal number

```javascript
    import {getUserInfo} from 'omikit-plugin';
    final user = await ggetUserInfo("111");
```

✨ Output Sample:

```javascript
{
    "extension": "111",
    "full_name": "chau1",
    "fullName": "chau1",
    "avatar_url": "",
    "avatarUrl": "",
    "uuid": "122aaa"
}
```
  
📌 **endCall()**

✅ Description: End a completed call (including rejecting a call).

```javascript
    import {endCall} from 'omikit-plugin';
    endCall();
```


📌 **rejectCall()**

✅ Description: Used to reject an incoming call when the user has not accepted it yet.

📝 Note: Do not use this function to end an ongoing call.

```javascript
    import {rejectCall} from 'omikit-plugin';
    rejectCall();
```


📌 **logout()**

✅ Description: logout and remove all information.

```javascript
    import {logout} from 'omikit-plugin';
    logout();
```

📌 **systemAlertWindow()**

✅ Description: Check system alert window permission (only Android).

```javascript
    import {systemAlertWindow} from 'omikit-plugin';
     const isAllow = await systemAlertWindow();
      //true => allow
      //false => denied
```


📌 **openSystemAlertSetting()**

✅ Description:  Open to enable system alert window (only Android).

```javascript
     import {openSystemAlertSetting} from 'omikit-plugin';

    if (Platform.OS === 'android') {
      openSystemAlertSetting();
    }
```

📌 **getCurrentAudio()**

✅ Description:  Get current information of audio devices

```javascript
 import {getCurrentAudio} from 'omikit-plugin';

    getCurrentAudio().then((data: any) => {
      console.log(data); // [{"name": "Speaker", "type": "Speaker"}]
          // Note: Data is an array containing information about audio devices, with parameters:
          // - name: Name of the audio device
          // - type: Audio device type (e.g. "Speaker", "Receiver", etc.)
    });
```

📌 **setAudio()**

✅ Description: set Audio calls the current device

```javascript
 import {  getAudio, setAudio} from 'omikit-plugin';

    const audioList = await getAudio(); // Get a list of supported audio device types 
    console.log("audioList --> ", audioList) // audioList -->  [{"name": "Receiver", "type": "Receiver"}, {"name": "Speaker", "type": "Speaker"}]
    
    const receiver = audioList.find((element: any) => {
          return element.type === 'Receiver'; // type: "Speaker" is the external speaker, Receiver is the internal speaker
    });
    
    setAudio({
      portType: receiver.type,
    });
```

##### 📝 Video Call functions: Support only video call, You need enable video in `init functions` and `start call` to implements under functions.

✅ Description: Video Call functions: Support only video call, You need enable video in `init functions` and `start call` to implements under functions.


📌 Switch front/back camera: We use the front camera for first time.

  ```javascript
  import {switchOmiCamera} from 'omikit-plugin';
  switchOmiCamera();
  ```

📌 Toggle a video in video call: On/off video in video call

  ```javascript
  import {toggleOmiVideo} from 'omikit-plugin';
  toggleOmiVideo();
  ```

📌 Local Camera Widget: Your camera view in a call

  ```javascript
  import { OmiLocalCameraView } from 'omikit-plugin';
  <OmiLocalCameraView style={styles.localCamera} />
  ```

📌 Remote Camera Widget: Remote camera view in a call

  ```javascript
  import { OmiRemoteCameraView } from 'omikit-plugin';
  <OmiRemoteCameraView style={styles.remoteCamera} />
  ```

📌 More function: Refresh local camera

  ```javascript
  import {refreshLocalCamera} from 'omikit-plugin';
  refreshLocalCamera();
  ```

📌 More function: Refresh remote camera

  ```javascript
  import {refreshRemoteCamera} from 'omikit-plugin';
  refreshRemoteCamera();
  ```

📌 Register event: Register remote video ready: only visible on iOS

  ```javascript
  import {registerVideoEvent} from 'omikit-plugin';
  registerVideoEvent();
  ```

### 🚀🚀 Events listener 🚀🚀 

```javascript
import { omiEmitter } from 'omikit-plugin';

/*
❌ ❌ With TypeScript, in Android, it seems our omiEmitter is not working properly. Please use the following manual declaration, to ensure performance
*/

// 📌 For TypeScript, Android 
import { NativeEventEmitter, NativeModules } from "react-native";
const { OmikitPlugin } = NativeModules;
const omiEmitter = new NativeEventEmitter(OmikitPlugin);




useEffect(() => {
    omiEmitter.addListener(OmiCallEvent.onCallStateChanged, onCallStateChanged);
    omiEmitter.addListener(OmiCallEvent.onMuted, onMuted);
    omiEmitter.addListener(OmiCallEvent.onSpeaker, onSpeaker);
    omiEmitter.addListener(OmiCallEvent.onHold, onHold);
    omiEmitter.addListener(OmiCallEvent.onClickMissedCall, clickMissedCall);
    omiEmitter.addListener(OmiCallEvent.onSwitchboardAnswer, onSwitchboardAnswer);
    omiEmitter.addListener(OmiCallEvent.onCallQuality, onCallQuality);

    omiEmitter.addListener(OmiCallEvent.onAudioChange, onAudioChange);


    if(Platform.OS == "android") {
      omiEmitter.addListener(OmiCallEvent.onRequestPermissionAndroid, onRequestPermission);
    }

    if (Platform.OS === 'ios') {
      registerVideoEvent();
      omiEmitter.addListener(
        OmiCallEvent.onRemoteVideoReady,
        refreshRemoteCameraEvent
      );
    }

    return () => {
        omiEmitter.removeAllListeners(OmiCallEvent.onCallStateChanged);
        omiEmitter.removeAllListeners(OmiCallEvent.onMuted);
        omiEmitter.removeAllListeners(OmiCallEvent.onHold);
        omiEmitter.removeAllListeners(OmiCallEvent.onSpeaker);
        omiEmitter.removeAllListeners(OmiCallEvent.onSwitchboardAnswer);
        omiEmitter.removeAllListeners(OmiCallEvent.onAudioChange);

        if(Platform.OS == "android") {
          omiEmitter.removeAllListeners(OmiCallEvent.onRequestPermissionAndroid);
        }

        if (Platform.OS === 'ios') {
           removeVideoEvent();
           omiEmitter.removeAllListeners(OmiCallEvent.onRemoteVideoReady);
        }
    };
}, []);
```

- ✅ **Important Event: `onCallStateChanged`**  
  This event is used to listen for call state changes. The emitted event is an `OmiAction` object containing two properties: `actionName` and `data`.

- 📝 **Action Name Values:**
  - **`onCallStateChanged`**: Indicates that the call state has changed.
  - **`onSwitchboardAnswer`**: Indicates that the switchboard SIP is listening.
  - **Call Status Values:**
    - `unknown` (0)
    - `calling` (1)
    - `incoming` (2)
    - `early` (3)
    - `connecting` (4)
    - `confirmed` (5)
    - `disconnected` (6)
    - `hold` (7)

> **Note:** The `onCallStateChanged` event tracks the current state of the call. Please refer to `OmiCallState` for detailed status descriptions.

### 📞 **Call State Lifecycle**
- ✅ **Incoming Call Lifecycle:**  
  `incoming` → `connecting` → `confirmed` → `disconnected`

- ✅ **Outgoing Call Lifecycle:**  
  `calling` → `early` → `connecting` → `confirmed` → `disconnected`


```javascript
// The event is updated every time the call status changes
const onCallStateChanged = (data: any) => {
// ⚠️ ⚠️  Currently, we support two data formats: camelCase and snake_case. Snake_case is used for data v1, while camelCase is for v2. We encourage customers to use camelCase instead of snake_case, as we plan to completely remove the snake_case format in the future ❌ ❌

  /*
    Call state change event data (Object) includes:
    
    - _id: string (UUID of the call)
    - callInfo: object (Detailed call information)
    - callerNumber: string (Phone number of the caller)
    - code_end_call, codeEndCall: number (Status code when the call ends)
    - destination_number, destinationNumber?: string (Destination phone number, optional)
    - direction: string ("inbound" or "outbound", call direction)
    - disposition: string (Call answer status)
    - incoming: boolean (true if it is an incoming call)
    - isVideo: boolean (true if it is a video call)
    - sip_user, sipUser: string (Current SIP user)
    - source_number, sourceNumber: string (SIP number of the user)
    - status: string (value matching with List status call)
    - time_end, timeEnd: number (Timestamp when the call ended)
    - time_start_to_answer, timeStartToAnswer: number (Time taken to answer the call)
    - transaction_id, transactionId: string (OMI Call unique ID)
    - typeNumber: string ("", "internal", "phone", "zalo")
  */
};

// Event returned when the user mutes the call
const onMuted = (isMuted: boolean) => {
// isMuted: true when muted call 
}

// Event returns value when user holds call
const onHold = (isHold: boolean) => {
// isHold: true when hold call 
}

//  The event updates the quality of an ongoing call
const onCallQuality = (data: any) => {
    const { quality } = data;
    // quality: int is mean quality off calling 
    // 1 is good, 2 is medium, 3 is low 
}

// Even when user turn on speakerphone  
const onSpeaker = (isSpeaker: boolean) => {
  // isSpeaker: true, false  
  // True mean speaker devices is open 
}

// * onSwitchboardAnswer have callback when employee answered script call.
const onSwitchboardAnswer = (data: any) => {
  const { sip } = data
  // sip: String 
}

// * onAudioChange have callback when the user switches the audio output device (headphones)
const onAudioChange = (audioData: any) => {
  const { data } = audioData;
    
}
```

✨ Table describing `code_end_call, codeEndCall` status

| Code            | Description                                                                                                           |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `600, 503`  | These are the codes of the network operator or the user who did not answer the call  |
| `408`   | Call request timeout (Each call usually has a waiting time of 30 seconds. If the 30 seconds expire, it will time out) |
| `403`           | Your service plan only allows calls to dialed numbers. Please upgrade your service pack|
| `404`           | The current number is not allowed to make calls to the carrier|
| `480`           | The number has an error, please contact support to check the details |
| `603`           | The call was rejected. Please check your account limit or call barring configuration! |
| `850`           | Simultaneous call limit exceeded, please try again later |
| `486`           | The listener refuses the call and does not answer |
| `601`           | Call ended by the customer |
| `602`           | Call ended by the other employee |
| `603`           | The call was rejected. Please check your account limit or call barring configuration |
| `850`           | Simultaneous call limit exceeded, please try again later |
| `851`           | Call duration limit exceeded, please try again later |
| `852`           | Service package not assigned, please contact the provider |
| `853`           | Internal number has been disabled |
| `854`           | Subscriber is in the DNC list |
| `855`           | Exceeded the allowed number of calls for the trial package |
| `856`           | Exceeded the allowed minutes for the trial package |
| `857`           | Subscriber has been blocked in the configuration |
| `858`           | Unidentified or unconfigured number |
| `859`           | No available numbers for Viettel direction, please contact the provider |
| `860`           | No available numbers for VinaPhone direction, please contact the provider |
| `861`           | No available numbers for Mobifone direction, please contact the provider |
| `862`           | Temporary block on Viettel direction, please try again |
| `863`           | Temporary block on VinaPhone direction, please try again |
| `864`           | Temporary block on Mobifone direction, please try again |
| `865`           | he advertising number is currently outside the permitted calling hours, please try again later |


### **Breaking Changes & What's New in v4.0.x**

#### ✅ New Architecture Support
- **iOS**: New Architecture supported with **Bridgeless mode disabled** (`bridgelessEnabled = false`)
- **Android**: New Architecture fully supported (`newArchEnabled=true`)
- **Auto-detection**: SDK automatically detects architecture at runtime

#### ⚠️ Platform Requirements
- **Android 15+ (SDK 35+)**: Requires additional permissions in AndroidManifest.xml
- **React Native 0.74+**: Required for New Architecture support
- **Minimum SDK**: Android SDK 21+, iOS 13.0+

#### 📦 New Exports in v4.0.x
```typescript
// New enums for better type safety
import {
  OmiCallState,        // Call lifecycle states
  OmiStartCallStatus,  // startCall() result codes
  OmiAudioType,        // Audio device types
} from 'omikit-plugin';
```

# ⚠️ Issues


## ✨ iOS

- Must use "Rosetta Destination" to run debug example app on macOS Apple chip
