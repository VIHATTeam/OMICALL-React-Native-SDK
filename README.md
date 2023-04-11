# OMICALL SDK FOR React-Native

The OmiKit exposes the <a href="https://www.npmjs.com/package/omikit-plugin">omikit-plugin</a>.

The most important part of the framework is :

- Help to easy integrate with Omicall.
- Easy custom Call UI/UX.
- Optimize codec voip for you.
- Full inteface to interactive with core function like sound/ringtone/codec.

## Status

Currently active maintainance and improve performance

## Running

Install via npm:

```sh
npm install omikit-plugin@latest
```

Install via yarn:

```sh
yarn add omikit-plugin --latest
```

### Configuration

#### Android:

- Add this setting in `build.gradle`:
```
jcenter() 
maven {
    url("https://vihatgroup.jfrog.io/artifactory/omi-voice/")
    credentials {
        username = "downloader"
        password = "Omi@2022"
    }
}
```
```
//in dependencies
classpath 'com.google.gms:google-services:4.3.13'
```
```
//under buildscript
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
          url("https://vihatgroup.jfrog.io/artifactory/omi-voice/")
          credentials {
            username = "downloader"
            password = "Omi@2022"
          }
        }
      }
}
```

You can refer <a href="https://github.com/VIHATTeam/OMICALL-React-Native-SDK/blob/main/example/android/build.gradle">android/build.gradle</a> to know more informations.

- Add this setting In `app/build.gradle`:
```
apply plugin: 'com.android.application'
apply plugin: 'kotlin-android'
apply plugin: 'com.google.gms.google-services'
```

You can refer <a href="https://github.com/VIHATTeam/OMICALL-React-Native-SDK/blob/main/example/android/app/build.gradle">android/app/build.gradle</a> to know more informations.

- Update AndroidManifest.xml:
```
//need request this permission
<uses-permission android:name="android.permission.INTERNET" />
//add this lines inside <activity>
<intent-filter>
    <action android:name="com.omicall.sdk.CallingActivity"/>
    <category android:name="android.intent.category.DEFAULT" />
</intent-filter>
//add this lines outside <activity>
<service
    android:name="vn.vihat.omicall.omisdk.service.FMService"
    android:enabled="true"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```

You can refer <a href="https://github.com/VIHATTeam/OMICALL-React-Native-SDK/blob/main/example/android/app/src/main/AndroidManifest.xml">AndroidManifest</a> to know more informations.

- We registered permissions into my plugin:
```
<uses-permission android:name="android.permission.BROADCAST_CLOSE_SYSTEM_DIALOGS"
    tools:ignore="ProtectedPermissions" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.USE_SIP" />
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />
<uses-permission android:name="android.permission.WAKE_LOCK"/>
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
<uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```

- Setup push notification: We only support Firebase for push notification.
  - Add `google-service.json` in `android/app` (For more information, you can refer <a href="https://rnfirebase.io/app/usage">Core/App</a>)
  - Add Fire Messaging to receive `fcm_token` (You can refer <a href="https://pub.dev/packages/firebase_messaging">Cloud Messaging</a> to setup notification for Flutter)

  - For more setting information, please refer <a href="https://rnfirebase.io/messaging/usage">Config Push for Android</a>

#### iOS:
----

We support both Object-C and Swift. But we only support documents for Object-C. We will write for Swift language later. Thank you.

---

- Add variables in Appdelegate.h:

```
#import <UIKit/UIKit.h>
#import <UserNotifications/UserNotifications.h>
#import <OmiKit/OmiKit-umbrella.h>
#import <OmiKit/Constants.h>
#import <UserNotifications/UserNotifications.h>

PushKitManager *pushkitManager;
CallKitProviderDelegate * provider;
PKPushRegistry * voipRegistry;
```

- Edit AppDelegate.m:

```
#import <OmiKit/OmiKit.h>
#import <omicall_flutter_plugin/omicall_flutter_plugin-Swift.h>

[OmiClient setEnviroment:KEY_OMI_APP_ENVIROMENT_SANDBOX];
provider = [[CallKitProviderDelegate alloc] initWithCallManager: [OMISIPLib sharedInstance].callManager];
voipRegistry = [[PKPushRegistry alloc] initWithQueue:dispatch_get_main_queue()];
pushkitManager = [[PushKitManager alloc] initWithVoipRegistry:voipRegistry];
```

-  Add this lines into `Info.plist`:

