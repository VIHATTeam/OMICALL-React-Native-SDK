#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(OmikitPlugin, NSObject)

RCT_EXTERN_METHOD(updateToken:(id)data
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(initCall:(id)data
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
