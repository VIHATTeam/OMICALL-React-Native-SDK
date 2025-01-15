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

```ruby
npm install omikit-plugin@latest
```

Install via yarn:

```ruby
yarn add omikit-plugin --latest
```

### Configuration

#### Android:

- Add these settings in `build.gradle`:

```kotlin
jcenter()
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

```
```kotlin
// gradle.properties
OMI_USER=omicall
OMI_TOKEN=${OMI_TOKEN} // connect with dev off OMI for get token 
```

```kotlin
// in dependencies
classpath 'com.google.gms:google-services:4.3.13'
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

- Update AndroidManifest.xml:

```kotlin
<manifest
      ......
      xmlns:tools="http://schemas.android.com/tools">
      ..... // your config
      <uses-feature android:name="android.hardware.telephony" android:required="false" />
      <uses-permission android:name="android.permission.INTERNET" />
      <uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />
      <uses-permission android:name="android.permission.WAKE_LOCK" />
      <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
      ..... // your config

         <application
                android:name=".MainApplication"
                ...... // your config
                android:alwaysRetainTaskState="true"
                android:largeHeap="true"
                android:exported="true"
                android:supportsRtl="true"
                android:allowBackup="false"
                android:enableOnBackInvokedCallback="true"
                .....  // your config
        >
                <activity
                            android:name=".MainActivity"
                        .....  // your config
                            android:windowSoftInputMode="adjustResize"
                            android:showOnLockScreen="true"
                            android:launchMode="singleTask"
                            android:largeHeap="true"
                            android:alwaysRetainTaskState="true"
                            android:supportsPictureInPicture="false"
                            android:showWhenLocked="true"
                            android:turnScreenOn="true"
                            android:exported="true"
                        .....  // your config
                            >
                        .....  // your config
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
                        .....  // your config
                     </activity>
                 .....  // your config
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
                 .....  // your config
           </application>
</manifest>
```

##### In file MainActivity:
# For React Native < 0.74

```java
public class MainActivity extends ReactActivity {
   .....  // your config


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
     .....  // your config
  }
}
```

# For React Native > 0.74

```kotlin
class MainActivity : ReactActivity() {
     .....  // your config
    private var reactApplicationContext: ReactApplicationContext? = null
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

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
        if (intent != null) {
            reactApplicationContext?.let {
                OmikitPluginModule.Companion.onGetIntentFromNotification(it, intent, this)
            } ?: Log.e("MainActivity", "ReactApplicationContext has not been initialized in onNewIntent.")
        } else {
            Log.e("MainActivity", "Intent in onNewIntent is null.")
        }
    }
    override fun onResume() {
        super.onResume()
        reactApplicationContext?.let {
            OmikitPluginModule.Companion.onResume(this)
            intent?.let { intent ->
                OmikitPluginModule.Companion.onGetIntentFromNotification(it, intent, this)
            }
        } ?: Log.e("MainActivity", "ReactApplicationContext has not been initialized in onResume.")
    }

      .....  // your config
}
```


- Setup remote push notification: Only support Firebase for remote push notification.

  - Add `google-service.json` in `android/app` (For more information, you can refer <a href="https://rnfirebase.io/app/usage">Core/App</a>)
  - Add Firebase Messaging to receive `fcm_token` (You can refer <a href="https://rnfirebase.io/messaging/usage">Cloud Messaging</a> to setup notification for React native)

  - For more setting information, please refer <a href="https://api.omicall.com/web-sdk/mobile-sdk/android-sdk/cau-hinh-push-notification">Config Push for Android</a>

## Config for IOS

#### iOS(Object-C):

- Assets: Add `call_image` into assets folder to update callkit image. We only support png style.

- Add variables in **Appdelegate.h** for **Old Architecture**:

```objective-c
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

- Add variables in **Appdelegate.h** for **New Architecture**:

