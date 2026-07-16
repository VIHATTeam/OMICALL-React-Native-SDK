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
  // Keep a strong reference so the subscriber (and the notification-center
  // delegate it becomes) stays alive regardless of whether Expo retains it.
  static OmikitExpoAppDelegateBridge *sharedSubscriber = nil;
  sharedSubscriber = [[OmikitExpoAppDelegateBridge alloc] init];

  // Own the missed-call-tap delegate here, deterministically — it does NOT
  // depend on didFinishLaunching being forwarded to us.
  [UNUserNotificationCenter currentNotificationCenter].delegate = sharedSubscriber;

  SEL registerSel = NSSelectorFromString(@"registerSubscriber:");
  if ([expoAppDelegate respondsToSelector:registerSel]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
    [expoAppDelegate performSelector:registerSel withObject:sharedSubscriber];
#pragma clang diagnostic pop
  }
}

// NOTE: OmiKit init (setEnviroment / on-premise / CallKit / PushKit) was moved
// to OmikitPlugin.init() (Swift). Registering this subscriber via +load races
// with Expo's didFinishLaunching dispatch — on apps with many pods the subscriber
// can be registered too late, so this callback never fires and OmiKit falls back
// to its default (staging) environment. OmikitPlugin.init() runs deterministically
// when the RN bridge sets up (after launch), so init lives there now.
//
// This subscriber is kept only to forward the remote-notification / missed-call
// callbacks below, which need the UIApplicationDelegate. When didFinishLaunching
// DOES reach us (the lucky ordering), we still trigger the idempotent bootstrap
// so nothing is missed; OmikitPlugin's own guard prevents a double init.
- (BOOL)application:(UIApplication *)application
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  NSLog(@"[OMI NATIVE] didFinishLaunching — ensuring OmiKit bootstrap");
  Class plugin = NSClassFromString(@"OmikitPlugin");
  SEL bootstrapSel = NSSelectorFromString(@"bootstrapOmiKitFromBridge");
  if ([plugin respondsToSelector:bootstrapSel]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
    [plugin performSelector:bootstrapSel];
#pragma clang diagnostic pop
  }
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
