//
//  OmikitExpoAppDelegateBridge.m
//  omikit-plugin
//
//  Runs the OmiKit VoIP/PushKit/CallKit init on Expo, equivalent to what a bare
//  React Native app does by hand in its AppDelegate. Needed because
//  expo-modules-autolinking does NOT pick up this package's
//  expo-module.config.json (omikit-plugin is a React Native module, not a pure
//  Expo module), so no lifecycle subscriber would otherwise run.
//
//  Why pure Objective-C + why NSClassFromString:
//   * A plain Objective-C class with +load is reliably force-loaded from the
//     static lib via the app's `-ObjC` linker flag (same trick Expo's own
//     EXAppDelegatesLoader uses). A Swift @objc class or an ObjC class that
//     merely *references* one gets dead-stripped here, so +load never runs.
//   * We reach Expo's ExpoAppDelegate + OmiKit purely through the ObjC runtime
//     (NSClassFromString / respondsToSelector), so this file needs NO import of
//     ExpoModulesCore — which the omikit-plugin pod cannot see at compile time —
//     and NO Swift bridging header. Everything is resolved at runtime.
//
//  Bare RN CLI builds have no ExpoModulesCore, so `ExpoAppDelegate` is absent
//  and registration simply no-ops (the bare app registers OmiKit in its own
//  AppDelegate as before).
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <PushKit/PushKit.h>
#import <UserNotifications/UserNotifications.h>

// OmiKit is a pure Objective-C xcframework — import its umbrella directly.
#if __has_include(<OmiKit/OmiKit.h>)
#import <OmiKit/OmiKit.h>
#define OMIKIT_AVAILABLE 1
#endif

// OmikitNotification is this pod's own ObjC helper (handles missed-call taps).
#if __has_include("OmikitNotification.h")
#import "OmikitNotification.h"
#elif __has_include(<OmikitPlugin/OmikitNotification.h>)
#import <OmikitPlugin/OmikitNotification.h>
#endif

#ifdef OMIKIT_AVAILABLE

// Expo forwards UIApplicationDelegate callbacks to registered subscribers. We
// conform to the ObjC subscriber protocol (UIApplicationDelegate) and register
// via the ObjC runtime so we don't need ExpoModulesCore headers at compile time.
@interface OmikitExpoAppDelegateBridge : NSObject <UIApplicationDelegate, UNUserNotificationCenterDelegate>
@property (nonatomic, strong) CallKitProviderDelegate *provider;
@property (nonatomic, strong) PushKitManager *pushkitManager;
@property (nonatomic, strong) PKPushRegistry *voipRegistry;
@end

@implementation OmikitExpoAppDelegateBridge

// +load runs at binary load, before application:didFinishLaunching:. Register
// ourselves as an Expo AppDelegate subscriber if Expo is present.
+ (void)load {
  // Swift's `ExpoAppDelegate` is exported to the ObjC runtime as
  // `EXExpoAppDelegate` (via @objc(EXExpoAppDelegate)). Look up that name.
  Class expoAppDelegate = NSClassFromString(@"EXExpoAppDelegate");
  if (expoAppDelegate == nil) {
    // Bare RN CLI (no ExpoModulesCore) — nothing to hook into. No-op.
    return;
  }
  NSLog(@"[OMI NATIVE] +load: registering OmiKit Expo subscriber");
  SEL registerSel = NSSelectorFromString(@"registerSubscriber:");
  if ([expoAppDelegate respondsToSelector:registerSel]) {
    id subscriber = [[OmikitExpoAppDelegateBridge alloc] init];
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
    [expoAppDelegate performSelector:registerSel withObject:subscriber];
#pragma clang diagnostic pop
  }
}

