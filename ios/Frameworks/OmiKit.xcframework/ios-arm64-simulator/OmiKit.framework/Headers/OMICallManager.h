//
//  OMICallManager.h
//  Copyright © 2016 OMICALL. All rights reserved.
//
//

#import <Foundation/Foundation.h>
#import "OMIAudioController.h"
#import "CallKitProviderDelegate.h"

@class OMICall;
@class OMIAccount;

/**
 Because the transaction id is retrieved in the SIP incoming call message. At this time, the call array has not been initialized yet, then it will not be possible to add omiID.
 Therefore, we need a temporary array containing intermediate information
 */
@interface OMITransactionIdInfoItem : NSObject
@property (nonatomic, strong) NSString *transactionID;
@property (nonatomic, assign) NSInteger callID; // Sử dụng assign cho kiểu dữ liệu nguyên thủy.
@end


/**
 *  The OMICallManager class is the single point of entry for everything you want to do with a call.
 *  - start an outbound call
 *  - end a call
 *  - mute or hold a call
 *  - sent DTMF signals
 *
 *  It takes care the CallKit (if available) and PJSIP interactions.
 */
@interface OMICallManager : NSObject


/** Save last info transfer call
 */
@property (nonatomic, strong) NSString *previousForwardedPhoneNumber;

- (BOOL)isPreviousForwardedPhoneNumberSet;

/**
 *  Controler responsible for managing the audio streams for the calls.
 */
@property (readonly) OMIAudioController * _Nonnull audioController;
@property (nonatomic) CallKitProviderDelegate * _Nonnull callKitProvider;

/**
 *  Start a call to the given number for the given account.
 *
 *  @param number The number to call.
 *  @param account The account to use for the call
 *  @param completion A completion block which is always invoked. Either the call is started successfully and you can obtain an
 *  OMICall instance throught the block or, when the call fails, you can query the blocks error parameter.
 */
- (void)startCallToNumber:(NSString * _Nonnull)number forAccount:(OMIAccount * _Nonnull)account isVideo:(BOOL) isVideo completion:(void (^_Nonnull )(__weak OMICall * _Nullable call, NSError * _Nullable error))completion;

- (void)startCallToNumberNoReg:(NSString * _Nonnull)number forAccount:(OMIAccount * _Nonnull)account isVideo:(BOOL) isVideo completion:(void (^_Nonnull )(__weak OMICall * _Nullable call, NSError * _Nullable error))completion;


/**
 *  Answers the given inbound call.
 *
 *  #param completion A completion block giving access to an NSError when unable to answer the given call.
 */
- (void)answerCall:(__weak OMICall * _Nonnull)call completion:(void (^ _Nonnull)(NSError * _Nullable error))completion;

/**
 *  End the given call.
 *
 *  @param call The OMICall instance to end.
 *  @param completion A completion block giving access to an NSError when the given call could not be ended.
 */
- (void)endCall:(__weak OMICall * _Nonnull)call completion:(void (^ _Nullable)(NSError * _Nullable error))completion;


/**
 *  End the given call.
 *
 *  @param uuid The UUID to end.
 *  @param completion A completion block giving access to an NSError when the given call could not be ended.
 */
- (void)endCallWithUuidIShowing:(NSUUID *)uuid completion:(void (^)(NSError *error))completion;

/**
 *  Toggle mute of the microphone for this call.
 *
 *  @param completion A completion block giving access to an NSError when mute cannot be toggle for the given call.
 */
- (void)toggleMuteForCall:(__weak OMICall * _Nonnull)call completion:(void (^ _Nonnull)(NSError * _Nullable error))completion;

/**
 *  Toggle hold of the call.
 *
 *  @param completion A completion block giving access to an NSError when the given call cannot be put on hold.
 */
- (void)toggleHoldForCall:(__weak OMICall * _Nonnull)call completion:(void (^ _Nonnull)(NSError * _Nullable error))completion;

/**
 *  Send DTMF tone for this call with a character.
 *
 *  @param character character NSString the character for the DTMF.
 *  @param completion A completion block giving access to an NSError when sending DTMF fails.
 */
- (void)sendDTMFForCall:(__weak OMICall * _Nonnull)call character:(NSString * _Nonnull)character completion:(void (^ _Nonnull)(NSError * _Nullable error))completion;

/**
 *  Find a call with the given UUID.
 *
 *  @param uuid The UUID of the call to find.
 *
 *  @return A OMICall instance if a call was found for the given UUID, otherwise nil.
 */
- (__weak OMICall * _Nullable)callWithUUID:(NSUUID * _Nonnull)uuid;

/**
 *  Find a call for the given call ID.
 *
 *  @param callId The PJSIP generated call ID given to an incoming call.
 *
 *  @return A OMICall instance if a call with the given call ID was found, otherwise nil.
 */
- (__weak OMICall * _Nullable)callWithCallId:(NSInteger)callId;


/**
 *  remove a call for the given call ID.
 *
 *  @param callId The PJSIP generated call ID given to an incoming call.
 *
 *  @return A OMICall instance if a call with the given call ID was found, otherwise nil.
 */
- (BOOL) removeCallByUUID:(NSString *)uuid;
- (BOOL) removeCallExcepCall:(NSString *)uuid;

/**
    This function use for remove Virtual Call in Call List
    @param uuid of infomation call
 */
- (void) removeVirtualCallByUUID:(NSString *)uuid;