```objective-c
#import <UIKit/UIKit.h>
#import <UserNotifications/UserNotifications.h>
#import <OmiKit/OmiKit-umbrella.h>
#import <OmiKit/Constants.h>

@interface AppDelegate :  NSObject <UIApplicationDelegate, UNUserNotificationCenterDelegate, RCTBridgeDelegate>

@property (nonatomic, strong) UIWindow *window;
@property (nonatomic, strong) PushKitManager *pushkitManager;
@property (nonatomic, strong) CallKitProviderDelegate * provider;
@property (nonatomic, strong) PKPushRegistry * voipRegistry;

@end

```

- Edit AppDelegate.m:

```objective-c
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
- Tips: Error Use of undeclared identifier 'OmikitNotification' at file `AppDelegate.m`, please import this line below

```swift
#if __has_include("OmikitNotification.h")
#import "OmikitNotification.h"
#elif __has_include(<OmikitPlugin/OmikitPlugin-Swift.h>)
#import <OmikitPlugin/OmikitPlugin-Swift.h>
#else
#import <omikit_plugin/OmikitNotification.h>
#endif

```
- Add these lines into `Info.plist`:

```swift
<key>NSMicrophoneUsageDescription</key>
<string>Need microphone access for make Call</string>
//If you implement video call
<key>NSCameraUsageDescription</key>
<string>Need camera access for video call functions</string>
```

- Save token for `OmiClient`: if You added `Cloud Messaging` in your project so you don't need add these lines.

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

**_ Only use under lines when added `Cloud Messaging` plugin in your project _**

- Setup push notification: We only support Firebase for push notification.

  - Add `google-service.json` in `android/app` (For more information, you can refer <a href="https://rnfirebase.io/app/usage">Core/App</a>)
  - Add Firebase Messaging to receive `fcm_token` (You can refer <a href="https://pub.dev/packages/firebase_messaging">Cloud Messaging</a> to setup notification for React Native)

  - For more setting information, please refer <a href="https://api.omicall.com/web-sdk/mobile-sdk/ios-sdk/cau-hinh-push-notification">Config Push for iOS</a>

**_ Important release note _**

```
We support 2 environments. So you need set correct key in Appdelegate.
- KEY_OMI_APP_ENVIROMENT_SANDBOX support on debug mode
- KEY_OMI_APP_ENVIROMENT_PRODUCTION support on release mode
- Visit on web admin to select correct enviroment.
```

\*Note: At Tab Build Setting off Target Project, you need set: **_Enable Modules (C and Objective C)_** : YES\*

#### Currently, OMICALL does not support React Native new architect.
Config turn Off for new architect
For iOS
```Ruby
use_react_native!(
    :path => config[:reactNativePath],
    :new_arch_enabled => false,  // <=== add this line 
   ... your config
  )
```

For Android
Open file android/gradle.properties and add line below:
```kotlin
# Tắt New Architecture
newArchEnabled=false
```
#### iOS(Swift):

- Assets: Add `call_image` into assets folder to update callkit image. We only support png style.

- Add variables in Appdelegate.swift:

```swift
import OmiKit
import PushKit
import NotificationCenter

var pushkitManager: PushKitManager?
var provider: CallKitProviderDelegate?
var voipRegistry: PKPushRegistry?
```

- Add these lines into `didFinishLaunchingWithOptions`:

```swift
OmiClient.setEnviroment(KEY_OMI_APP_ENVIROMENT_SANDBOX, userNameKey: "extension", maxCall: 1, callKitImage: "call_image")
provider = CallKitProviderDelegate.init(callManager: OMISIPLib.sharedInstance().callManager)
voipRegistry = PKPushRegistry.init(queue: .main)
pushkitManager = PushKitManager.init(voipRegistry: voipRegistry)
```

- Add these lines into `Info.plist`:

```swift
<key>NSCameraUsageDescription</key>
<string>Need camera access for video call functions</string>
<key>NSMicrophoneUsageDescription</key>
<string>Need microphone access for make Call</string>
```

- Save token for `OmiClient`: if you added `firebase_messaging` in your project so you don't need add these lines.

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

**_ Only use under lines when added `Cloud Messaging` plugin in your project _**

- Setup push notification: We only support Firebase for push notification.

  - Add `google-service.json` in `android/app` (For more information, you can refer <a href="https://rnfirebase.io/app/usage">Core/App</a>)
  - Add Firebase Messaging to receive `fcm_token` (You can refer <a href="https://pub.dev/packages/firebase_messaging">Cloud Messaging</a> to setup notification for React Native)

  - For more setting information, please refer <a href="https://api.omicall.com/web-sdk/mobile-sdk/ios-sdk/cau-hinh-push-notification">Config Push for iOS</a>
    **_ Important release note _**

```
We support 2 environments. So you need set correct key in Appdelegate.
- KEY_OMI_APP_ENVIROMENT_SANDBOX support on debug mode
- KEY_OMI_APP_ENVIROMENT_PRODUCTION support on release mode
- Visit on web admin to select correct enviroment.
```

## Implement

### Request permission

We need you request permission about call before make call:

- You can use <a href="https://github.com/zoontek/react-native-permissions">react-native-permissions</a> to do this

```
-Android:
+ PERMISSIONS.ANDROID.RECORD_AUDIO
+ PERMISSIONS.ANDROID.CALL_PHONE
+ PERMISSIONS.ANDROID.CAMERA; (if you want to make Video calls)

