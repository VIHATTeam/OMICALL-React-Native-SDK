#import "AppDelegate.h"
#import <Firebase.h>
#import <React/RCTBundleURLProvider.h>
#import <OmiKit/OmiKit.h>
#import <React/RCTDevMenu.h>
// Import OmikitNotification
#if __has_include("OmikitNotification.h")
#import "OmikitNotification.h"
#else
#import <omikit_plugin/OmikitNotification.h>
#endif

#import <React/RCTBundleURLProvider.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"OmikitPluginExample";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  // ----- Start OmiKit Config ------
  [OmiClient setEnviroment:KEY_OMI_APP_ENVIROMENT_SANDBOX userNameKey:@"full_name" maxCall:2 callKitImage:@"call_image" typePushVoip:TYPE_PUSH_CALLKIT_DEFAULT];
  
  self.provider = [[CallKitProviderDelegate alloc] initWithCallManager:[OMISIPLib sharedInstance].callManager];
  self.voipRegistry = [[PKPushRegistry alloc] initWithQueue:dispatch_get_main_queue()];
  self.pushkitManager = [[PushKitManager alloc] initWithVoipRegistry:self.voipRegistry];

  if (@available(iOS 10.0, *)) {
    [UNUserNotificationCenter currentNotificationCenter].delegate = (id<UNUserNotificationCenterDelegate>) self;
  }
  if ([FIRApp defaultApp] == nil) {
      [FIRApp configure];
    }
  // ----- End OmiKit Config ------
  
  
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
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

- (void)application:(UIApplication*)app didRegisterForRemoteNotificationsWithDeviceToken:(NSData*)devToken
{
    // parse token bytes to string
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


// This function will terminate all ongoing calls when the user kills the app
- (void)applicationWillTerminate:(UIApplication *)application {
    @try {
        [OmiClient OMICloseCall];
    }
    @catch (NSException *exception) {

    }
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

// Disable Bridgeless mode - OmiKit SDK is not compatible with it yet
// This keeps Fabric + TurboModules enabled but uses the legacy bridge
- (BOOL)bridgelessEnabled
{
  return NO;
}

@end
