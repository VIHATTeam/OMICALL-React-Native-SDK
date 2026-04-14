# OMICALL SDK for React Native

[![npm version](https://img.shields.io/npm/v/omikit-plugin.svg)](https://www.npmjs.com/package/omikit-plugin)
[![npm downloads](https://img.shields.io/npm/dm/omikit-plugin.svg)](https://www.npmjs.com/package/omikit-plugin)
[![license](https://img.shields.io/badge/license-proprietary-red.svg)](./LICENSE)

```bash
npm install omikit-plugin
```

The [omikit-plugin](https://www.npmjs.com/package/omikit-plugin) enables VoIP/SIP calling via the OMICALL platform with support for both Old and **New Architecture** (TurboModules + Fabric).

> **⚠️ Expo is not supported.** This SDK requires native modules (SIP/VoIP, CallKit, PushKit) that are not compatible with Expo managed workflow. Please use React Native CLI.

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
| **4.x** (latest) | 0.74+ | Old + New (auto-detect) | `npm install omikit-plugin` |
| 3.3.x (legacy) | 0.60 – 0.73 | Old Architecture only | `npm install omikit-plugin@3.3.29` |

**v4.0.x highlights:**
- **TurboModules (JSI)** — 4-10x faster native method calls via direct C++ bridge
- **100% backward compatible** — auto-detects architecture at runtime
- **Zero breaking changes** from v3.x for RN 0.74+
- **Bridgeless mode** support for full New Architecture (iOS & Android)

### Native SDK Versions

| Platform | SDK | Version |
|----------|-----|---------|
| Android | OMIKIT | 2.6.9 |
| iOS | OmiKit | 1.11.9 |

### Platform Requirements

| | Android | iOS |
|--|---------|-----|
| **Min SDK** | API 24 (Android 7.0) | iOS 13.0 |
| **Target SDK** | API 36 (Android 16) | — |
| **Compile SDK** | API 36 | — |

### Device Requirements

| Requirement | Platform | Notes |
|-------------|----------|-------|
| **Physical device** | iOS (required) | iOS Simulator is **not supported** — OmiKit binary is arm64 device-only |
| **Physical device** | Android (recommended) | Emulator works for basic UI testing but VoIP/audio routing is unreliable |
| **Google Play Services** | Android (required) | Required for FCM push notifications |
| **Microphone** | Both (required) | Required for all calls |
| **Camera** | Both (optional) | Only required for video calls |
| **Internet** | Both (required) | SIP registration + RTP media streaming |

### Package Size

| Component | Size |
|-----------|------|
| npm package (total) | ~353 KB |
| Android native code | ~4.7 MB |
| iOS native code | ~176 KB |

> **Note:** These sizes are for the plugin only. The native SDKs (OmiKit/OMIKIT) are installed separately via CocoaPods/Maven and will add to the final app size.

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

> **Note:** By default, the SDK declares `WRITE_CALL_LOG` permission to save calls to the device's call history. If your app does **NOT** want calls saved to the device call log, add the following to remove it:
>
> ```xml
> <!-- Remove if you do NOT want calls saved to device call history -->
> <uses-permission android:name="android.permission.WRITE_CALL_LOG"
>     tools:node="remove" />
> ```
>
> Make sure to add the `tools` namespace to your manifest tag: `xmlns:tools="http://schemas.android.com/tools"`

### 2. Incoming Call Activity (Required)

Your main Activity must handle incoming call intents from the SDK. Add the following `intent-filter` to your `MainActivity` in `AndroidManifest.xml`:

```xml
<activity
  android:name=".MainActivity"
  android:showWhenLocked="true"
  android:turnScreenOn="true"
  android:launchMode="singleTask"
  ...>

  <!-- Incoming call intent-filter (required for lock screen) -->
  <intent-filter>
    <action android:name="${applicationId}.ACTION_INCOMING_CALL" />
    <action android:name="android.intent.action.CALL" />
    <category android:name="android.intent.category.DEFAULT" />
    <data android:host="incoming_call" android:scheme="omisdk" />
  </intent-filter>
</activity>
```

> **Important:** The `${applicationId}.ACTION_INCOMING_CALL` action ensures incoming calls show correctly on **lock screen** for Android 9-14. Without this, the default dialer may intercept the intent instead of your app.

### 3. Firebase Cloud Messaging (FCM)


Add your `google-services.json` to `android/app/`.

In `android/app/build.gradle`:

```groovy
apply plugin: 'com.google.gms.google-services'
```

### 4. Maven Repository

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
OMI_USER=omi_github_username
OMI_TOKEN=omi_github_access_token
```

> **Note:** Contact the OMICall development team to get `OMI_USER` and `OMI_TOKEN` credentials.

### 5. New Architecture (Optional)

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

The AppDelegate template differs depending on your React Native version. Choose the one that matches your project:

#### RN 0.74 – 0.78 (RCTAppDelegate pattern)

<details>
<summary>AppDelegate.h</summary>

```objc
#import <RCTAppDelegate.h>
#import <UIKit/UIKit.h>
#import <UserNotifications/UserNotifications.h>
#import <OmiKit/OmiKit.h>

@interface AppDelegate : RCTAppDelegate <UIApplicationDelegate, RCTBridgeDelegate, UNUserNotificationCenterDelegate>

@property (nonatomic, strong) UIWindow *window;
@property (nonatomic, strong) PushKitManager *pushkitManager;
@property (nonatomic, strong) CallKitProviderDelegate *provider;
@property (nonatomic, strong) PKPushRegistry *voipRegistry;

@end
```

</details>

<details>
<summary>AppDelegate.mm</summary>

```objc
#import "AppDelegate.h"
#import <Firebase.h>
#import <React/RCTBundleURLProvider.h>
#import <OmiKit/OmiKit.h>

#if __has_include("OmikitNotification.h")
#import "OmikitNotification.h"
#else
#import <omikit_plugin/OmikitNotification.h>
#endif

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"YourAppName"; // Replace with your app name

  // ----- OmiKit Config ------
  [OmiClient setEnviroment:KEY_OMI_APP_ENVIROMENT_SANDBOX
                userNameKey:@"full_name"
                    maxCall:2
               callKitImage:@"call_image"
              typePushVoip:TYPE_PUSH_CALLKIT_DEFAULT];

  self.provider = [[CallKitProviderDelegate alloc]
      initWithCallManager:[OMISIPLib sharedInstance].callManager];
  self.voipRegistry = [[PKPushRegistry alloc]
      initWithQueue:dispatch_get_main_queue()];
  self.pushkitManager = [[PushKitManager alloc]
      initWithVoipRegistry:self.voipRegistry];

  if (@available(iOS 10.0, *)) {
    [UNUserNotificationCenter currentNotificationCenter].delegate =
        (id<UNUserNotificationCenterDelegate>)self;
  }

  if ([FIRApp defaultApp] == nil) {
    [FIRApp configure];
  }
  // ----- End OmiKit Config ------

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

// Handle foreground notifications
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
       willPresentNotification:(UNNotification *)notification
         withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
{
  completionHandler(UNAuthorizationOptionSound | UNAuthorizationOptionAlert | UNAuthorizationOptionBadge);
}

// Handle missed call notification tap
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void (^)())completionHandler
{
  NSDictionary *userInfo = response.notification.request.content.userInfo;
  if (userInfo && [userInfo valueForKey:@"omisdkCallerNumber"]) {
    [OmikitNotification didRecieve:userInfo];
  }
  completionHandler();
}

// Register push notification token
- (void)application:(UIApplication *)app
    didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)devToken
{
  const unsigned char *data = (const unsigned char *)[devToken bytes];
  NSMutableString *token = [NSMutableString string];
  for (NSUInteger i = 0; i < [devToken length]; i++) {
    [token appendFormat:@"%02.2hhX", data[i]];
  }
  [OmiClient setUserPushNotificationToken:[token copy]];
}

// Terminate all calls when app is killed
- (void)applicationWillTerminate:(UIApplication *)application {
  @try {
    [OmiClient OMICloseCall];
  } @catch (NSException *exception) {}
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
```

</details>

#### RN 0.79+ (RCTReactNativeFactory pattern)

RN 0.79+ uses `RCTReactNativeFactory` instead of `RCTAppDelegate`. Add OmiKit setup in your existing AppDelegate:

<details>
<summary>AppDelegate.swift (Swift template)</summary>

```swift
import UIKit
import React
import ReactAppDependencyProvider
import OmiKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {
  var window: UIWindow?
  var provider: CallKitProviderDelegate?
  var pushkitManager: PushKitManager?
  var voipRegistry: PKPushRegistry?

  func application(_ application: UIApplication,
                   didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    // React Native setup
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "YourAppName",
      in: window,
      launchOptions: launchOptions
    )

    // ----- OmiKit Config ------
    #ifdef DEBUG
    OmiClient.setEnviroment(KEY_OMI_APP_ENVIROMENT_SANDBOX,
                            userNameKey: "full_name",
                            maxCall: 1,
                            callKitImage: "call_image",
                            typePushVoip: TYPE_PUSH_CALLKIT_DEFAULT)
    #else
    OmiClient.setEnviroment(KEY_OMI_APP_ENVIROMENT_PRODUCTION,
                            userNameKey: "full_name",
                            maxCall: 1,
                            callKitImage: "call_image",
                            typePushVoip: TYPE_PUSH_CALLKIT_DEFAULT)
    #endif

    provider = CallKitProviderDelegate(callManager: OMISIPLib.sharedInstance().callManager)
    voipRegistry = PKPushRegistry(queue: .main)
    pushkitManager = PushKitManager(voipRegistry: voipRegistry!)

    UNUserNotificationCenter.current().delegate = self
    FirebaseApp.configure()
    // ----- End OmiKit Config ------

    return true
  }

  // Handle missed call notification tap
  func userNotificationCenter(_ center: UNUserNotificationCenter,
                              didReceive response: UNNotificationResponse,
                              withCompletionHandler completionHandler: @escaping () -> Void) {
    let userInfo = response.notification.request.content.userInfo
    if userInfo["omisdkCallerNumber"] != nil {
      OmikitNotification.didRecieve(userInfo)
    }
    completionHandler()
  }

  // Register push notification token
  func application(_ application: UIApplication,
                   didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    let token = deviceToken.map { String(format: "%02.2hhX", $0) }.joined()
    OmiClient.setUserPushNotificationToken(token)
  }

  // Terminate all calls when app is killed
  func applicationWillTerminate(_ application: UIApplication) {
    try? OmiClient.omiCloseCall()
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    return bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
```

</details>

<details>
<summary>AppDelegate.mm (Objective-C template)</summary>

```objc
#import "AppDelegate.h"
#import <Firebase.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTReactNativeFactory.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>
#import <OmiKit/OmiKit.h>

#if __has_include("OmikitNotification.h")
#import "OmikitNotification.h"
#else
#import <omikit_plugin/OmikitNotification.h>
#endif

@interface ReactNativeDelegate : RCTDefaultReactNativeFactoryDelegate
@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  ReactNativeDelegate *delegate = [ReactNativeDelegate new];
  RCTReactNativeFactory *factory = [[RCTReactNativeFactory alloc] initWithDelegate:delegate];
  delegate.dependencyProvider = [RCTAppDependencyProvider new];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  [factory startReactNativeWithModuleName:@"YourAppName" in:self.window launchOptions:launchOptions];

  // ----- OmiKit Config ------
  #ifdef DEBUG
        [OmiClient setEnviroment:KEY_OMI_APP_ENVIROMENT_SANDBOX userNameKey:@"full_name" maxCall:1 callKitImage:@"icYourApp" typePushVoip:@"background"];
  #else
        [OmiClient setEnviroment:KEY_OMI_APP_ENVIROMENT_PRODUCTION userNameKey:@"full_name" maxCall:1 callKitImage:@"icYourApp" typePushVoip:@"background"];
  #endif

  self.provider = [[CallKitProviderDelegate alloc]
      initWithCallManager:[OMISIPLib sharedInstance].callManager];
  self.voipRegistry = [[PKPushRegistry alloc]
      initWithQueue:dispatch_get_main_queue()];
  self.pushkitManager = [[PushKitManager alloc]
      initWithVoipRegistry:self.voipRegistry];

  if (@available(iOS 10.0, *)) {
    [UNUserNotificationCenter currentNotificationCenter].delegate =
        (id<UNUserNotificationCenterDelegate>)self;
  }

  if ([FIRApp defaultApp] == nil) {
    [FIRApp configure];
  }
  // ----- End OmiKit Config ------

  return YES;
}

// Handle missed call notification tap
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void (^)())completionHandler
{
  NSDictionary *userInfo = response.notification.request.content.userInfo;
  if (userInfo && [userInfo valueForKey:@"omisdkCallerNumber"]) {
    [OmikitNotification didRecieve:userInfo];
  }
  completionHandler();
}

// Register push notification token
- (void)application:(UIApplication *)app
    didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)devToken
{
  const unsigned char *data = (const unsigned char *)[devToken bytes];
  NSMutableString *token = [NSMutableString string];
  for (NSUInteger i = 0; i < [devToken length]; i++) {
    [token appendFormat:@"%02.2hhX", data[i]];
  }
  [OmiClient setUserPushNotificationToken:[token copy]];
}

// Terminate all calls when app is killed
- (void)applicationWillTerminate:(UIApplication *)application {
  @try {
    [OmiClient OMICloseCall];
  } @catch (NSException *exception) {}
}

@end

@implementation ReactNativeDelegate

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
```

</details>

> **Note:** Replace `YourAppName` with your app's module name. For production, change `KEY_OMI_APP_ENVIROMENT_SANDBOX` to `KEY_OMI_APP_ENVIROMENT_PRODUCTION`.

### 5. New Architecture (Optional)

In your `Podfile`:

```ruby
ENV['RN_NEW_ARCH_ENABLED'] = '1'
```

For **New Architecture with video call support**, add Fabric interop registration in `AppDelegate.mm` inside `didFinishLaunchingWithOptions`, **before** `return [super ...]`:

```objc
// Required imports at the top of AppDelegate.mm
#import <React-RCTFabric/React/RCTComponentViewFactory.h>
#import <React-RCTFabric/React/RCTLegacyViewManagerInteropComponentView.h>

// Inside didFinishLaunchingWithOptions, before return:
[RCTLegacyViewManagerInteropComponentView supportLegacyViewManagerWithName:@"OmiLocalCameraView"];
[RCTLegacyViewManagerInteropComponentView supportLegacyViewManagerWithName:@"OmiRemoteCameraView"];
```

> **Important:** Bridgeless mode is **not yet supported** for video call views. If you use New Architecture, keep bridge mode enabled (do **not** add `bridgelessEnabled` returning `YES`).

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
   │  (v2.6.5)   │                  │  (v1.11.4)  │
   │      │      │                  │      │       │
   │      ▼      │                  │      ▼       │
   │  SIP Stack  │                  │  SIP Stack   │
   │  (OMSIP)    │                  │  (OMSIP)     │
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

// Step 1: Start SDK services
// ⚠️ Call ONCE on app launch (e.g., in App.tsx / index.js / useEffect in root component)
// Do NOT call this multiple times — it initializes native audio and event listeners.
await startServices();

// Step 2: Login with SIP credentials
const loginResult = await initCallWithUserPassword({
  userName: 'sip_user',
  password: 'sip_password',
  realm: 'your_realm',
  host: '',              // SIP proxy, defaults to vh.omicrm.com
  isVideo: false,
  fcmToken: 'your_fcm_token',
  projectId: 'your_project_id', // firebase project id
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
  projectId: string,       // Firebase project ID 
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

### Option 3: App-to-App API (v4.0+)

Starting from **v4.0**, customers using the **App-to-App** service must call the OMICALL API to provision SIP extensions before initializing the SDK. The API returns SIP credentials that you pass to `initCallWithUserPassword()` with `isSkipDevices: true`.

> For full API documentation (endpoints, request/response formats), see the [API Integration Guide](./docs/api-integration-guide.md).

**Quick flow:**

```
Your Backend                    OMICALL API                 Mobile App (SDK)
     │                              │                            │
     │  1. POST .../init            │                            │
     ├─────────────────────────────►│                            │
     │  {domain, extension,         │                            │
     │   password, proxy}           │                            │
     │◄─────────────────────────────┤                            │
     │                              │                            │
     │  2. Return credentials       │                            │
     ├──────────────────────────────────────────────────────────►│
     │                              │   3. startServices()       │
     │                              │   4. initCallWithUserPassword
     │                              │      (isSkipDevices: true) │
     │                              │                            │
```

```typescript
// After getting credentials from your backend:
await startServices();

await initCallWithUserPassword({
  userName: credentials.extension,     // from API response
  password: credentials.password,      // from API response
  realm: credentials.domain,           // from API response
  host: credentials.outboundProxy,     // from API response
  isVideo: false,
  fcmToken: 'your-fcm-token',
  isSkipDevices: true,                 // Required for App-to-App
});
```

> **Important:**
> - Call the OMICALL API from your **backend server** only — never expose the Bearer token in client-side code.
> - You **must** call the [Logout API](./docs/api-integration-guide.md#5-logout) before switching users. Otherwise, both devices using the same SIP extension will receive incoming calls simultaneously.
> - Use getter functions (`getProjectId()`, `getAppId()`, `getDeviceId()`, `getFcmToken()`, `getVoipToken()`) to retrieve device params for the [Add Device](./docs/api-integration-guide.md#4-add-device) and Logout APIs.

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
      │  │ Show Call UI │   │                     │
      │  │[Accept][Deny]│   │                     │
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

  ┌───────────────── iOS (VoIP Push) ───────────────────┐
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
  └─────────────────────────────────────────────────────┘

  ┌───────────────── Android (FCM) ─────────────────────┐
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
  └─────────────────────────────────────────────────────┘

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
      │                     │  Show Missed Call   │
      │                     │  Notification       │
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
  ┌── rejectCall() ───┐                           │
  │ Decline this      │  486 Busy Here            │
  │ device only       ├─────────────────────────► │
  └───────────────────┘  (other devices ring)     │
      │                     │                     │
  ┌── dropCall() ─────┐                           │
  │ Decline + stop    │  603 Decline              │
  │ ALL devices       ├─────────────────────────► │
  └───────────────────┘  (PBX stops all ringing)  │
      │                     │                     │
```

---

## API Reference

### Service & Auth

| Function | Returns | Description |
|----------|---------|-------------|
| `startServices()` | `Promise<boolean>` | Initialize SDK. **Call once** on app launch (e.g., `App.tsx` or `index.js`). Do not call multiple times |
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

> **Important:** To use video calls, you must login with `isVideo: true` in `initCallWithUserPassword()`. This enables camera support during SIP registration.

### Prerequisites

```typescript
// Login with video support enabled
await initCallWithUserPassword({
  userName: 'sip_user',
  password: 'sip_password',
  realm: 'your_realm',
  isVideo: true,       // Required for video call support
  fcmToken: fcmToken,
});
```

### Video Components

```tsx
import {
  OmiLocalCameraView,   // Your camera preview
  OmiRemoteCameraView,  // Remote party's video
  registerVideoEvent,
  removeVideoEvent,
  refreshRemoteCamera,
  refreshLocalCamera,
  switchOmiCamera,
  toggleOmiVideo,
  setupVideoContainers, // iOS Fabric only
  setCameraConfig,      // iOS Fabric only
  omiEmitter,
  OmiCallEvent,
  OmiCallState,
} from 'omikit-plugin';
```

### Platform Differences

| Feature | Android | iOS (Old Arch) | iOS (New Arch / Fabric) |
|---------|---------|----------------|------------------------|
| Video rendering | JSX components | JSX components | Native window containers |
| Camera views | `<OmiRemoteCameraView>` in JSX | `<OmiRemoteCameraView>` in JSX | `setupVideoContainers()` from JS |
| Style control | React `style` props | React `style` props | `setCameraConfig()` from JS |
| Controls overlay | Overlay on video | Overlay on video | Below video (split layout) |

### Cross-Platform Video Call Example

Complete example supporting both Android and iOS (Old + New Architecture):

```tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import {
  OmiRemoteCameraView, OmiLocalCameraView,
  omiEmitter, OmiCallEvent, OmiCallState,
  registerVideoEvent, removeVideoEvent,
  refreshRemoteCamera, refreshLocalCamera,
  setupVideoContainers, setCameraConfig,
  switchOmiCamera, toggleOmiVideo, toggleMute, endCall,
} from 'omikit-plugin';

const { width: SW, height: SH } = Dimensions.get('window');

export const VideoCallScreen = ({ navigation, route }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const hasNavigated = useRef(false);

  // iOS Fabric: configure native video container position/size
  const configureIOSVideo = useCallback(() => {
    setCameraConfig({
      target: 'remote',
      x: 0, y: 0, width: SW, height: SH * 0.65,
      scaleMode: 'fill', backgroundColor: '#000',
    });
    setCameraConfig({
      target: 'local',
      x: SW - 136, y: 60, width: 120, height: 180,
      borderRadius: 12, scaleMode: 'fill',
    });
  }, []);

  useEffect(() => {
    // iOS: register video events before call
    if (Platform.OS === 'ios') registerVideoEvent();

    const sub = omiEmitter.addListener(OmiCallEvent.onCallStateChanged, (data) => {
      const { status } = data;

      if (status === OmiCallState.confirmed) {
        setIsCallActive(true);

        if (Platform.OS === 'android') {
          // Android: connect video feeds to TextureView surfaces
          refreshRemoteCamera();
          refreshLocalCamera();
        } else {
          // iOS Fabric: create native window containers + connect SDK
          setupVideoContainers().then(() => configureIOSVideo());
        }
      }

      if ((status === OmiCallState.disconnected || status === 6) && !hasNavigated.current) {
        hasNavigated.current = true;
        // iOS: hide native containers before navigating
        if (Platform.OS === 'ios') {
          setCameraConfig({ target: 'remote', hidden: true });
          setCameraConfig({ target: 'local', hidden: true });
        }
        setTimeout(() => {
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        }, 100);
      }
    });

    return () => {
      sub.remove();
      if (Platform.OS === 'ios') removeVideoEvent();
    };
  }, [navigation, configureIOSVideo]);

  const handleEndCall = useCallback(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    if (Platform.OS === 'ios') {
      setCameraConfig({ target: 'remote', hidden: true });
      setCameraConfig({ target: 'local', hidden: true });
    }
    endCall();
    setTimeout(() => {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    }, 1000);
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* ============ VIDEO AREA ============ */}

      {/* Android: camera views via JSX — controls can overlay on top */}
      {Platform.OS === 'android' && isCallActive && (
        <>
          <OmiRemoteCameraView style={StyleSheet.absoluteFillObject} />
          <OmiLocalCameraView style={styles.localPiP} />
        </>
      )}

      {/* iOS Fabric: native video renders on window (top ~65%).
          React controls render below video area. */}

      {/* ============ CONTROLS AREA ============ */}

      {/* Spacer — pushes controls to bottom */}
      <View style={{ flex: 1 }} />

      {/* Controls panel */}
      {isCallActive && (
        <View style={styles.controls}>
          <TouchableOpacity onPress={() => { toggleMute(); setIsMuted(m => !m); }}>
            <Text style={styles.btn}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { toggleOmiVideo(); setCameraOn(c => !c); }}>
            <Text style={styles.btn}>{cameraOn ? 'Cam Off' : 'Cam On'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={switchOmiCamera}>
            <Text style={styles.btn}>Flip</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEndCall}>
            <Text style={[styles.btn, { backgroundColor: 'red' }]}>End</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Answer/Reject for incoming calls */}
      {!isCallActive && (
        <View style={styles.controls}>
          <TouchableOpacity onPress={handleEndCall}>
            <Text style={[styles.btn, { backgroundColor: 'red' }]}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E3050' },
  localPiP: {
    position: 'absolute', top: 60, right: 16,
    width: 120, height: 180, borderRadius: 12, overflow: 'hidden', zIndex: 10,
  },
  controls: {
    flexDirection: 'row', justifyContent: 'space-evenly',
    paddingVertical: 20, paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.5)', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  btn: {
    color: '#fff', fontSize: 14, paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 24, overflow: 'hidden',
  },
});
```

> **Key differences per platform:**
> - **Android**: `<OmiRemoteCameraView>` + `<OmiLocalCameraView>` render in JSX. Call `refreshRemoteCamera()` + `refreshLocalCamera()` when confirmed. Controls overlay on video.
> - **iOS (Old Arch)**: Same as Android — JSX camera views work normally.
> - **iOS (New Arch/Fabric)**: `RCTViewManager.view()` not called. Use `setupVideoContainers()` to create native window containers, then `setCameraConfig()` to adjust position/style. Controls render below video (split layout).
> - **Disconnect**: On iOS, call `setCameraConfig({ target: 'remote', hidden: true })` before navigating to prevent stale video overlay. Use `setTimeout` for navigation — native event callback may block immediate navigation.
> - **End call**: Use `navigation.reset()` instead of `goBack()` to clear stacked screens. Guard with `useRef` to prevent multiple navigations.

### `setCameraConfig()` — iOS Fabric Only

Control native video container style from JS:

```typescript
setCameraConfig({
  target: 'local' | 'remote',
  x?: number,              // X position
  y?: number,              // Y position
  width?: number,          // View width
  height?: number,         // View height
  borderRadius?: number,   // Corner radius
  borderWidth?: number,    // Border width
  borderColor?: string,    // Hex color (#RRGGBB or #RRGGBBAA)
  backgroundColor?: string,
  opacity?: number,        // 0.0 - 1.0
  hidden?: boolean,        // Show/hide
  scaleMode?: 'fill' | 'fit' | 'stretch',
});
```

### Video API Reference

| Function | Description | Platform |
|----------|-------------|----------|
| `registerVideoEvent()` | Register for video notifications | iOS only |
| `removeVideoEvent()` | Cleanup video notifications | iOS only |
| `refreshRemoteCamera()` | Connect remote video feed to surface | Both |
| `refreshLocalCamera()` | Connect local camera feed to surface | Both |
| `switchOmiCamera()` | Switch front/back camera | Both |
| `toggleOmiVideo()` | Toggle camera on/off during call | Both |
| `setupVideoContainers()` | Create native video containers on window | iOS Fabric only |
| `setCameraConfig()` | Control video container style/position | iOS Fabric only |

### Known Limitations

- **iOS Fabric**: Controls cannot overlay on top of video (native window z-order). Use split layout — video top, controls bottom.
- **iOS Fabric**: Camera switch has ~3-6s delay (SDK Metal stabilization).
- **Android**: Must login with `isVideo: true` for camera to initialize. Without it, colorbar test pattern shows instead of camera.
- **Simulator**: Video calls require physical device on both platforms.

See [Known Issues](./docs/known-issues.md) for full details.

---

## Push Notifications

> **Setup Guide:** To configure VoIP (iOS) and FCM (Android) for receiving incoming calls, follow the detailed guide at [OMICall Mobile SDK Setup](https://omicrm.io/post/detail/mobile-sdk-post89?lng=vi&p=BrwVVWCLGM).

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

---

## Permissions

Runtime permissions must be granted before making or receiving calls. We recommend using [`react-native-permissions`](https://github.com/zoontek/react-native-permissions) for a consistent cross-platform experience.

### Install

```bash
npm install react-native-permissions
# iOS
cd ios && pod install
```

### Android Runtime Permissions

```typescript
import { check, request, PERMISSIONS, RESULTS, Platform } from 'react-native-permissions';

async function requestCallPermissions(isVideo: boolean) {
  if (Platform.OS !== 'android') return true;

  // Voice call permissions
  const permissions = [
    PERMISSIONS.ANDROID.RECORD_AUDIO,
    PERMISSIONS.ANDROID.CALL_PHONE,
    PERMISSIONS.ANDROID.POST_NOTIFICATIONS, // Android 13+
  ];

  // Video call — add camera
  if (isVideo) {
    permissions.push(PERMISSIONS.ANDROID.CAMERA);
  }

  const results = await Promise.all(permissions.map((p) => request(p)));
  return results.every((r) => r === RESULTS.GRANTED);
}
```

### iOS Runtime Permissions

```typescript
import { request, PERMISSIONS, RESULTS, Platform } from 'react-native-permissions';

async function requestCallPermissions(isVideo: boolean) {
  if (Platform.OS !== 'ios') return true;

  const micResult = await request(PERMISSIONS.IOS.MICROPHONE);
  if (micResult !== RESULTS.GRANTED) return false;

  if (isVideo) {
    const camResult = await request(PERMISSIONS.IOS.CAMERA);
    if (camResult !== RESULTS.GRANTED) return false;
  }

  return true;
}
```

### Overlay Permission (Android only)

To show incoming call UI on lock screen, overlay permission is required:

```typescript
import { requestSystemAlertWindowPermission, openSystemAlertSetting } from 'omikit-plugin';

// Request overlay permission
await requestSystemAlertWindowPermission();

// Or open system settings directly
await openSystemAlertSetting();
```

### Permission Summary

| Permission | Platform | Required for |
|-----------|----------|--------------|
| Microphone (`RECORD_AUDIO`) | Android & iOS | All calls |
| Camera (`CAMERA`) | Android & iOS | Video calls only |
| Phone (`CALL_PHONE`) | Android | VoIP calls |
| Notification (`POST_NOTIFICATIONS`) | Android 13+ | Incoming call notifications |
| Overlay (`SYSTEM_ALERT_WINDOW`) | Android | Incoming call popup on lock screen |

> **Note:** On iOS, microphone and camera permissions are handled via `Info.plist` descriptions and system prompts. Overlay permission is not applicable on iOS.

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
| Video not showing (iOS) | Video event not registered | Call `registerVideoEvent()` before the call |
| Video shows colorbar (Android) | Login with `isVideo: false` | Login with `isVideo: true` to enable camera |
| Video black screen (Android) | Feed not connected | Ensure `refreshRemoteCamera()` + `refreshLocalCamera()` called on confirmed |
| iOS Fabric: controls hidden | Native video on UIWindow covers React | Use split layout — video top, controls bottom. See [Known Issues](./docs/known-issues.md) |
| NativeEventEmitter warning (iOS) | Old RN bridge issue | Upgrade to v4.0.x with New Architecture |
| `Invalid local URI` in logs | Empty proxy/host in login | Pass `host` parameter in `initCallWithUserPassword` |
| Build error with New Arch | Codegen not configured | Ensure `codegenConfig` exists in `package.json` |
| iOS Simulator build fails (arm64) | OmiKit binary does not include simulator slice | **iOS Simulator is not supported.** OmiKit SDK is device-only (`arm64` real device). Always build and test on a physical iOS device |

---

## Documentation

Full documentation in [`./docs/`](./docs/):

- [API Integration Guide (App-to-App)](./docs/api-integration-guide.md)
- [Known Issues & Limitations](./docs/known-issues.md)
- [Project Overview & PDR](./docs/project-overview-pdr.md)
- [Codebase Summary](./docs/codebase-summary.md)
- [System Architecture](./docs/system-architecture.md)
- [Code Standards](./docs/code-standards.md)
- [Roadmap](./docs/project-roadmap.md)

## License

MIT — [ViHAT Group](https://github.com/VIHATTeam)
