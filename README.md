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
    url "https://gitlab.com/api/v4/projects/47675059/packages/maven"
    credentials(HttpHeaderCredentials) {
        name = "Private-Token"
        value = "glpat-AzyyrvKz9_pjsgGW4xfp"
    }
    authentication {
        header(HttpHeaderAuthentication)
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
            url "https://gitlab.com/api/v4/projects/47675059/packages/maven"
            credentials(HttpHeaderCredentials) {
                name = "Private-Token"
                value = "glpat-AzyyrvKz9_pjsgGW4xfp"
            }
            authentication {
                header(HttpHeaderAuthentication)
            }
        }
      }
}
```

You can refer <a href="https://github.com/VIHATTeam/OMICALL-React-Native-SDK/blob/main/example/android/build.gradle">android/build.gradle</a> to know more informations.

- Add these settings in `app/build.gradle`:

```
apply plugin: 'com.android.application'
apply plugin: 'com.google.gms.google-services'
```

You can refer <a href="https://github.com/VIHATTeam/OMICALL-React-Native-SDK/blob/main/example/android/app/build.gradle">android/app/build.gradle</a> to know more informations.

- Update AndroidManifest.xml:

```
//need request this permission
//need request this permission
<uses-permission android:name="android.permission.INTERNET" />
//add these lines inside <activity>
<intent-filter>
    <action android:name="com.omicall.sdk.CallingActivity"/>
    <category android:name="android.intent.category.DEFAULT" />
</intent-filter>
//add these lines outside <activity>
<receiver
    android:name="vn.vihat.omicall.omisdk.receiver.FirebaseMessageReceiver"
    android:exported="true"
    android:permission="com.google.android.c2dm.permission.SEND">
    <intent-filter>
        <action android:name="com.google.android.c2dm.intent.RECEIVE" />
    </intent-filter>
</receiver>
<service
    android:name="vn.vihat.omicall.omisdk.service.NotificationService"
    android:exported="false">
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
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
<uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```

- Setup remote push notification: Only support Firebase for remote push notification.

  - Add `google-service.json` in `android/app` (For more information, you can refer <a href="https://rnfirebase.io/app/usage">Core/App</a>)
  - Add Firebase Messaging to receive `fcm_token` (You can refer <a href="https://rnfirebase.io/messaging/usage">Cloud Messaging</a> to setup notification for React native)

  - For more setting information, please refer <a href="https://api.omicall.com/web-sdk/mobile-sdk/android-sdk/cau-hinh-push-notification">Config Push for Android</a>

#### iOS(Object-C):

- Assets: Add `call_image` into assets folder to update callkit image. We only support png style.

- Add variables in Appdelegate.h:

```
#import <UIKit/UIKit.h>
#import <UserNotifications/UserNotifications.h>
#import <OmiKit/OmiKit-umbrella.h>
#import <OmiKit/Constants.h>

@interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate, UNUserNotificationCenterDelegate>

@property (nonatomic, strong) UIWindow *window;
@property (nonatomic, strong) PushKitManager *pushkitManager;
@property (nonatomic, strong) CallKitProviderDelegate * provider;
@property (nonatomic, strong) PKPushRegistry * voipRegistry;

@end
```

- Edit AppDelegate.m:

```
#import <OmiKit/OmiKit.h>
#import <omicall_flutter_plugin/omicall_flutter_plugin-Swift.h>

[OmiClient setEnviroment:KEY_OMI_APP_ENVIROMENT_SANDBOX userNameKey:@"full_name" maxCall:2 callKitImage:@"call_image"];
provider = [[CallKitProviderDelegate alloc] initWithCallManager: [OMISIPLib sharedInstance].callManager];
voipRegistry = [[PKPushRegistry alloc] initWithQueue:dispatch_get_main_queue()];
pushkitManager = [[PushKitManager alloc] initWithVoipRegistry:voipRegistry];
if (@available(iOS 10.0, *)) {
      [UNUserNotificationCenter currentNotificationCenter].delegate = (id<UNUserNotificationCenterDelegate>) self;
}

