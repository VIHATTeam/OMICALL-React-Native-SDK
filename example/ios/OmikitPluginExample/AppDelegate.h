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
