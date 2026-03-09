# OMICALL SDK for React Native

The [omikit-plugin](https://www.npmjs.com/package/omikit-plugin) enables VoIP/SIP calling via the OMICALL platform with support for both Old and **New Architecture** (TurboModules + Fabric).

**Status:** Active maintenance | **Version:** 4.0.1

---

## Table of Contents

- [Compatibility](#compatibility)
- [Installation](#installation)
- [Android Setup](#android-setup)
- [iOS Setup](#ios-setup)
- [Architecture Overview](#architecture-overview)
- [Quick Start](#quick-start)
- [Authentication](#authentication)
- [Call Flows (ASCII Diagrams)](#call-flows)
- [API Reference](#api-reference)
- [Events](#events)
- [Enums](#enums)
- [Video Calls](#video-calls)
- [Push Notifications](#push-notifications)
- [Permissions (Android)](#permissions-android)
- [Quality & Diagnostics](#quality--diagnostics)
- [Advanced Features](#advanced-features)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Compatibility

| omikit-plugin | React Native | Architecture | Installation |
|---------------|--------------|--------------|--------------|
| **4.0.x** (latest) | 0.74+ | Old + New (auto-detect) | `npm install omikit-plugin@latest` |
| 3.3.x | 0.60 – 0.73 | Old Architecture only | `npm install omikit-plugin@3.3.29` |

**v4.0.x highlights:**
- **TurboModules (JSI)** — 4-10x faster native method calls via direct C++ bridge
- **100% backward compatible** — auto-detects architecture at runtime
- **Zero breaking changes** from v3.x for RN 0.74+
- **Bridgeless mode** support for full New Architecture (iOS & Android)

### Native SDK Versions

| Platform | SDK | Version |
|----------|-----|---------|
| Android | OMIKIT | 2.6.4 |
| iOS | OmiKit | 1.10.34 |

---

## Installation

```bash
npm install omikit-plugin
# or
yarn add omikit-plugin
```

### iOS

```bash
cd ios && pod install
```

### Android

No extra steps — permissions are declared in the module's `AndroidManifest.xml`.

---

## Android Setup

### 1. Permissions

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<!-- Required for all calls -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_PHONE_CALL" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />

<!-- Only required for video calls -->
<uses-permission android:name="android.permission.CAMERA" />
```

> **Note:** If your app does **NOT** use video calls, add the following to your app's `AndroidManifest.xml` to remove the camera foreground service permission declared by the SDK:
>
> ```xml
> <!-- Remove camera foreground service if NOT using video call -->
> <uses-permission android:name="android.permission.FOREGROUND_SERVICE_CAMERA"
>     tools:node="remove" />
> ```
>
> Make sure to add the `tools` namespace to your manifest tag: `xmlns:tools="http://schemas.android.com/tools"`

### 2. Firebase Cloud Messaging (FCM)

Add your `google-services.json` to `android/app/`.

In `android/app/build.gradle`:

```groovy
apply plugin: 'com.google.gms.google-services'
```

### 3. Maven Repository

**Option A — `settings.gradle.kts` (recommended for new projects)**

```kotlin
// settings.gradle.kts
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://jitpack.io") }
        maven { url = uri("https://repo.omicall.com/maven") }
        maven {
            url = uri("https://maven.pkg.github.com/omicall/OMICall-SDK")
            credentials {
                username = providers.gradleProperty("OMI_USER").getOrElse("")
                password = providers.gradleProperty("OMI_TOKEN").getOrElse("")
            }
            authentication {
                create<BasicAuthentication>("basic")
            }
        }
    }
}
```

**Option B — `build.gradle` (Groovy / legacy projects)**

```groovy
// android/build.gradle (project level)
allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url 'https://jitpack.io' }
        maven { url 'https://repo.omicall.com/maven' }
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

Then add your credentials to `~/.gradle/gradle.properties` (or project-level `gradle.properties`):

```properties
OMI_USER=your_github_username
OMI_TOKEN=your_github_personal_access_token
```

> **Note:** The GitHub token needs `read:packages` scope. Generate one at [GitHub Settings > Tokens](https://github.com/settings/tokens).

### 4. New Architecture (Optional)

To enable New Architecture on Android, in `android/gradle.properties`:

```properties
newArchEnabled=true
```

---

## iOS Setup

### 1. Info.plist

Add to your `Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Required for VoIP calls</string>
<key>NSCameraUsageDescription</key>
<string>Required for video calls</string>
```

### 2. Background Modes

In Xcode, enable the following Background Modes:

- [x] Voice over IP
- [x] Remote notifications
- [x] Background fetch

### 3. Push Notifications

Enable **Push Notifications** capability in Xcode for VoIP push (PushKit).

### 4. AppDelegate Setup

In your `AppDelegate.mm` (or `.m`):

```objc
#import <OmiKit/OmiKit-umbrella.h>
#import <OmiKit/Constants.h>
```

### 5. New Architecture (Optional)

In your `Podfile`:

```ruby
ENV['RN_NEW_ARCH_ENABLED'] = '1'
```

For **full bridgeless mode**, in `AppDelegate.mm`:

```objc
- (BOOL)bridgelessEnabled
{
  return YES;
}
```

Then run `cd ios && pod install`.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     React Native App                        │
│                                                             │
│   import { startCall, omiEmitter } from 'omikit-plugin'     │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │   Architecture Bridge   │
              │                         │
              │  TurboModule? ──► JSI   │  (New Arch: direct C++ calls)
              │       │                 │
              │       └──► NativeModule │  (Old Arch: JSON bridge)
              └────────────┬────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                                 │
   ┌──────▼──────┐                  ┌───────▼──────┐
   │   Android   │                  │     iOS      │
   │             │                  │              │
   │ OmikitPlugin│                  │ OmikitPlugin │
   │  Module.kt  │                  │   .swift     │
   │      │      │                  │      │       │
   │      ▼      │                  │      ▼       │
   │  OMIKIT SDK │                  │  OmiKit SDK  │
   │  (v2.6.4)  │                  │  (v1.10.34)  │
   │      │      │                  │      │       │
   │      ▼      │                  │      ▼       │
   │  SIP Stack  │                  │  SIP Stack   │
   │  (OMSIP)   │                  │  (OMSIP)     │
   └─────────────┘                  └──────────────┘
```

---

## Quick Start

```typescript
import {
  startServices,
  initCallWithUserPassword,
  startCall,
  joinCall,
  endCall,
  omiEmitter,
  OmiCallEvent,
  OmiCallState,
} from 'omikit-plugin';

// Step 1: Start SDK services (call once on app launch)
await startServices();

// Step 2: Login with SIP credentials
const loginResult = await initCallWithUserPassword({
  userName: 'sip_user',
  password: 'sip_password',
  realm: 'your_realm',
  host: '',              // SIP proxy, defaults to vh.omicrm.com
  isVideo: false,
  fcmToken: 'your_fcm_token',
  projectId: 'your_project_id', // optional
});

// Step 3: Listen to call events
const subscription = omiEmitter.addListener(
  OmiCallEvent.onCallStateChanged,
  (data) => {
    console.log('Call state:', data.status);

    switch (data.status) {
      case OmiCallState.incoming:
        // Show incoming call UI
        // data.callerNumber, data.isVideo
        break;
      case OmiCallState.confirmed:
        // Call connected — show active call UI
        break;
      case OmiCallState.disconnected:
        // Call ended
        // data.codeEndCall — SIP end code
        break;
    }
  }
);

// Step 4: Make outgoing call
const result = await startCall({
  phoneNumber: '0901234567',
  isVideo: false,
});

if (result.status === 8) {
  console.log('Call started, ID:', result._id);
}

// Step 5: Accept incoming call
await joinCall();

// Step 6: End call
await endCall();

// Cleanup on unmount
subscription.remove();
```

---

## Authentication

Two authentication methods are available. Each supports two login modes depending on who is using the app:

| Mode | `isSkipDevices` | Use Case | Capabilities |
|------|-----------------|----------|--------------|
| **Agent** (default) | `false` | Employees / call center agents | Can make outbound calls to any telecom number |
| **Customer** | `true` | End customers | Can only call the business hotline (no outbound to external numbers) |

### Option 1: Username + Password (SIP Credentials)

```typescript
await initCallWithUserPassword({
  userName: string,         // SIP username
  password: string,         // SIP password
  realm: string,            // SIP realm/domain
  host?: string,            // SIP proxy server (optional)
  isVideo: boolean,         // Enable video capability
  fcmToken: string,         // Firebase token for push notifications
  projectId?: string,       // OMICALL project ID (optional)
  isSkipDevices?: boolean,  // true = Customer mode, false = Agent mode (default)
});
```

#### Agent Login (default)

For employees / call center agents who can make outbound calls to any phone number:

```typescript
await initCallWithUserPassword({
  userName: '100',
  password: 'sip_password',
  realm: 'your_realm',
  host: '',
  isVideo: false,
  fcmToken: fcmToken,
  // isSkipDevices defaults to false — Agent mode
});
```

#### Customer Login

For end customers who can only call the business hotline — no outbound dialing to external telecom numbers, no assigned phone number:

```typescript
await initCallWithUserPassword({
  userName: '200',
  password: 'sip_password',
  realm: 'your_realm',
  host: '',
  isVideo: false,
  fcmToken: fcmToken,
  isSkipDevices: true,  // Customer mode — skip device registration
});
```

### Option 2: API Key

```typescript
await initCallWithApiKey({
  fullName: string,    // Display name
  usrUuid: string,     // User UUID from OMICALL
  apiKey: string,      // API key from OMICALL dashboard
  isVideo: boolean,    // Enable video capability
  phone: string,       // Phone number
  fcmToken: string,    // Firebase token for push notifications
  projectId?: string,  // OMICALL project ID (optional)
});
```

---

## Call Flows

### Outgoing Call Flow

```
 ┌──────────┐          ┌──────────┐          ┌──────────┐
 │  JS App  │          │  Native  │          │ SIP/PBX  │
 └────┬─────┘          └────┬─────┘          └────┬─────┘
      │                     │                     │
      │  startCall()        │                     │
      ├────────────────────►│                     │
      │                     │  SIP INVITE         │
      │                     ├────────────────────►│
      │                     │                     │
      │  calling (1)        │  180 Ringing        │
      │◄────────────────────┤◄────────────────────┤
      │                     │                     │
      │  early (3)          │  183 Progress       │
      │◄────────────────────┤◄────────────────────┤
      │                     │                     │
      │  connecting (4)     │  200 OK             │
      │◄────────────────────┤◄────────────────────┤
      │                     │                     │
      │  confirmed (5)      │  ACK                │
      │◄────────────────────┤────────────────────►│
      │                     │                     │
      │     ══════ Active Call (RTP audio/video) ══════
      │                     │                     │
      │  endCall()          │                     │
      ├────────────────────►│  BYE                │
      │                     ├────────────────────►│
      │  disconnected (6)   │  200 OK             │
      │◄────────────────────┤◄────────────────────┤
      │                     │                     │
```

### Incoming Call — App in Foreground

```
 ┌──────────┐          ┌──────────┐          ┌──────────┐
 │  JS App  │          │  Native  │          │ SIP/PBX  │
 └────┬─────┘          └────┬─────┘          └────┬─────┘
      │                     │                     │
      │                     │  SIP INVITE         │
      │                     │◄────────────────────┤
      │                     │  180 Ringing        │
      │                     ├────────────────────►│
      │                     │                     │
      │  incoming (2)       │                     │
      │◄────────────────────┤  (event emitted)    │
      │                     │                     │
      │  ┌──────────────┐   │                     │
      │  │ Show Call UI  │   │                     │
      │  │ [Accept][Deny]│   │                     │
      │  └──────────────┘   │                     │
      │                     │                     │
      │  joinCall()         │                     │
      ├────────────────────►│  200 OK             │
      │                     ├────────────────────►│
      │  confirmed (5)      │  ACK                │
      │◄────────────────────┤◄────────────────────┤
      │                     │                     │
      │     ══════ Active Call (RTP audio/video) ══════
      │                     │                     │
```

### Incoming Call — App in Background / Killed

```
 ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
 │  JS App  │    │  Native  │    │Push Svc  │    │ SIP/PBX  │
 └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
      │               │               │               │
      │               │               │  Push Notify  │
      │               │               │◄──────────────┤
      │               │               │               │

  ┌───────────────── iOS (VoIP Push) ──────────────────┐
  │   │               │               │               │ │
  │   │               │  PushKit VoIP │               │ │
  │   │               │◄──────────────┤               │ │
  │   │               │               │               │ │
  │   │               │  Show CallKit │               │ │
  │   │               │  ┌──────────┐ │               │ │
  │   │               │  │ System   │ │               │ │
  │   │               │  │ Call UI  │ │               │ │
  │   │               │  │[Slide ►] │ │               │ │
  │   │               │  └──────────┘ │               │ │
  │   │               │               │               │ │
  │   │  App launched │               │               │ │
  │   │◄──────────────┤               │               │ │
  │   │  incoming (2) │               │               │ │
  │   │◄──────────────┤               │               │ │
  └───────────────────────────────────────────────────────┘

  ┌───────────────── Android (FCM) ────────────────────┐
  │   │               │               │               │ │
  │   │               │  FCM Message  │               │ │
  │   │               │◄──────────────┤               │ │
  │   │               │               │               │ │
  │   │               │  Start Foreground Service     │ │
  │   │               │  ┌──────────────────────┐     │ │
  │   │               │  │ Full-screen Notif    │     │ │
  │   │               │  │ [Accept]  [Decline]  │     │ │
  │   │               │  └──────────────────────┘     │ │
  │   │               │               │               │ │
  │   │  App launched │               │               │ │
  │   │◄──────────────┤               │               │ │
  │   │  incoming (2) │               │               │ │
  │   │◄──────────────┤               │               │ │
  └───────────────────────────────────────────────────────┘

      │               │               │               │
      │  joinCall()   │               │               │
      ├──────────────►│  200 OK       │               │
      │               ├──────────────────────────────►│
      │  confirmed (5)│               │               │
      │◄──────────────┤               │               │
      │               │               │               │
```

### Missed Call Flow

```
 ┌──────────┐          ┌──────────┐          ┌──────────┐
 │  JS App  │          │  Native  │          │ SIP/PBX  │
 └────┬─────┘          └────┬─────┘          └────┬─────┘
      │                     │                     │
      │                     │  SIP INVITE         │
      │                     │◄────────────────────┤
      │  incoming (2)       │                     │
      │◄────────────────────┤                     │
      │                     │                     │
      │     (user ignores / timeout / caller hangs up)
      │                     │                     │
      │                     │  CANCEL             │
      │                     │◄────────────────────┤
      │  disconnected (6)   │  200 OK             │
      │◄────────────────────┤────────────────────►│
      │                     │                     │
      │                     │  Show Missed Call    │
      │                     │  Notification        │
      │                     │                     │
      │  (user taps notif)  │                     │
      │                     │                     │
      │  onClickMissedCall  │                     │
      │◄────────────────────┤                     │
      │                     │                     │
```

### Call Transfer Flow

```
 ┌──────────┐          ┌──────────┐          ┌──────────┐
 │  JS App  │          │  Native  │          │ SIP/PBX  │
 └────┬─────┘          └────┬─────┘          └────┬─────┘
      │                     │                     │
      │     ══════ Active Call with Party A ══════
      │                     │                     │
      │  transferCall(B)    │                     │
      ├────────────────────►│  SIP REFER → B      │
      │                     ├────────────────────►│
      │                     │                     │
      │                     │  202 Accepted       │
      │                     │◄────────────────────┤
      │                     │                     │
      │  disconnected (6)   │  BYE (from A)       │
      │◄────────────────────┤◄────────────────────┤
      │                     │                     │
      │     ══════ Party A now talks to B ══════
      │                     │                     │
```

### Reject / Drop Call Flow

```
 ┌──────────┐          ┌──────────┐          ┌──────────┐
 │  JS App  │          │  Native  │          │ SIP/PBX  │
 └────┬─────┘          └────┬─────┘          └────┬─────┘
      │                     │                     │
      │  incoming (2)       │  SIP INVITE         │
      │◄────────────────────┤◄────────────────────┤
      │                     │                     │
  ┌── rejectCall() ──┐                            │
  │ Decline this      │  486 Busy Here            │
  │ device only       ├─────────────────────────►│
  └───────────────────┘  (other devices ring)     │
      │                     │                     │
  ┌── dropCall() ────┐                            │
  │ Decline + stop    │  603 Decline              │
  │ ALL devices       ├─────────────────────────►│
  └───────────────────┘  (PBX stops all ringing)  │
      │                     │                     │
```

---

## API Reference

### Service & Auth

| Function | Returns | Description |
|----------|---------|-------------|
| `startServices()` | `Promise<boolean>` | Initialize SDK. Call once on app launch |
| `initCallWithUserPassword(data)` | `Promise<boolean>` | Login with SIP username/password |
| `initCallWithApiKey(data)` | `Promise<boolean>` | Login with API key |
| `logout()` | `Promise<boolean>` | Logout and unregister SIP |

### Call Control

| Function | Returns | Description |
|----------|---------|-------------|
| `startCall({ phoneNumber, isVideo })` | `Promise<{ status, message, _id }>` | Initiate outgoing call |
| `startCallWithUuid({ usrUuid, isVideo })` | `Promise<boolean>` | Call by user UUID |
| `joinCall()` | `Promise<any>` | Accept incoming call |
| `endCall()` | `Promise<any>` | End active call (sends SIP BYE) |
| `rejectCall()` | `Promise<boolean>` | Reject on this device only (486) |
| `dropCall()` | `Promise<boolean>` | Reject + stop ringing on ALL devices (603) |
| `transferCall({ phoneNumber })` | `Promise<boolean>` | Blind transfer to another number |
| `getInitialCall()` | `Promise<any>` | Get pending call data on cold start |

### Media Control

| Function | Returns | Description |
|----------|---------|-------------|
| `toggleMute()` | `Promise<boolean\|null>` | Toggle microphone mute |
| `toggleSpeaker()` | `Promise<boolean>` | Toggle speakerphone |
| `toggleHold()` | `Promise<void>` | Toggle call hold |
| `onHold({ holdStatus })` | `Promise<boolean>` | Set hold state explicitly |
| `sendDTMF({ character })` | `Promise<boolean>` | Send DTMF tone (0-9, *, #) |
| `getAudio()` | `Promise<any>` | List available audio devices |
| `setAudio({ portType })` | `Promise<void>` | Set audio output device |
| `getCurrentAudio()` | `Promise<any>` | Get current audio device |

### Video Control

| Function | Returns | Description |
|----------|---------|-------------|
| `toggleOmiVideo()` | `Promise<boolean>` | Toggle video stream on/off |
| `switchOmiCamera()` | `Promise<boolean>` | Switch front/back camera |
| `registerVideoEvent()` | `Promise<boolean>` | Start receiving remote video frames |
| `removeVideoEvent()` | `Promise<boolean>` | Stop receiving remote video frames |

### User & Info

| Function | Returns | Description |
|----------|---------|-------------|
| `getCurrentUser()` | `Promise<any>` | Get logged-in user details |
| `getGuestUser()` | `Promise<any>` | Get guest/remote user details |
| `getUserInfo(phone)` | `Promise<any>` | Look up user by phone number |

### Getter Functions (v4.0.1+)

| Function | Returns | Description |
|----------|---------|-------------|
| `getProjectId()` | `Promise<string\|null>` | Current project ID |
| `getAppId()` | `Promise<string\|null>` | Current app ID |
| `getDeviceId()` | `Promise<string\|null>` | Current device ID |
| `getFcmToken()` | `Promise<string\|null>` | FCM push token |
| `getSipInfo()` | `Promise<string\|null>` | SIP info (`user@realm`) |
| `getVoipToken()` | `Promise<string\|null>` | VoIP token (iOS only) |

### Notification Control

| Function | Returns | Description |
|----------|---------|-------------|
| `configPushNotification(data)` | `Promise<any>` | Configure push notification settings |
| `hideSystemNotificationSafely()` | `Promise<boolean>` | Hide notification without unregistering |
| `hideSystemNotificationOnly()` | `Promise<boolean>` | Hide notification only |
| `hideSystemNotificationAndUnregister(reason)` | `Promise<boolean>` | Hide + unregister with reason |

---

## Events

Use `omiEmitter` to listen for events emitted by the native SDK.

```typescript
import { omiEmitter, OmiCallEvent } from 'omikit-plugin';
```

### Event Reference

| Event | Payload | Description |
|-------|---------|-------------|
| `onCallStateChanged` | `{ status, callerNumber, isVideo, incoming, codeEndCall }` | Call lifecycle changes |
| `onMuted` | `boolean` | Microphone mute toggled |
| `onSpeaker` | `boolean` | Speaker toggled |
| `onHold` | `boolean` | Hold state changed |
| `onRemoteVideoReady` | — | Remote video stream is ready |
| `onClickMissedCall` | `{ callerNumber }` | User tapped missed call notification |
| `onSwitchboardAnswer` | `{ data }` | Switchboard answered |
| `onCallQuality` | `{ quality, stat }` | Call quality metrics (see [Quality & Diagnostics](#quality--diagnostics)) |
| `onAudioChange` | `{ data }` | Audio device changed |
| `onRequestPermissionAndroid` | `{ permissions }` | Permission request needed (Android only) |

### Usage Example

```typescript
import { omiEmitter, OmiCallEvent, OmiCallState } from 'omikit-plugin';

useEffect(() => {
  const subscriptions = [
    // Call state changes
    omiEmitter.addListener(OmiCallEvent.onCallStateChanged, (data) => {
      console.log('State:', data.status, 'Caller:', data.callerNumber);

      if (data.status === OmiCallState.incoming) {
        // Navigate to incoming call screen
      }
      if (data.status === OmiCallState.confirmed) {
        // Call connected
      }
      if (data.status === OmiCallState.disconnected) {
        // Call ended, check data.codeEndCall for reason
      }
    }),

    // Mute state
    omiEmitter.addListener(OmiCallEvent.onMuted, (isMuted) => {
      setMuted(isMuted);
    }),

    // Speaker state
    omiEmitter.addListener(OmiCallEvent.onSpeaker, (isOn) => {
      setSpeaker(isOn);
    }),

    // Missed call notification tapped
    omiEmitter.addListener(OmiCallEvent.onClickMissedCall, (data) => {
      // Navigate to call history or callback
    }),

    // Call quality & diagnostics
    omiEmitter.addListener(OmiCallEvent.onCallQuality, ({ quality, stat }) => {
      console.log('Quality level:', quality); // 0=Good, 1=Medium, 2=Bad
      if (stat) {
        console.log('MOS:', stat.mos, 'Jitter:', stat.jitter, 'Latency:', stat.latency);
      }
    }),
  ];

  return () => subscriptions.forEach(sub => sub.remove());
}, []);
```

---

## Enums

### OmiCallState

| Value | Name | Description |
|-------|------|-------------|
| 0 | `unknown` | Initial/unknown state |
| 1 | `calling` | Outgoing call initiated, waiting for response |
| 2 | `incoming` | Incoming call received |
| 3 | `early` | Early media (183 Session Progress) |
| 4 | `connecting` | 200 OK received, establishing media |
| 5 | `confirmed` | Call active, RTP media flowing |
| 6 | `disconnected` | Call ended |
| 7 | `hold` | Call on hold |

### OmiStartCallStatus

| Value | Name | Description |
|-------|------|-------------|
| 0 | `invalidUuid` | Invalid user UUID |
| 1 | `invalidPhoneNumber` | Invalid phone number format |
| 2 | `samePhoneNumber` | Calling your own number |
| 3 | `maxRetry` | Max retry attempts exceeded |
| 4 | `permissionDenied` | General permission denied |
| 450 | `permissionMicrophone` | Microphone permission needed |
| 451 | `permissionCamera` | Camera permission needed |
| 452 | `permissionOverlay` | Overlay permission needed |
| 5 | `couldNotFindEndpoint` | SIP endpoint not found |
| 6 | `accountRegisterFailed` | SIP registration failed |
| 7 | `startCallFailed` | Call initiation failed |
| 8 | `startCallSuccess` | Call started successfully (Android) |
| 407 | `startCallSuccessIOS` | Call started successfully (iOS) |
| 9 | `haveAnotherCall` | Another call is in progress |
| 10 | `accountTurnOffNumberInternal` | Internal number has been deactivated |
| 11 | `noNetwork` | No network connection available |

### OmiAudioType

| Value | Name | Description |
|-------|------|-------------|
| 0 | `receiver` | Phone earpiece |
| 1 | `speaker` | Speakerphone |
| 2 | `bluetooth` | Bluetooth device |
| 3 | `headphones` | Wired headphones |

### End Call Status Codes (`codeEndCall`)

When a call ends (state = `disconnected`), the `codeEndCall` field in the `onCallStateChanged` event payload contains the status code indicating why the call ended.

#### Standard SIP Codes

| Code | Description |
|------|-------------|
| 200 | Normal call ending |
| 408 | Call timeout — no answer |
| 480 | Temporarily unavailable |
| 486 | Busy (or call rejected via `rejectCall()`) |
| 487 | Call cancelled before being answered |
| 500 | Server error |
| 503 | Server unavailable |

#### OMICALL Extended Codes

| Code | Description |
|------|-------------|
| 600 | Call declined |
| 601 | Call ended by customer |
| 602 | Call answered / ended by another agent |
| 603 | Call declined (via `dropCall()` — stops ringing on ALL devices) |

#### Business Rule Codes (PBX)

| Code | Description |
|------|-------------|
| 850 | Exceeded concurrent call limit |
| 851 | Exceeded call limit |
| 852 | No service plan assigned — contact provider |
| 853 | Internal number has been deactivated |
| 854 | Number is in DNC (Do Not Call) list |
| 855 | Exceeded call limit for trial plan |
| 856 | Exceeded minute limit for trial plan |
| 857 | Number blocked in configuration |
| 858 | Unknown or unconfigured number prefix |
| 859 | No available number for Viettel direction — contact provider |
| 860 | No available number for Vinaphone direction — contact provider |
| 861 | No available number for Mobifone direction — contact provider |
| 862 | Number prefix temporarily locked for Viettel |
| 863 | Number prefix temporarily locked for Vinaphone |
| 864 | Number prefix temporarily locked for Mobifone |
| 865 | Advertising call outside allowed time window — try again later |

**Common scenarios:**

```
User hangs up normally           → 200
Caller cancels before answer     → 487
Callee rejects (this device)     → 486  (rejectCall)
Callee rejects (all devices)     → 603  (dropCall)
Callee busy on another call      → 486
No answer / timeout              → 408 or 480
Answered by another agent        → 602
Exceeded concurrent call limit   → 850
Number in DNC list               → 854
```

**Usage:**

```typescript
omiEmitter.addListener(OmiCallEvent.onCallStateChanged, (data) => {
  if (data.status === OmiCallState.disconnected) {
    const code = data.codeEndCall;

    if (code === 200) {
      console.log('Call ended normally');
    } else if (code === 487) {
      console.log('Call was cancelled');
    } else if (code === 602) {
      console.log('Call was answered by another agent');
    } else if (code >= 850 && code <= 865) {
      console.log('Business rule error:', code);
      // Show user-friendly message based on code
    } else {
      console.log('Call ended with code:', code);
    }
  }
});
```

---

## Video Calls

### Setup

```typescript
import { OmiLocalCamera, OmiRemoteCamera } from 'omikit-plugin';
```

### Video Components

```tsx
// Local camera preview (your camera)
<OmiLocalCamera style={{ width: 120, height: 160 }} />

// Remote camera view (other party's video)
<OmiRemoteCamera style={{ width: '100%', height: '100%' }} />
```

### Video Call Flow

```typescript
// 1. Register for video events BEFORE starting call
await registerVideoEvent();

// 2. Start video call
await startCall({ phoneNumber: '0901234567', isVideo: true });

// 3. Toggle video during call
await toggleOmiVideo();   // on/off video stream
await switchOmiCamera();  // front/back camera

// 4. Listen for remote video ready
omiEmitter.addListener(OmiCallEvent.onRemoteVideoReady, () => {
  // Remote video is now available - show OmiRemoteCamera
});

// 5. Cleanup when call ends
await removeVideoEvent();
```

---

## Push Notifications

### Configuration

```typescript
// Call after startServices(), before or after login
await configPushNotification({
  // Your platform-specific push configuration
});
```

### How Push Works

#### iOS — VoIP Push (PushKit)

```
PBX ──► APNS ──► PushKit ──► App wakes up
                              ├── Report to CallKit
                              ├── Show system call UI
                              └── Register SIP & connect
```

- Uses PushKit VoIP push for reliable delivery even when app is killed
- CallKit provides native system call UI (slide to answer)
- No user-visible notification — CallKit handles the UI

#### Android — FCM

```
PBX ──► FCM ──► App receives data message
                 ├── Start foreground service
                 ├── Show full-screen notification
                 └── Register SIP & connect
```

- Uses FCM data message (not notification message)
- Foreground service keeps the app alive during the call
- Full-screen intent for lock screen call UI

### Notification Management

```typescript
// Hide the system notification without affecting SIP registration
await hideSystemNotificationSafely();

// Hide notification only
await hideSystemNotificationOnly();

// Hide notification and unregister SIP (with reason for analytics)
await hideSystemNotificationAndUnregister('user_dismissed');
```

---

## Permissions (Android)

Android 15+ requires explicit runtime permissions for VoIP functionality.

### Quick Setup

```typescript
import {
  checkAndRequestPermissions,
  checkPermissionStatus,
  requestPermissionsByCodes,
  requestSystemAlertWindowPermission,
  openSystemAlertSetting,
} from 'omikit-plugin';

// Check and request all permissions at once
const granted = await checkAndRequestPermissions(isVideo);

// Check current permission status
const status = await checkPermissionStatus();
// Returns: { microphone: boolean, camera: boolean, overlay: boolean, ... }
```

### Handle Permission Errors from startCall

```typescript
const result = await startCall({ phoneNumber, isVideo: false });

switch (result.status) {
  case 450: // OmiStartCallStatus.permissionMicrophone
    await requestPermissionsByCodes([450]);
    break;
  case 451: // OmiStartCallStatus.permissionCamera
    await requestPermissionsByCodes([451]);
    break;
  case 452: // OmiStartCallStatus.permissionOverlay
    await requestSystemAlertWindowPermission();
    // or open system settings directly:
    await openSystemAlertSetting();
    break;
}
```

### Permission Codes

| Code | Permission | Required for |
|------|-----------|--------------|
| 450 | Microphone | All calls |
| 451 | Camera | Video calls |
| 452 | Overlay (SYSTEM_ALERT_WINDOW) | Incoming call popup on lock screen |

> **Note:** On iOS, permissions are handled via `Info.plist` and system prompts. The above functions return `true` on iOS.

---

## Quality & Diagnostics

The `onCallQuality` event provides real-time call quality metrics during an active call.

### Event Payload

```typescript
{
  quality: number;   // 0 = Good, 1 = Medium, 2 = Bad
  stat: {
    mos: number;         // Mean Opinion Score (1.0 – 5.0)
    jitter: number;      // Jitter in milliseconds
    latency: number;     // Round-trip latency in milliseconds
    packetLoss: number;  // Packet loss percentage (0 – 100)
    lcn?: number;        // Loss Connect Number (Android only)
  }
}
```

### MOS Score Thresholds

| MOS Range | Quality | Description |
|-----------|---------|-------------|
| ≥ 4.0 | Excellent | Clear, no perceptible issues |
| 3.5 – 4.0 | Good | Minor impairments, generally clear |
| 3.0 – 3.5 | Fair | Noticeable degradation |
| 2.0 – 3.0 | Poor | Significant degradation |
| < 2.0 | Bad | Nearly unusable |

### Network Freeze Detection

When `lcn` (Loss Connect Number) increases consecutively, it indicates potential network freeze — useful for showing a "weak network" warning in the UI.

### Usage Example

```typescript
import { omiEmitter, OmiCallEvent } from 'omikit-plugin';

omiEmitter.addListener(OmiCallEvent.onCallQuality, ({ quality, stat }) => {
  // quality: 0 = Good, 1 = Medium, 2 = Bad
  if (quality >= 2 && stat) {
    console.warn(
      `Poor call quality — MOS: ${stat.mos}, Jitter: ${stat.jitter}ms, ` +
      `Latency: ${stat.latency}ms, Loss: ${stat.packetLoss}%`
    );
    // Show weak network warning to user
  }
});
```

---

## Advanced Features

### Check Credentials Without Connecting

Validate credentials without establishing a SIP connection:

```typescript
const result = await checkCredentials({
  userName: 'sip_user',
  password: 'sip_password',
  realm: 'your_realm',
});
// result: { success: boolean, statusCode: number, message: string }
```

### Register With Options

Full control over registration behavior:

```typescript
const result = await registerWithOptions({
  // Registration options
});
// result: { success: boolean, statusCode: number, message: string }
```

### Keep-Alive

Monitor and maintain SIP connection:

```typescript
// Check current keep-alive status
const status = await getKeepAliveStatus();

// Manually trigger a keep-alive ping
await triggerKeepAlivePing();
```

### Cold Start Call Handling

When the app is launched from a push notification:

```typescript
// Call this in your app's entry point
const initialCall = await getInitialCall();

if (initialCall) {
  // There's a pending call — navigate to call screen
  console.log('Pending call from:', initialCall.callerNumber);
}
```

---

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| `LINKING_ERROR` on launch | Native module not linked | Run `pod install` (iOS) or rebuild the app |
| Login returns `false` | Wrong SIP credentials or network | Verify `userName`, `password`, `realm`, `host` |
| `accountRegisterFailed` (status 6) | SIP registration failed | Check `realm` and `host` params; verify network connectivity |
| No incoming calls | Push not configured | Ensure FCM (Android) / PushKit VoIP (iOS) is set up |
| No incoming calls on iOS (killed) | Missing Background Mode | Enable "Voice over IP" in Background Modes |
| Incoming call on Android — no UI | Missing overlay permission | Call `requestSystemAlertWindowPermission()` |
| `startCall` returns 450/451/452 | Missing runtime permissions | Call `requestPermissionsByCodes([code])` |
| No audio during call | Audio route issue | Check `getAudio()` and `setAudio()` |
| Video not showing | Video event not registered | Call `registerVideoEvent()` before the call |
| NativeEventEmitter warning (iOS) | Old RN bridge issue | Upgrade to v4.0.x with New Architecture |
| `Invalid local URI` in logs | Empty proxy/host in login | Pass `host` parameter in `initCallWithUserPassword` |
| Build error with New Arch | Codegen not configured | Ensure `codegenConfig` exists in `package.json` |

---

## Documentation

Full documentation in [`./docs/`](./docs/):

- [Project Overview & PDR](./docs/project-overview-pdr.md)
- [Codebase Summary](./docs/codebase-summary.md)
- [System Architecture](./docs/system-architecture.md)
- [Code Standards](./docs/code-standards.md)
- [Roadmap](./docs/project-roadmap.md)

## License

MIT — [ViHAT Group](https://github.com/VIHATTeam)