-IOS:
+ PERMISSIONS.IOS.MICROPHONE;
+ PERMISSIONS.IOS.CAMERA; (if you want to make Video calls)

```

- Set up <a href="https://rnfirebase.io/messaging/usage">Cloud Messaging</a> plugin:

```
//if you use only on Android. you only implement for Android.
//because we use APNS to push notification on iOS so you don't need add Firebase for iOS.
//But you can use firebase-messaging to get APNS token for iOS.
```

- Important function.

  - Start Serivce: OmiKit need start services and register some events.

    ```javascript
    //Call in the root widget
    import { startServices } from 'omikit-plugin';

    startServices();
    ```

  - OmiKit need FCM for Android and APNS to push notification on user devices. We use more packages: <a href="https://rnfirebase.io/messaging/usage">Cloud Messaging</a>

  - Create OmiKit With ApiKey: OmiKit need apikey, username, user id to init environment(All information in innit is required). ViHAT Group will provide api key for you. This function is used when making calls from customers to switchboard numbers (not making internal calls).
    Please contact for my sale:
    In This step, we need partner provide me fcmToken of firebase Message.

    ```javascript
    import { initCallWithApiKey } from 'omikit-plugin';
    import messaging from '@react-native-firebase/messaging';

    let token: String
    if(Platform.OS == "ios"){
      token = await messaging.getAPNSToken()
    } else {
      token = await messaging.getToken()
    }

    const loginInfo = {
      usrUuid: usrUuid,
      fullName: fullName,
      apiKey: apiKey,
      phone: phone,
      fcmToken: token,  //with android is fcm_token and ios is APNS token
      isVideo: isVideo,
      projectId: projectId //  firebase project id off your
    };
    const result = await initCallWithApiKey(loginInfo);
    //result is true then user login successfully.
    ```

  - Create OmiKit: OmiKit need userName, password, realm, fcmToken to init environment(All information in innit is required). ViHAT Group will provide information for you.
    This function is used when you want to call any telecommunication number, calling back and forth between internal groups.
    Please contact for my sale:

```javascript
    import { initCallWithUserPassword } from 'omikit-plugin';
    import messaging from '@react-native-firebase/messaging';

    let token: String
    if(Platform.OS == "ios"){
      token = await messaging.getAPNSToken()
    } else {
      token = await messaging.getToken()
    }

    const loginInfo = {
      userName: userName, //string
      password: password, //string
      realm: realm, //string
      isVideo: isVideo, //boolean: true/false
      fcmToken: token, //with android is fcm_token and ios is APNS token,
      projectId: projectId //  firebase project id off your
    };
    const result = await initCallWithUserPassword(loginInfo);
    //result is true then user login successfully.
