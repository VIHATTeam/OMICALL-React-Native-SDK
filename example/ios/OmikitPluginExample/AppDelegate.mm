#import "AppDelegate.h"
#import <OmiKit/OmiKit.h>
#import <React/RCTBundleURLProvider.h>
#import <Firebase/Firebase.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [FIRApp configure];
  self.moduleName = @"OmikitPluginExample";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};
  [OmiClient setEnviroment:KEY_OMI_APP_ENVIROMENT_SANDBOX];
  provider = [[CallKitProviderDelegate alloc] initWithCallManager: [OMISIPLib sharedInstance].callManager];
  voipRegistry = [[PKPushRegistry alloc] initWithQueue:dispatch_get_main_queue()];
  pushkitManager = [[PushKitManager alloc] initWithVoipRegistry:voipRegistry];

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

/// This method controls whether the `concurrentRoot`feature of React18 is turned on or off.
///
/// @see: https://reactjs.org/blog/2022/03/29/react-v18.html
/// @note: This requires to be rendering on Fabric (i.e. on the New Architecture).
/// @return: `true` if the `concurrentRoot` feature is enabled. Otherwise, it returns `false`.
- (BOOL)concurrentRootEnabled
{
  return true;
}

@end
