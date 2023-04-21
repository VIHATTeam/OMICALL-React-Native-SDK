# OMICALL SDK FOR React-Native

The OmiKit exposes the <a href="https://www.npmjs.com/package/omikit-plugin">omikit-plugin</a>.

The most important part of the framework is :

- Help to easy integrate with Omicall.
- Easy custom Call UI/UX.
- Optimize codec voip for you.
- Full inteface to interactive with core function like sound/ringtone/codec.

### Status

Currently active maintenance and improve performance

### Running

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

- Add these settings in `build.gradle`:
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

- Add these settings in `app/build.gradle`:
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
<receiver
  android:name="vn.vihat.omicall.omisdk.receiver.FirebaseMessageReceiver"
  android:exported="true"
  android:permission="com.google.android.c2dm.permission.SEND">
  <intent-filter>
    <action android:name="com.google.android.c2dm.intent.RECEIVE" />
  </intent-filter>
</receiver>
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

- Setup remote push notification: Only support Firebase for remote push notification.
  - Add `google-service.json` in `android/app` (For more information, you can refer <a href="https://rnfirebase.io/app/usage">Core/App</a>)
  - Add Fire Messaging to receive `fcm_token` (You can refer <a href="https://rnfirebase.io/messaging/usage">Cloud Messaging</a> to setup notification for React native)

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

-  Add these lines into `Info.plist`:

```
<key>NSMicrophoneUsageDescription</key>
<string>Need microphone access for make Call</string>
//If you implement video call
<key>NSCameraUsageDescription</key>
<string>Need camera access for video call functions</string>
```

- Save token for `OmiClient`: if You added `Cloud Messaging` in your project so you don't need add these lines.

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
*** Only use under lines when added `Cloud Messaging` plugin in your project ***
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
  - Start Serivce: OmiKit need start services and register some events.
    ```
    //Call in the root widget
    import { startServices } from 'omikit-plugin';
    
    startServices();
    ```
  - Create OmiKit With ApiKey: OmiKit need apikey, username, user id to init enviroment. ViHAT Group will provide api key for you. Please contact for my sale:
    ```
    import { initCallWithApiKey } from 'omikit-plugin';
    
    const loginInfo = {
      usrUuid: usrUuid,
      fullName: fullName,
      apiKey: apiKey,
      isVideo: isVideo,
    };
    console.log(loginInfo);
    const result = await initCallWithApiKey(loginInfo);
    //result is true then user login successfully.
    ```
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
    //result is true then user login successfully.
```
  - Config push notification for Android:
    ```
    import { configPushNotification } from 'omikit-plugin';
    
    configPushNotification({
      prefix : "Cuộc gọi tới từ: ",
      declineTitle : "Từ chối",
      acceptTitle : "Chấp nhận",
      acceptBackgroundColor : "#FF3700B3",
      declineBackgroundColor : "#FF000000",
      incomingBackgroundColor : "#FFFFFFFF",
      incomingAcceptButtonImage : "join_call", //image name
      incomingDeclineButtonImage : "hangup", //image name
      backImage : "ic_back", //image name: icon of back button
      userImage : "calling_face", //image name: icon of user default
      prefixMissedCallMessage: 'Cuộc gọi nhỡ từ' //config prefix message for the missed call
      missedCallTitle: 'Cuộc gọi nhỡ' //config title for the missed call
    });
    //incomingAcceptButtonImage, incomingDeclineButtonImage, backImage, userImage: Add these into `android/app/src/main/res/drawble`
    ```
  - Get call when user open app from killed status(only iOS):
    ```
    import { getInitialCall } from 'omikit-plugin';
    
    const callingInfo = await getInitialCall();
    if (callingInfo !== false) {
      navigation.navigate('DialCall' as never, callingInfo as never);
    }
    //callingInfo != false then user have a calling.
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
  -  Call with UUID (only support with Api key):
    ```
    import {startCallWithUuid} from 'omikit-plugin';
    
    const result = await startCallWithUuid({ 
        usrUuid: uuid, //phone number
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
  - Logout: Can't receive call.
    ```
    import {logout} from 'omikit-plugin';
    
    logout();
    ```
    
- Video Call functions: Support only video call, You need enable video in `init functions` and `start call` to implements under functions.
  - Switch front/back camera: We use the front camera for first time.
  ```
  import {switchOmiCamera} from 'omikit-plugin';
  switchOmiCamera();
  ```
  - Toggle a video in video call: On/off video in video call
  ```
  import {toggleOmiVideo} from 'omikit-plugin';
  toggleOmiVideo();
  ```
  - Local Camera Widget: Your camera view in a call
  ```
  import { OmiLocalCameraView } from 'omikit-plugin';
  <OmiLocalCameraView style={styles.localCamera} />
  ```
  - Remote Camera Widget: Remote camera view in a call
  ```
  import { OmiRemoteCameraView } from 'omikit-plugin';
  <OmiRemoteCameraView style={styles.remoteCamera} />
  ```
  - More function: Refresh local camera
  ```
  import {refreshLocalCamera} from 'omikit-plugin';
  refreshLocalCamera();
  ```
  - More function: Refresh remote camera
  ```
  import {refreshRemoteCamera} from 'omikit-plugin';
  refreshRemoteCamera();
  ```
  - Register event: Register remote video ready: only visible on iOS
  ```
  import {registerVideoEvent} from 'omikit-plugin';
  registerVideoEvent();
  ```


- Event listener:
```
useEffect(() => {
    omiEmitter.addListener(OmiCallEvent.incomingReceived, incomingReceived);
    omiEmitter.addListener(OmiCallEvent.onCallEstablished, onCallEstablished);
    omiEmitter.addListener(OmiCallEvent.onCallEnd, onCallEnd);
    omiEmitter.addListener(OmiCallEvent.onMuted, onMuted);
    omiEmitter.addListener(OmiCallEvent.onSpeaker, onSpeaker);
    omiEmitter.addListener(OmiCallEvent.onClickMissedCall, clickMissedCall);
    if (Platform.OS === 'ios') {
      registerVideoEvent();
      omiEmitter.addListener(
        OmiCallEvent.onRemoteVideoReady,
        refreshRemoteCameraEvent
      );
    }
    return () => {
        omiEmitter.removeAllListeners(OmiCallEvent.incomingReceived);
        omiEmitter.removeAllListeners('onCallEstablished');
        omiEmitter.removeAllListeners(OmiCallEvent.onCallEnd);
        omiEmitter.removeAllListeners(OmiCallEvent.onMuted);
        omiEmitter.removeAllListeners(OmiCallEvent.onSpeaker);
        if (Platform.OS === 'ios') {
           removeVideoEvent();
           omiEmitter.removeAllListeners(OmiCallEvent.onRemoteVideoReady);
        }
    };
}, []);
```
- Action Name value: 
    - `OmiCallEvent.incomingReceived`: Have a incoming call. On Android this event work only foreground
    - `OmiCallEvent.onCallEstablished`: Connected a call.
    - `OmiCallEvent.onCallEnd`: End a call.
    - `OmiCallEvent.onMuted`: Audio changed.
    - `OmiCallEvent.onSpeaker`: Audio changed.
    - `OmiCallEvent.onClickMissedCall`: Click missed call notification.
- Data value: We return `callerNumber`, `isVideo: true/false` information