//Called when a notification is delivered to a foreground app.
-(void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler
{
  NSLog(@"User Info : %@",notification.request.content.userInfo);
  completionHandler(UNAuthorizationOptionSound | UNAuthorizationOptionAlert | UNAuthorizationOptionBadge);
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)())completionHandler {
    NSDictionary *userInfo  = response.notification.request.content.userInfo;
    if (userInfo && [userInfo valueForKey:@"omisdkCallerNumber"]) {
      NSLog(@"User Info : %@",userInfo);
      [OmikitNotification didRecieve:userInfo];
    }
    completionHandler();
}
```

- Add these lines into `Info.plist`:

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
  
*** Important release note ***
```
We support 2 environments. So you need set correct key in Appdelegate.
- KEY_OMI_APP_ENVIROMENT_SANDBOX support on debug mode
- KEY_OMI_APP_ENVIROMENT_PRODUCTION support on release mode
- Visit on web admin to select correct enviroment.   
```
  
#### iOS(Swift):
- Assets: Add `call_image` into assets folder to update callkit image. We only support png style.

- Add variables in Appdelegate.swift:

```
import OmiKit
import PushKit
import NotificationCenter

var pushkitManager: PushKitManager?
var provider: CallKitProviderDelegate?
var voipRegistry: PKPushRegistry?
```

- Add these lines into `didFinishLaunchingWithOptions`:

```
OmiClient.setEnviroment(KEY_OMI_APP_ENVIROMENT_SANDBOX, userNameKey: "extension", maxCall: 1, callKitImage: "call_image")
provider = CallKitProviderDelegate.init(callManager: OMISIPLib.sharedInstance().callManager)
voipRegistry = PKPushRegistry.init(queue: .main)
pushkitManager = PushKitManager.init(voipRegistry: voipRegistry)
```

-  Add these lines into `Info.plist`:

```
<key>NSCameraUsageDescription</key>
<string>Need camera access for video call functions</string>
<key>NSMicrophoneUsageDescription</key>
<string>Need microphone access for make Call</string>
```

- Save token for `OmiClient`: if you added `firebase_messaging` in your project so you don't need add these lines.

```
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

*** Only use under lines when added `Cloud Messaging` plugin in your project ***

- Setup push notification: We only support Firebase for push notification.

  - Add `google-service.json` in `android/app` (For more information, you can refer <a href="https://rnfirebase.io/app/usage">Core/App</a>)
  - Add Firebase Messaging to receive `fcm_token` (You can refer <a href="https://pub.dev/packages/firebase_messaging">Cloud Messaging</a> to setup notification for React Native)

  - For more setting information, please refer <a href="https://api.omicall.com/web-sdk/mobile-sdk/ios-sdk/cau-hinh-push-notification">Config Push for iOS</a>
*** Important release note ***
```
We support 2 environments. So you need set correct key in Appdelegate.
- KEY_OMI_APP_ENVIROMENT_SANDBOX support on debug mode
- KEY_OMI_APP_ENVIROMENT_PRODUCTION support on release mode
- Visit on web admin to select correct enviroment.   
```


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
      phone: phone,
      isVideo: isVideo,
    };
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

