# OMICALL SDK FOR React-Native

The OmiKit exposes the <a href="https://www.npmjs.com/package/omikit-plugin">omikit-plugin</a>.

The most important part of the framework is :

- Help to easy integrate with Omicall.
- Easy custom Call UI/UX.
- Optimize codec voip for you.
- Full inteface to interactive with core function like sound/ringtone/codec.

## Status

Currently active maintained

## Running

Install via npm:

```sh
npm install omikit-plugin
```

Install via yarn:

```sh
yarn add omikit-plugin
```

### Configuration

#### Android:

- Add this setting in `build.gradle`:

```
jcenter() // Warning: this repository is going to shut down soon
maven {
    url("https://vihat.jfrog.io/artifactory/vihat-local-repo")
    credentials {
        username = "anonymous"
    }
}
```

```
classpath 'com.google.gms:google-services:4.3.13' //in dependencies
```

- Add this setting In `app/build.gradle`:

```
apply plugin: 'com.android.application'
apply plugin: 'kotlin-android'
apply plugin: 'com.google.gms.google-services'
```

Push Notification:

- Add `google-service.json` in `android/app` (For more information, you can refer <a href="https://rnfirebase.io/">Firebase core</a>)

- For more setting information, please refer <a href="https://api.omicall.com/web-sdk/mobile-sdk/android-sdk/cau-hinh-push-notification">Omicall Config Push for Android</a>

#### iOS: Set up environment and library:

- AppDelete.h

```
#import <OmiKit/OmiKit-umbrella.h>
#import <UserNotifications/UserNotifications.h>

@interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate>

@property (nonatomic, strong) UIWindow *window;
@property (nonatomic, strong) PushKitManager *pushkitManager;
@property (nonatomic, strong) CallKitProviderDelegate * provider;
@property (nonatomic, strong) PKPushRegistry * voipRegistry;

@end

```

- AppDelete.m

```
#import <OmiKit/OmiKit.h>

[OmiClient setEnviroment:KEY_OMI_APP_ENVIROMENT_SANDBOX];
self.provider = [[CallKitProviderDelegate alloc] initWithCallManager: [OMISIPLib sharedInstance].callManager];
self.voipRegistry = [[PKPushRegistry alloc] initWithQueue:dispatch_get_main_queue()];
self.pushkitManager = [[PushKitManager alloc] initWithVoipRegistry: self.voipRegistry];
//Add into `didFinishLaunchingWithOptions` function
```

- Save token for `OmiClient`, if you don't use `Messaging` for iOS:

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

Push Notification:
Omicall need two certificates: VOIP Push Certificate & User Push Notification Certificate

- For more information, please refer <a href="https://api.omicall.com/web-sdk/mobile-sdk/ios-sdk/cau-hinh-push-notification">Omicall Push Notification for iOS</a>

## Implement

- Set up Firebase Messaging: <a href="https://rnfirebase.io/messaging/usage">messaging</a> plugin.

```
//if you use only on Android. you only implement for Android.
//because we use APNS to push notification on iOS so you don't need add Firebase for iOS.
//But you can use firebase-messaging to get APNS token for iOS.
```

- Call actions:

  * `initCall` : register and init OmiCall. You need send Object value with `userName`, `password` and `realm`.
  * `updateToken` : update token for sdk. You need send `fcmToken` for Android and send `apnsToken` for iOS.
  * `startCall` : start Call.
  * `endCall` : end Call.
  * `toggleMute` : toggle the microphone status.
  * `toggleSpeaker` : toggle the voice status. You need send Object value with `useSpeaker`.
  * `sendDTMF` : send DTMF for call server. You need send Object value with `character` value.
```

* Event listener:

```
useEffect(() => {
    omiEmitter.addListener('incomingReceived', incomingReceived);
    omiEmitter.addListener('onCallEstablished', onCallEstablished);
    omiEmitter.addListener('onCallEnd', onCallEnd);
    omiEmitter.addListener('onMuted', onMuted);
    omiEmitter.addListener('onRinging', onRinging);
    return () => {
        omiEmitter.removeAllListeners('incomingReceived');
        omiEmitter.removeAllListeners('onCallEstablished');
        omiEmitter.removeAllListeners('onCallEnd');
        omiEmitter.removeAllListeners('onMuted');
        omiEmitter.removeAllListeners('onRinging');
    };
}, []);

```

* Event List: `We support 5 events`
  * `onCallEnd`: Trigger when end the call.
  * `onCallEstablished`: Trigger when we created the call.
  * `onRinging`: Trigger when the phone is ringing.
  * `onHold`: Trigger when user hold the call. From parameters, you can reviceved correct status from server through `isHold`
  * `onMuted`: Trigger when user muted the call. From parameters, you can reviceved correct status from server through `isMuted`