- (BOOL)application:(UIApplication *)application
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  NSDictionary *info = [[NSBundle mainBundle] infoDictionary];
  NSString *envKey = info[@"OMIKitEnvironment"];
  NSString *environment = [envKey isEqualToString:@"sandbox"]
      ? KEY_OMI_APP_ENVIROMENT_SANDBOX
      : KEY_OMI_APP_ENVIROMENT_PRODUCTION;
  NSString *userNameKey = info[@"OMIKitUserNameKey"] ?: @"full_name";
  int maxCall = info[@"OMIKitMaxCall"] ? [info[@"OMIKitMaxCall"] intValue] : 1;
  NSString *callKitImage = info[@"OMIKitCallKitImage"] ?: @"call_image";

  NSLog(@"[OMI NATIVE] didFinishLaunching — init OmiKit (env=%@)", envKey ?: @"production");

  // On-premise endpoints (if configured by the config plugin) — only rewrites
  // URLs, no network call. Applied before setEnviroment.
  [self applyOnPremiseFromInfo:info];

  [OmiClient setEnviroment:environment
              userNameKey:userNameKey
                  maxCall:maxCall
             callKitImage:callKitImage
             typePushVoip:TYPE_PUSH_CALLKIT_DEFAULT];

  // CallKit + PushKit. PushKitManager owns the registry delegate and reports
  // incoming VoIP push to CallKit (mandatory on iOS 13+).
  self.provider = [[CallKitProviderDelegate alloc]
      initWithCallManager:[OMISIPLib sharedInstance].callManager];
  self.voipRegistry = [[PKPushRegistry alloc] initWithQueue:dispatch_get_main_queue()];
  self.pushkitManager = [[PushKitManager alloc] initWithVoipRegistry:self.voipRegistry];

  [UNUserNotificationCenter currentNotificationCenter].delegate = self;
  return YES;
}

- (void)application:(UIApplication *)application
    didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  const unsigned char *bytes = (const unsigned char *)deviceToken.bytes;
  NSMutableString *token = [NSMutableString stringWithCapacity:deviceToken.length * 2];
  for (NSUInteger i = 0; i < deviceToken.length; i++) {
    [token appendFormat:@"%02x", bytes[i]];
  }
  [OmiClient setUserPushNotificationToken:token];
}

- (void)applicationWillTerminate:(UIApplication *)application {
  [OmiClient OMICloseCall];
}

// MARK: - On-premise

- (void)applyOnPremiseFromInfo:(NSDictionary *)info {
  NSDictionary *onPremise = info[@"OMIKitOnPremise"];
  if (![onPremise isKindOfClass:[NSDictionary class]] || onPremise.count == 0) {
    return;
  }
  NSString *mobileSdkHost = onPremise[@"mobileSdkHost"];
  if (mobileSdkHost.length == 0) {
    return;
  }
  // +setOnPremiseInfoWithMobileSdkHost:...: takes many named params, so it's
  // called directly (not via a single-arg performSelector). The remaining hosts
  // fall back to the mobile SDK host when omitted.
  [OmiClient setOnPremiseInfoWithMobileSdkHost:mobileSdkHost
                                  callEventHost:onPremise[@"callEventHost"]
                                  publicApiHost:onPremise[@"publicApiHost"]
                                   pushInfoHost:onPremise[@"pushInfoHost"]
                                    app2AppHost:onPremise[@"app2AppHost"]
                                  logUploadHost:onPremise[@"logUploadHost"]
                                       sipProxy:onPremise[@"sipProxy"]
                                     stunServer:onPremise[@"stunServer"]
                                     turnServer:onPremise[@"turnServer"]
                                   turnUsername:onPremise[@"turnUsername"]
                                   turnPassword:onPremise[@"turnPassword"]];
  NSLog(@"[OMI NATIVE] applied on-premise host: %@", mobileSdkHost);
}

// MARK: - UNUserNotificationCenterDelegate (missed-call tap + foreground)

- (void)userNotificationCenter:(UNUserNotificationCenter *)center
       willPresentNotification:(UNNotification *)notification
         withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler {
  completionHandler(UNNotificationPresentationOptionSound | UNNotificationPresentationOptionBadge |
                    UNNotificationPresentationOptionBanner);
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center
    didReceiveNotificationResponse:(UNNotificationResponse *)response
             withCompletionHandler:(void (^)(void))completionHandler {
  NSDictionary *userInfo = response.notification.request.content.userInfo;
  if (userInfo[@"omisdkCallerNumber"] != nil) {
    [OmikitNotification didRecieve:userInfo];
  }
  completionHandler();
}

@end

#endif  // OMIKIT_AVAILABLE