```

- Config push notification:

  ```javascript
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
    videoNotificationDescription: '' //video descriptipn,
    representName: '' // Pass down the representative name if you want all incoming calls on the customer app to display only 1 unique name of your business
  });
  //incomingAcceptButtonImage, incomingDeclineButtonImage, backImage, userImage: Add these into `android/app/src/main/res/drawble`
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

  ```javascript
  import {startCall} from 'omikit-plugin';
  const result = await startCall({
      phoneNumber: phone, //phone number
      isVideo: false //allow video call: true/false
  });
  ```

  - The result will be in the form of object:

  ```javascript
  result = {
      "_id": String // This is call_id. it just have id for iOS,
      "status": Number // This is result code when make,
      "message": String // This is a string key, describing the status of the call
    }
  ```

  - Describe in detail the results when startCall returns:

  ```javascript
    + message="INVALID_UUID" (status = 0) : uid is invalid (we can not find on my page).
    + message="INVALID_PHONE_NUMBER" (status = 1) : sip user is invalid.
    + message="SAME_PHONE_NUMBER_WITH_PHONE_REGISTER" (status = 2) :  Can not call same phone number.
    + message="MAX_RETRY" (status = 3) : call timeout exceeded, please try again later.
    + message="PERMISSION_DENIED" (status = 4) : The user has not granted MIC or audio permissions.
    + message="COULD_NOT_FIND_END_POINT" (status = 5) : Please login before make your call.
    + message="REGISTER_ACCOUNT_FAIL" (status = 6) : Can't log in to OMI( maybe wrong login information).
    + message="START_CALL_FAIL" (status = 7) : Call failed, please try again
    + message="HAVE_ANOTHER_CALL" (status = 9) : There is another call in progress, please wait for that call to end
    + message="START_CALL_SUCCESS" (status = 8) : START CALL SUCCESSFULLY.

  ```

  - Call with UUID (only support with Api key):

  ```javascript
  import {startCallWithUuid} from 'omikit-plugin';
  const result = await startCallWithUuid({
      usrUuid: uuid, //phone number
      isVideo: false //allow video call: true/false
  });
  // Result is the same with startCall
  ```

  - Accept a call:

    ```javascript
    import {joinCall} from 'omikit-plugin';

    await joinCall();
    ```

    Note: When calling `joinCall`, sdk will check permission of microphone and camera. If have any permission denied, sdk will send a event `onRequestPermissionAndroid` with list permission you need to request. You need to request permission before calling `joinCall` again.

  - End a call: We will push a event `endCall` for you.

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

  - Toggle the audio: On/off audio a call

    ```javascript
    import {toggleMute} from 'omikit-plugin';

    toggleMute();
    ```

  - Toggle the speaker: On/off the phone speaker

    ```javascript
    import {toggleSpeaker} from 'omikit-plugin';

    toggleSpeaker();
    ```
  - Toggle the hold: hold current call 

    ```javascript
    import {toggleHold} from 'omikit-plugin';

    toggleHold();
    ```

  - Send character: We only support `1 to 9` and `* #`.

    ```javascript
    import {sendDTMF} from 'omikit-plugin';

    sendDTMF({
        character: text,
    });
    ```

  - Get current user information:
    ```javascript
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
    ```javascript
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

    ```javascript
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

    ```javascript
    import {logout} from 'omikit-plugin';

    logout();
    ```

  - Permission: Check system alert window permission (only Android).

    ```javascript
    import {systemAlertWindow} from 'omikit-plugin';

    if (Platform.OS === 'android') {
      const isAllow = await systemAlertWindow();
      //true => allow
      //false => denied
    }
    ```

  - Setting: Open to enable system alert window (only Android).

    ```javascript
    import {openSystemAlertSetting} from 'omikit-plugin';

    if (Platform.OS === 'android') {
      openSystemAlertSetting();
    }
    ```

- Video Call functions: Support only video call, You need enable video in `init functions` and `start call` to implements under functions.

  - Switch front/back camera: We use the front camera for first time.

  ```javascript
  import {switchOmiCamera} from 'omikit-plugin';
  switchOmiCamera();
  ```

  - Toggle a video in video call: On/off video in video call

  ```javascript
  import {toggleOmiVideo} from 'omikit-plugin';
  toggleOmiVideo();
  ```

  - Local Camera Widget: Your camera view in a call

  ```javascript
  import { OmiLocalCameraView } from 'omikit-plugin';
  <OmiLocalCameraView style={styles.localCamera} />
  ```

  - Remote Camera Widget: Remote camera view in a call

  ```javascript
  import { OmiRemoteCameraView } from 'omikit-plugin';
  <OmiRemoteCameraView style={styles.remoteCamera} />
  ```

  - More function: Refresh local camera

  ```javascript
  import {refreshLocalCamera} from 'omikit-plugin';
  refreshLocalCamera();
  ```

  - More function: Refresh remote camera

  ```javascript
  import {refreshRemoteCamera} from 'omikit-plugin';
  refreshRemoteCamera();
  ```

  - Register event: Register remote video ready: only visible on iOS

  ```javascript
  import {registerVideoEvent} from 'omikit-plugin';
  registerVideoEvent();
  ```

- Event listener:

```javascript
useEffect(() => {
    omiEmitter.addListener(OmiCallEvent.onCallStateChanged, onCallStateChanged);
    omiEmitter.addListener(OmiCallEvent.onMuted, onMuted);
    omiEmitter.addListener(OmiCallEvent.onSpeaker, onSpeaker);
    omiEmitter.addListener(OmiCallEvent.onHold, onHold);
    omiEmitter.addListener(OmiCallEvent.onClickMissedCall, clickMissedCall);
    omiEmitter.addListener(OmiCallEvent.onSwitchboardAnswer, onSwitchboardAnswer);
    omiEmitter.addListener(OmiCallEvent.onCallQuality, onCallQuality);
    omiEmitter.addListener(OmiCallEvent.onRequestPermissionAndroid, onRequestPermission);
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
        omiEmitter.removeAllListeners(OmiCallEvent.onRequestPermissionAndroid);
        if (Platform.OS === 'ios') {
           removeVideoEvent();
           omiEmitter.removeAllListeners(OmiCallEvent.onRemoteVideoReady);
        }
    };
}, []);
```

- Important event `onCallStateChanged`: We provide it to listen call state change.
  // OmiAction have 2 variables: actionName and data

  - Action Name value:
    - `onCallStateChanged`: Call state changed.
    - `onSwitchboardAnswer`: Switchboard sip is listening.
    - List status call:
      - unknown(0),
      - calling(1),
      - incoming(2),
      - early(3),
      - connecting(4),
      - confirmed(5),
      - disconnected(6);
      - hold(7);

  * onCallStateChanged is call state tracking event. We will return status of state. Please refer `OmiCallState`.
    `onCallStateChanged value:` + isVideo: value boolean (true is call Video) + status: number (value matching with List status call ) + callerNumber: phone number + incoming: boolean - status call incoming or outgoing + \_id: option (id of every call) + code_end_call: This is code when end call.

  * `Incoming call` state lifecycle: incoming -> connecting -> confirmed -> disconnected
  * `Outgoing call` state lifecycle: calling -> early -> connecting -> confirmed -> disconnected

  * onSwitchboardAnswer have callback when employee answered script call.

- Table describing code_end_call status

| Code            | Description                                                                                                           |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `600, 503, 480`  | These are the codes of the network operator or the user who did not answer the call  |
| `408`   | Call request timeout (Each call usually has a waiting time of 30 seconds. If the 30 seconds expire, it will time out) |
| `403`           | Your service plan only allows calls to dialed numbers. Please upgrade your service pack|
| `404`           | The current number is not allowed to make calls to the carrier|
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

- Action Name value:
  - `OmiCallEvent.onMuted`: Audio changed.
  - `OmiCallEvent.onSpeaker`: Audio changed.
  - `OmiCallEvent.onClickMissedCall`: Click missed call notification.
  - `OmiCallEvent.onSwitchboardAnswer`: Switchboard sip is listening.
  - `OmiCallEvent.onCallQuality`: The calling quality.
  - `OmiCallEvent.onRequestPermission`: Show a list permission you need to request before calling `joinCall` again.
  - `OmiCallEvent.onHold`: hold current call 
- Data value: We return `callerNumber`, `sip`, `isVideo: true/false` information

- Forward calls to internal staff:
  - You can use function `transferCall` for transfer to staff you want.
    example:
    transferCall({
    phoneNumber: 102
    })

# Issues

## iOS

- Must use "Rosetta Destination" to run debug example app on macOS Apple chip
