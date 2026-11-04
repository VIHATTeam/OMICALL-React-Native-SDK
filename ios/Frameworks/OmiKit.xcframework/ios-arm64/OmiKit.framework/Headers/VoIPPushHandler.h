//
//  VoIPPushHandler.h
//  Pods
//
//  Created by QUOC VIET  on 03/11/2022.
//

#ifndef VoIPPushHandler_h
#define VoIPPushHandler_h
#import <PushKit/PushKit.h>

#import "OMICall.h"



@interface VoIPPushHandler : NSObject
+ (void)handle:(PKPushPayload * _Nonnull)payload completion: (void (^)(void))completion;
@property (nonatomic) NSMutableDictionary * _Nonnull incomingCallConfirmed;
+ (instancetype)sharedInstance;
+ (void)establishConnection:(PKPushPayload * _Nonnull)payload completion: (void (^)(BOOL))completion;
+ (void) removeCallFromIncomming:(OMICall * _Nonnull) call;
+ (void)reportAndEndDummyCallWithCompletion:(void (^ _Nullable)(void))completion;
- (BOOL)enableShowCallKit;
@end

#endif /* VoIPPushHandler_h */