- Config push notification:

  ```
  import { configPushNotification } from 'omikit-plugin';

  configPushNotification({
    notificationIcon : "calling_face", //notification icon on Android
    prefix : "Cuộc gọi tới từ: ",
    incomingBackgroundColor : "#FFFFFFFF",
    incomingAcceptButtonImage : "join_call", //image name
    incomingDeclineButtonImage : "hangup", //image name
    backImage : "ic_back", //image name: icon of back button
    userImage : "calling_face", //image name: icon of user default
    prefixMissedCallMessage: 'Cuộc gọi nhỡ từ', //config prefix message for the missed call
    missedCallTitle: 'Cuộc gọi nhỡ', //config title for the missed call
    userNameKey: 'uuid', //we have 3 values: uuid, full_name, extension.
    channelId: 'com.channel.sample', //your notification channel id
    audioNotificationDescription: '' //audio description
    videoNotificationDescription: '' //video descriptipn
  });
  //incomingAcceptButtonImage, incomingDeclineButtonImage, backImage, userImage: Add these into `android/app/src/main/res/drawble`
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

- Get call when user open application at first time:

  ```
  import { getInitialCall } from 'omikit-plugin';

  const callingInfo = await getInitialCall();
  if (callingInfo !== false) {
    navigation.navigate('DialCall' as never, callingInfo as never);
  }
  //callingInfo != false then user have a calling.
  ```

- Other functions:

  - Call with phone number (mobile phone or internal number):

  ```
  import {startCall} from 'omikit-plugin';
  const result = await startCall({
      phoneNumber: phone, //phone number
      isVideo: false //allow video call: true/false
  });
  //we will return OmiStartCallStatus with:
    - invalidUuid: uuid is invalid (we can not find on my page)
    - invalidPhoneNumber: sip user is invalid.
    - samePhoneNumber: Can not call same phone number.
    - maxRetry: We try to refresh call but we can not start your call.
    - permissionDenied: Check audio permission.
    - couldNotFindEndpoint: Please login before make your call.
    - accountRegisterFailed: We can not register your account.
    - startCallFailed: We can not start you call.
    - startCallSuccess: Start call successfully.
    - haveAnotherCall: We can not start you call because you are joining another call.
  ```

  - Call with UUID (only support with Api key):

  ```
  import {startCallWithUuid} from 'omikit-plugin';
  const result = await startCallWithUuid({
      usrUuid: uuid, //phone number
      isVideo: false //allow video call: true/false
  });
  // Result is the same with startCall
  ```

  - Accept a call:

    ```
    import {joinCall} from 'omikit-plugin';

    await joinCall();
    ```

  - End a call: We will push a event `endCall` for you.

    ```
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

  - Get current user information:
    ```
    final user = await getCurrentUser();
    Output Sample:
    {
        "extension": "111",
        "full_name": "chau1",
        "avatar_url": "",
        "uuid": "122aaa"
    }
    ```
  - Get guest user information:
    ```
    final user = await getGuestUser();
    Output Sample:
    {
        "extension": "111",
        "full_name": "chau1",
        "avatar_url": "",
        "uuid": "122aaa"
    }
    ```
  - Get user information from sip:

    ```
    final user = await getUserInfo("111");
    Output Sample:
    {
        "extension": "111",
        "full_name": "chau1",
        "avatar_url": "",
        "uuid": "122aaa"
    }
    ```

  - Logout: logout and remove all information.

    ```
    import {logout} from 'omikit-plugin';

    logout();
    ```
  - Permission: Check system alert window permission (only Android).

    ```
    import {systemAlertWindow} from 'omikit-plugin';

    if (Platform.OS === 'android') {
      const isAllow = await systemAlertWindow();
      //true => allow
      //false => denied
    }
    ```
  - Setting: Open to enable system alert window (only Android).

    ```
    import {openSystemAlertSetting} from 'omikit-plugin';

    if (Platform.OS === 'android') {
      openSystemAlertSetting();
    }
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
    omiEmitter.addListener(OmiCallEvent.onCallStateChanged, onCallStateChanged);
    omiEmitter.addListener(OmiCallEvent.onMuted, onMuted);
    omiEmitter.addListener(OmiCallEvent.onSpeaker, onSpeaker);
    omiEmitter.addListener(OmiCallEvent.onClickMissedCall, clickMissedCall);
    omiEmitter.addListener(OmiCallEvent.onSwitchboardAnswer, onSwitchboardAnswer);
    omiEmitter.addListener(OmiCallEvent.onCallQuality, onCallQuality);
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
        omiEmitter.removeAllListeners(OmiCallEvent.onSpeaker);
        omiEmitter.removeAllListeners(OmiCallEvent.onSwitchboardAnswer);
        if (Platform.OS === 'ios') {
           removeVideoEvent();
           omiEmitter.removeAllListeners(OmiCallEvent.onRemoteVideoReady);
        }
    };
}, []);
```

  - Important event `onCallStateChanged`: We provide it to listen call state change.
 //OmiAction have 2 variables: actionName and data
 ```
    - Action Name value: 
        - `onCallStateChanged`: Call state changed.
        - `onSwitchboardAnswer`: Switchboard sip is listening. 
        - List status call: 
          + unknown(0),
          + calling(1),
          + incoming(2),
          + early(3),
          + connecting(4),
          + confirmed(5),
          + disconnected(6);
    + onCallStateChanged is call state tracking event. We will return status of state. Please refer `OmiCallState`.
          `onCallStateChanged value:`
              + isVideo: value boolean (true is call Video)
              + status: number (value matching with List status call )
              + callerNumber: phone number 
              + incoming: boolean - status call incoming or outgoing
              + _id: option (id of every call)

    + `Incoming call` state lifecycle: incoming -> connecting -> confirmed -> disconnected
    + `Outgoing call` state lifecycle: calling -> early -> connecting -> confirmed -> disconnected 

    + onSwitchboardAnswer have callback when employee answered script call.


- Action Name value:
  - `OmiCallEvent.onMuted`: Audio changed.
  - `OmiCallEvent.onSpeaker`: Audio changed.
  - `OmiCallEvent.onClickMissedCall`: Click missed call notification.
  - `OmiCallEvent.onSwitchboardAnswer`: Switchboard sip is listening.
  - `OmiCallEvent.onCallQuality`: The calling quality.
- Data value: We return `callerNumber`, `sip`, `isVideo: true/false` information