//
//  OMIConsultController.h
//  OmiKit
//
//  INTERNAL — not part of the supported API (public only so the unit tests can reach it).
//  Use OmiClient's consult methods instead.
//
//  Pure consult-transfer state machine, a port of Android ConsultCallController (SDK 2.9.1).
//  It never touches OMISIP: every call returns the list of effects the caller must run, in order.
//  Not thread-safe — OMIConsultManager drives it from the main queue only.
//

#import <Foundation/Foundation.h>
#import "OmiConsult.h"

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, OMIConsultPhase) {
    OMIConsultPhaseNone,
    OMIConsultPhaseDialing,
    OMIConsultPhaseRinging,
    OMIConsultPhaseAnswered,
    OMIConsultPhaseCompleting,
    OMIConsultPhaseCancelling,
};

typedef NS_ENUM(NSInteger, OMIConsultEffectType) {
    OMIConsultEffectHoldCall,               // callId
    OMIConsultEffectUnholdCall,             // callId
    OMIConsultEffectHangUpCall,             // callId
    OMIConsultEffectPlaceConsultCall,       // extension
    OMIConsultEffectReferOriginal,          // callId (customer), extension
    OMIConsultEffectArmCompleteFallback,
    OMIConsultEffectCancelCompleteFallback,
    OMIConsultEffectArmReferTimeout,
    OMIConsultEffectCancelReferTimeout,
    OMIConsultEffectNotifyConsult,          // callId, consultState, statusCode
    OMIConsultEffectNotifyTransferStatus,   // callId, statusCode, isFinal
};

/// Simplified call states the controller cares about (mapped from OMICallState).
typedef NS_ENUM(NSInteger, OMIConsultCallEvent) {
    OMIConsultCallEventCalling,
    OMIConsultCallEventEarly,
    OMIConsultCallEventConfirmed,
    OMIConsultCallEventDisconnected,
    OMIConsultCallEventOther,
};

@interface OMIConsultEffect : NSObject
@property (nonatomic, readonly) OMIConsultEffectType type;
@property (nonatomic, readonly) NSInteger callId;
@property (nonatomic, readonly, copy, nullable) NSString *extension;
@property (nonatomic, readonly) OmiConsultState consultState;
@property (nonatomic, readonly) NSInteger statusCode;
@property (nonatomic, readonly) BOOL isFinal;
@end

/// Timers owned by the manager (same values as Android).
extern const NSTimeInterval OMIConsultCompleteFallbackSeconds;  // 3 s
extern const NSTimeInterval OMIConsultReferTimeoutSeconds;      // 30 s

@interface OMIConsultController : NSObject

@property (nonatomic, readonly) OMIConsultPhase phase;
/// -1 until the consult call exists.
@property (nonatomic, readonly) NSInteger consultCallId;
/// -1 when idle.
@property (nonatomic, readonly) NSInteger originalCallId;
@property (nonatomic, readonly, copy, nullable) NSString *extension;
/// The customer call ended while the consult is still running.
@property (nonatomic, readonly) BOOL originalEnded;
/// Customer call whose REFER result is still awaited (-1 when none).
@property (nonatomic, readonly) NSInteger referPendingCallId;

@property (nonatomic, readonly) BOOL isConsulting;
/// Mute / DTMF target while consulting: the consult call once ANSWERED, otherwise -1.
@property (nonatomic, readonly) NSInteger inCallTargetId;

/// Guards and the NONE → DIALING transition in one step. On success `effects` gets
/// Hold(customer), PlaceConsultCall(extension), Notify(-1, DIALING, 0).
- (OmiConsultStartStatus)tryBeginWithExtension:(nullable NSString *)extension
                                originalCallId:(NSInteger)originalCallId
                             originalConfirmed:(BOOL)originalConfirmed
                               originalIsVideo:(BOOL)originalIsVideo
                                    selfNumber:(nullable NSString *)selfNumber
                                customerNumber:(nullable NSString *)customerNumber
                                       effects:(NSArray<OMIConsultEffect *> * _Nullable * _Nonnull)effects;

/// The consult call was created with this id, or -1 when it could not be created.
- (NSArray<OMIConsultEffect *> *)onConsultCallCreated:(NSInteger)callId;

/// State change of any call (consult or customer). `statusCode` = last SIP status.
- (NSArray<OMIConsultEffect *> *)onCallId:(NSInteger)callId event:(OMIConsultCallEvent)event statusCode:(NSInteger)statusCode;

- (NSArray<OMIConsultEffect *> *)cancelAccepted:(BOOL *)accepted;
- (NSArray<OMIConsultEffect *> *)completeAccepted:(BOOL *)accepted;
- (NSArray<OMIConsultEffect *> *)onCompleteFallback;
- (NSArray<OMIConsultEffect *> *)onTransferStatusForCallId:(NSInteger)callId statusCode:(NSInteger)statusCode isFinal:(BOOL)isFinal;
- (NSArray<OMIConsultEffect *> *)onReferTimeout;
/// Stack stop / logout: back to NONE without hanging up or un-holding anything.
- (NSArray<OMIConsultEffect *> *)forceReset;

/// Same rule as Android: trimmed, non-empty, no whitespace or control characters.
+ (nullable NSString *)normalizedExtension:(nullable NSString *)extension;
/// Number comparison form: trimmed, " -.()" removed, leading '+' stripped.
+ (NSString *)comparableNumber:(nullable NSString *)number;

@end

NS_ASSUME_NONNULL_END