```
<key>NSMicrophoneUsageDescription</key>
<string>Need microphone access for make Call</string>
//If you implement video call
<key>NSCameraUsageDescription</key>
<string>Need camera access for video call functions</string>
```

- Save token for `OmiClient`: You use `Cloud Messaging` into your project so you don't need add this lines.

```
- (void)application:(UIApplication*)app didRegisterForRemoteNotificationsWithDeviceToken:(NSData*)devToken
{
    // parse token bytes to string
    const char *data = [devToken bytes];
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
*** Only use under lines when add `Cloud Messaging` plugin ***
- Setup push notification: We only support Firebase for push notification.
  - Add `google-service.json` in `android/app` (For more information, you can refer <a href="https://rnfirebase.io/app/usage">Core/App</a>)
  - Add Firebase Messaging to receive `fcm_token` (You can refer <a href="https://pub.dev/packages/firebase_messaging">Cloud Messaging</a> to setup notification for React Native)

  - For more setting information, please refer <a href="https://api.omicall.com/web-sdk/mobile-sdk/ios-sdk/cau-hinh-push-notification">Config Push for iOS</a>

## Implement

- Set up <a href="https://rnfirebase.io/messaging/usage">Cloud Messaging</a> plugin:

```
//if you use only on Android. you only implement for Android.
//because we use APNS to push notification on iOS so you don't need add Firebase for iOS.
//But you can use firebase-messaging to get APNS token for iOS.
```
- Important function.
  - Create OmiKit: OmiKit need userName, password, realm, host to init enviroment. ViHAT Group will provide informations for you. Please contact for my sale:
```
    import { initCall } from 'omikit-plugin';
    
    const loginInfo = {
      userName: userName, //string
      password: password, //string
      realm: realm, //string
      isVideo: isVideo, //boolean: true/false
      host: host, //string
    };
    const result = await initCall(loginInfo);
```
- Upload token: OmiKit need FCM for Android and APNS to push notification on user devices. We use more packages: <a href="https://rnfirebase.io/messaging/usage">Cloud Messaging</a> and <a href="https://www.npmjs.com/package/react-native-device-info?activeTab=readme">react-native-device-info</a>
  ```
  import { updateToken } from 'omikit-plugin';
  
  const fcmToken = await fcm;
  const apnsToken = await apns;
  const deviceId = DeviceInfo.getDeviceId();
  const appId = DeviceInfo.getBundleId();
  updateToken({
    apnsToken: apnsToken,
    fcmToken: fcmToken,
    deviceId: deviceId,
    appId: appId,
  });
  ```
- Other functions:
  -  Call with phone number (mobile phone or internal number):
    ```
    import {startCall} from 'omikit-plugin';
    
    const result = await startCall({ 
        phoneNumber: phone, //phone number
        isVideo: false //allow video call: true/false
    });
    ```
  - Accept a call:
    ```
    import {joinCall} from 'omikit-plugin';
    
    await joinCall();
    ```
  - End a call: We will push a event `endCall` for you.
    ```
    import {endCall} from 'omikit-plugin';
    
    await endCall();
    ```
  - Toggle the audio: On/off audio a call
    ```
    import {toggleMute} from 'omikit-plugin';
    
    toggleMute();
    ```
  - Toggle the speaker: On/off the phone speaker
    ```
    import {toggleSpeaker} from 'omikit-plugin';
    
    toggleSpeaker();
    ```
  - Send character: We only support `1 to 9` and `* #`.
    ```
    import {sendDTMF} from 'omikit-plugin';
    
    sendDTMF({
        character: text,
    });
    ```

- Event listener:

```
useEffect(() => {
    omiEmitter.addListener('incomingReceived', incomingReceived);
    omiEmitter.addListener('onCallEstablished', onCallEstablished);
    omiEmitter.addListener('onCallEnd', onCallEnd);
    omiEmitter.addListener('onMuted', onMuted);
    return () => {
        omiEmitter.removeAllListeners('incomingReceived');
        omiEmitter.removeAllListeners('onCallEstablished');
        omiEmitter.removeAllListeners('onCallEnd');
        omiEmitter.removeAllListeners('onMuted');
    };
}, []);
```
- Action Name value: 
    - `incomingReceived`: Have a incoming call. On Android this event work only foreground
    - `onCallEstablished`: Connected a call.
    - `onCallEnd`: End a call.
    - `onMuted`: Audio changed.
- Data value: We return `callerNumber`, `isVideo: true/false` information
