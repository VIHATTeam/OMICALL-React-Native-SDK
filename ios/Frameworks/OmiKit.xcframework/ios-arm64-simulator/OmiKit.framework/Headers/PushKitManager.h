//
//  PushKitManager.h
//  OmiKit
//
//  Created by QUOC VIET  on 03/11/2022.
//
//#import <PushKit/PKPushRegistryDelegate.h>
#import <PushKit/PushKit.h>
#import <CallKit/CXCallObserver.h>

#ifndef PushKitManager_h
#define PushKitManager_h
@interface PushKitManager : NSObject<PKPushRegistryDelegate>
- (instancetype)initWithVoipRegistry:(PKPushRegistry *)voIPRegistry;
+ (instancetype)sharedInstance;
/**
 * Func use for listen CXCallObserver change every call
 */
- (void)callObserver:(CXCallObserver *)callObserver callChanged:(CXCall *)call;

@end

#endif /* PushKitManager_h */