/**
 *  Returns all the calls for a given account.
 *
 * @param account The OMIAccount for which to find it's calls.
 *
 * @return An NSArray containing all the accounts calls or nil.
 */
- (NSArray * _Nullable)callsForAccount:(OMIAccount * _Nonnull)account;

/**
 *  Add the given call to the Call Manager.
 *
 *  @param call The OMICall instance to add.
 */
- (void)addCall:(__weak OMICall * _Nonnull)call;

/**
 *  Remove the given call from the Call Manager.
 *
 *  @param call the OMICall instance to remove.
 */
- (void)removeCall:(__weak OMICall * _Nonnull)call;

- (void)removeAllCall;

/**
 *  End active calling call
 */
- (void)endActiveCall;

/**
 * OmiID is unique id of call in 2 leg A & B
 */
- (void)setOmiID:(NSString * _Nonnull ) omiId callID:(NSInteger) callId;


/**
 * sipNumber is number selected for call out/in
 */
- (void)setSipNumber:(NSString * _Nonnull ) sipNumber callID:(NSInteger) callId;


/**
 *  End all calls.
 *  Notice this function just use to hangup SIP Call not End Callkit
 */
- (void)endAllCalls;

/**
 *  End all calls.
 *  Notice this function just use to remove All call current when user kill app
 */
- (void)closeAllCalls;


/**
 *  End call when have error from CallKit.
 *  Notice this function just use to remove All call current when user kill app
 */

- (void)OmiCloseFromCallKit;

- (NSMutableArray *)getAllCalls;

/**
 *  End all calls.
 */

/**
 *  End all calls for the given account.
 *
 *  @param account The OMIAccount instance for which to end all calls.
 */
- (void)endAllCallsForAccount:(OMIAccount * _Nonnull)account;

/**
 *  Returns the first call for the given account
 *
 *  @param account The OMIAccount instance for which to return the first call.
 *
 *  @return The first call for the given account, otherwise nil.
 */
- (__weak OMICall * _Nullable)firstCallForAccount:(OMIAccount * _Nonnull)account;

/**
 *  Returns the first ACTIVE call for the given account.
 *
 *  @param account The OMIAccount instance for which to return the first active call.
 *
 *  @return The first active call for the given account, otherwise nil.
 */
- (__weak OMICall * _Nullable)firstActiveCallForAccount:(OMIAccount * _Nonnull)account;
- (__weak OMICall *_Nullable)firstActiveOutboundCallForAccount:(OMIAccount *_Nonnull)account;

/**
 *  Returns all ACTIVE calls for the given account.
 *  Active calls are calls with state > OMICallStateNull and < OMICallStateDisconnected.
 *
 *  @param account The OMIAccount instance for which to return active calls.
 *
 *  @return An NSArray containing all active calls for the account, or empty array if none.
 */
- (NSArray <OMICall *> * _Nonnull)activeCallsForAccount:(OMIAccount * _Nonnull)account;

/**
 *  Returns the last call for the given account
 *
 *  @param account The OMIAccount instance for which to return the last call.
 *
 *  @return The last call for the given account, otherwise nil.
 */
- (__weak OMICall * _Nullable)lastCallForAccount:(OMIAccount * _Nonnull)account;

/**
 *  Returns the current confirm call
 * *
 */
- (__weak OMICall * _Nullable)getCurrentConfirmCall;

    
/**
 *  Reinvite all active calls for the given account.
 *
 *  @param account The OMIAccount instance for which to reinvite all calls.
 */
- (void)reinviteActiveCallsForAccount:(OMIAccount * _Nonnull)account;

/**
 *  Sent a SIP UPDATE message to all active calls for the given account.
 *
 *  @param account The OMIAccount instance for which to sent the UPDATE.
 */
- (void)updateActiveCallsForAccount:(OMIAccount * _Nonnull)account;



/**
 *  Use for end Call and close call kit
 *
 */
- (void)endCallWithUUID:(NSUUID *_Nonnull)uuid;

- (void)startCheckSpamCalls:(NSInteger)retry;
- (void)startCheckSpamCalls:(NSInteger)retry forCallUUID:(NSUUID *_Nullable)callUUID;

/**
 *  Mark that a VoIP push for a real incoming call has just been received.
 *  Used to keep the endpoint alive through its destroy grace window: a forwarded /
 *  back-to-back incoming call (OMI forward flow) can land while the previous call's
 *  endpoint is still tearing down, and destroying it then forces a slow recreate that
 *  makes the next call show CallKit without ringing. Recording the push timestamp lets
 *  the grace window defer the destroy until the incoming INVITE has had time to arrive.
 */
- (void)markIncomingPushReceived;

/**
 *  YES if a real incoming VoIP push arrived recently (within the forward grace window),
 *  signalling that an incoming call is imminent and the endpoint should not be destroyed.
 */
- (BOOL)hasRecentIncomingPush;

- (__weak OMICall * _Nullable)updateNameCaller:(NSString *_Nonnull)name callId:(NSInteger *_Nonnull)callId;

- (__weak OMICall * _Nullable)findCallWithCallId:(NSInteger *_Nonnull)callId;

- (void)addTransactionIdInfoItem:(OMITransactionIdInfoItem *)item;

- (void)removeTransactionIdInfoItemWithCallId:(NSInteger)callId;

- (OMITransactionIdInfoItem * _Nullable)findTransactionIdInfoItemByCallId:(NSInteger)callId;

@end
