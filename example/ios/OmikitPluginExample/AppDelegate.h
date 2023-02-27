#import <RCTAppDelegate.h>
#import <UIKit/UIKit.h>
#import <UIKit/UIKit.h>
#import <UserNotifications/UserNotifications.h>
#import <OmiKit/OmiKit-umbrella.h>
#import <UserNotifications/UserNotifications.h>

@interface AppDelegate : RCTAppDelegate<UIApplicationDelegate>{
  PushKitManager *pushkitManager;
  CallKitProviderDelegate * provider;
  PKPushRegistry * voipRegistry;
}
@end
