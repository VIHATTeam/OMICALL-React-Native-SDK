//
//  OmiConsult.h
//  OmiKit
//
//  Consult (attended) transfer — same API and behaviour as the OMICall Android SDK 2.9.1.
//
//  Flow: the agent is talking to a customer (CONFIRMED audio call) →
//    [OmiClient startConsultCall:...]   holds the customer and calls an extension;
//    [OmiClient completeConsultTransfer:] (consult answered) hangs up the consult, then
//                                          blind-transfers the customer to that extension;
//    [OmiClient cancelConsult]            ends the consult and takes the customer off hold.
//
//  The consult is a separate call: it never posts OMICallStateChangedNotification and never
//  becomes the "current" call. Follow it through OMIConsultStateChangedNotification.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// Result of `startConsultCall` (same values as Android `OmiConsultStartStatus`).
typedef NS_ENUM(NSInteger, OmiConsultStartStatus) {
    OmiConsultStartStatusSuccess = 200,
    OmiConsultStartStatusEmptyExtension = 402,
    OmiConsultStartStatusCanNotCallYourself = 403,
    OmiConsultStartStatusSwitchboardNotConnected = 404,
    OmiConsultStartStatusMissingAudioPermission = 405,
    OmiConsultStartStatusNoActiveCall = 409,
    OmiConsultStartStatusConsultInProgress = 410,
    OmiConsultStartStatusVideoCallNotSupported = 411,
    OmiConsultStartStatusSameAsCustomer = 412,
};

/// State of the consult leg (same values as Android `OmiConsultState`).
typedef NS_ENUM(NSInteger, OmiConsultState) {
    OmiConsultStateDialing = 0,
    OmiConsultStateRinging = 1,
    OmiConsultStateAnswered = 2,
    OmiConsultStateEnded = 3,
};

/// One live call, as returned by `[OmiClient getActiveCalls]` (Android `OmiCallSummary`).
@interface OmiCallSummary : NSObject
@property (nonatomic, readonly) NSInteger callId;
@property (nonatomic, readonly, copy) NSString *uuid;
/// Extension for the consult call, customer number for the customer call.
@property (nonatomic, readonly, copy) NSString *number;
/// OMICallState value.
@property (nonatomic, readonly) NSInteger state;
@property (nonatomic, readonly) BOOL isHold;
@property (nonatomic, readonly) BOOL isConsult;
- (instancetype)initWithCallId:(NSInteger)callId uuid:(NSString *)uuid number:(NSString *)number
                         state:(NSInteger)state isHold:(BOOL)isHold isConsult:(BOOL)isConsult;
@end

#pragma mark - Notifications (posted on the main queue)

/// Android `onConsultStateChanged(consultCallId, state, statusCode)`.
/// userInfo: OMINotificationCallIdKey (-1 before the consult call exists), OMINotificationCallUUIDKey
/// (when known), OMINotificationConsultStateKey (OmiConsultState), OMINotificationStatusCodeKey
/// (180/183 ringing, 200 answered, final SIP code when ended, 0 without a SIP response).
extern NSString * const OMIConsultStateChangedNotification;

/// Android `onTransferStatus(callId, statusCode, isFinal)` — REFER progress of any call.
/// 500/final when the REFER could not be sent, 408/final when no result came within 30 s.
/// userInfo: OMINotificationCallIdKey, OMINotificationCallUUIDKey, OMINotificationStatusCodeKey,
/// OMINotificationIsFinalKey.
extern NSString * const OMITransferStatusNotification;

/// Android `onCallHoldChanged(callId, isHold)` — fires for any call.
/// userInfo: OMINotificationCallIdKey, OMINotificationCallUUIDKey, OMINotificationIsHoldKey.
extern NSString * const OMICallHoldChangedNotification;

extern NSString * const OMINotificationCallIdKey;        // NSNumber (NSInteger)
// OMINotificationCallUUIDKey (NSString, call UUID) is declared in OMISIPLib.h.
extern NSString * const OMINotificationConsultStateKey;  // NSNumber (OmiConsultState)
extern NSString * const OMINotificationStatusCodeKey;    // NSNumber (NSInteger)
extern NSString * const OMINotificationIsFinalKey;       // NSNumber (BOOL)
extern NSString * const OMINotificationIsHoldKey;        // NSNumber (BOOL)

NS_ASSUME_NONNULL_END
