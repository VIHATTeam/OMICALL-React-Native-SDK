//
//  OMICall.h
//  Copyright © 2015 OMICALL. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "OMIAccount.h"
#import "OMICallStats.h"
#import "SipInvite.h"




/**
 *  Notification which is posted when the have incoming call (from SIP).
 */
extern NSString * _Nonnull const OMICallInComingNotification;
/**
 *  Notification which is posted when the call's state changes.
 *  The call for which the state changed can be found in the
 *  notifications user info dict.
 */
extern NSString * _Nonnull const OMICallStateChangedNotification;

/**
 *  Notification which is posted when the media call's state changes.
 *  The call for which the state changed can be found in the
 *  notifications user info dict.
 */
extern NSString * _Nonnull const OMICallMediaStateChangedNotification;


/**
 *  Notification which is posted when the call's state changes.
 *  The call for which the state changed can be found in the
 *  notifications user info dict.
 */
extern NSString * _Nonnull const OMICallIPChangeNotification;

/**
 *  Notification when network status change we have 3 level best/medium/bad.
 */
extern NSString * _Nonnull const OMICallNetworkQualityNotification;

/**
 *  Media health of the OTHER party, derived from the RTP packets actually received.
 *  OMICallNetworkQualityNotification cannot report a dropped peer: its MOS/jitter/loss
 *  only change while packets keep arriving.
 */
typedef NS_ENUM(NSInteger, OMIRemoteConnectionState) {
    /** Audio (and video, if any) arriving normally. */
    OMIRemoteConnectionConnected = 0,
    /** Audio arriving, video stopped (remote camera off / app in background). */
    OMIRemoteConnectionVideoPaused = 1,
    /** Remote audio arriving at a clearly reduced rate — unstable connection. */
    OMIRemoteConnectionWeak = 2,
    /** No media from the other party while our own network is up — they dropped. */
    OMIRemoteConnectionReconnecting = 3,
    /** Our own device has no network. */
    OMIRemoteConnectionLocalReconnecting = 4,
    /** Our device just switched network (Wi-Fi ↔ cellular) and media is interrupted. */
    OMIRemoteConnectionNetworkSwitching = 5,
    /** The other party reports heavy loss of OUR media, or stopped reporting it —
     *  they may not see/hear us well, while their media still reaches us fine. */
    OMIRemoteConnectionUplinkPoor = 6,
};

/**
 *  Posted on the main queue when OMIRemoteConnectionState changes (not every second).
 *  userInfo: OMINotificationRemoteConnectionStateKey (NSNumber OMIRemoteConnectionState),
 *            OMINotificationRemoteConnectionDurationKey (NSNumber, seconds the previous
 *            problem state lasted; 0 when entering a problem state),
 *            OMINotificationRemoteConnectionCallKey (OMICall).
 *  The SDK never hangs up on its own — use the state/duration to decide in the app.
 */
extern NSString * _Nonnull const OMICallRemoteConnectionNotification;
extern NSString * _Nonnull const OMINotificationRemoteConnectionStateKey;
extern NSString * _Nonnull const OMINotificationRemoteConnectionDurationKey;
extern NSString * _Nonnull const OMINotificationRemoteConnectionCallKey;
/** Call UUID string — use this one when bridging to React Native / Flutter
 *  (the OMICall object under OMINotificationRemoteConnectionCallKey is not serializable). */
extern NSString * _Nonnull const OMINotificationRemoteConnectionCallUUIDKey;



/**
 *  Notification which is posted when the call's media event recived.
 *  The callId for which the media event changed can be found in the
 *  notifications user info dict.
 */
extern NSString * _Nonnull const OMINotificationUserInfoVideoSizeRenderKey;

/**
 *  Notification for when the OMICall object has been dealloced.
 */
extern NSString * _Nonnull const OMICallDeallocNotification;

/**
 *  Notification for when there is no audio during a call.
 */
extern NSString * _Nonnull const OMICallNoAudioForCallNotification;

/**
 * Notification for when there is an error setting up a call.
 */
extern NSString * _Nonnull const OMICallErrorDuringSetupCallNotification;
/**
 * Notification for when there is an error setting up a call.
 */
extern NSString * _Nonnull const OMICallVideoInfoNotification;

/**
 * Notification for when switchboard answer call.
 */
extern NSString * _Nonnull const OMICallSwitchBoardAnswerNotification;

/**
 * Notification for when audio route changed.
 */
extern NSString * _Nonnull const OMICallAudioRouteChangeNotification;


extern NSString * _Nonnull const OMICallStatsPPL;

extern NSString * _Nonnull const OMICallStatsLatency;

extern NSString * _Nonnull const OMICallStatsJitter;

/**
 *  Notification that will be posted when a phonecall is connected.
 */
extern NSString * _Nonnull const OMICallConnectedNotification DEPRECATED_MSG_ATTRIBUTE("Deprecated, listen for OMICallStateChangedNotification instead");

/**
 *  Notification that will be posted when a phonecall is disconnected locally.
 */
extern NSString * _Nonnull const OMICallDisconnectedNotification DEPRECATED_MSG_ATTRIBUTE("Deprecated, listen for OMICallStateChangedNotification instead");

/**
 *  The posible errors OMICall can return.
 */
typedef NS_ENUM(NSInteger, OMICallErrors) {
    /**
     *  Unable to create a PJSip thread.
     */
    OMICallErrorCannotCreateThread,
    /**
     *  Unable to create call.
     */
    OMICallErrorCannotCreateCall,
    /**
     *  Unable to answer an incoming call.
     */
    OMICallErrorCannotAnswerCall,
    /**
     *  Unable to hangup call.
     */
    OMICallErrorCannotHangupCall,
    /**
     *  Unable to decline call.
     */
    OMICallErrorCannotDeclineCall,
    /**
     *  Unable to toggle mute call.
     */
    OMICallErrorCannotToggleMute,
    /**
     *  Unable to toggle hold call.
     */
    OMICallErrorCannotToggleHold,
    /**
     *  Unable to send DTMF for call.
     */
    OMICallErrorCannotSendDTMF,
};

typedef NS_ENUM(NSInteger, OMIVideoState) {
    /**
     *  Videl stream from local is starting.
     */
    OMIVideoLocalReady,
    /**
     *  Videl stream from remote is starting.
     */
    OMIVideoRemoteReady,
    /**
     *  Video media error - camera failed (typically from background).
     *  SDK will attempt recovery when app returns to foreground.
     */
    OMIVideoMediaError,
};

typedef NS_ENUM(NSInteger, OMIStartCallStatus) {

    OMIInvalidUuid,

    OMIInvalidPhoneNumber,

    OMISamePhoneNumber,

    OMIMaxRetry,

    OMIPermissionDenied,

    OMICouldNotFindEndpoint,

    OMIAccountRegisterFailed,

    OMIStartCallFailed,

    OMIStartCallSuccess,

    OMIHaveAnotherCall,

    OMIAccountTurnOffNumberInternal,

    OMINoNetwork,

    OMICallWaitingForEndpoint
};


typedef NS_ENUM(NSInteger, OMINetworkStatus) {
    /**
     *  Network are best for Voip/video call
     */
    OMINetworkGood,
    /**
     *   Network are medium status for Voip/video call, it's mean call can effect like lag, crackle
     */
    OMINetworkMedium,
    /**
     *   Network are bad, ussualy cause call can effect like lag, crackle
     */
    OMINetworkBad,

};


#define OMICallErrorsString(OMICallErrors) [@[@"OMICallErrorCannotCreateThread", @"OMICallErrorCannotCreateCall", @"OMICallErrorCannotAnswerCall", @"OMICallErrorCannotHangupCall", @"OMICallErrorCannotDeclineCall", @"OMICallErrorCannotToggleMute", @"OMICallErrorCannotToggleHold", @"OMICallErrorCannotSendDTMF"] objectAtIndex:OMICallErrors]


/**
 *  The states which a call can have.
 */
typedef NS_ENUM(NSInteger, OMICallState) {
    /**
     *   Before INVITE is sent or received.
     */
    OMICallStateNull = 0,
    /**
     *   After INVITE is sent.
     */
    OMICallStateCalling = 1,
    /**
     *  After INVITE is received.
     */
    OMICallStateIncoming = 2,
    /**
     *  After response with To tag.
     */
    OMICallStateEarly = 3,
    /**
     *  After 2xx is sent/received.
     */
    OMICallStateConnecting = 4,
    /**
     *  After ACK is sent/received.
     */
    OMICallStateConfirmed = 5,
    /**
     *  Session is terminated.
     */
    OMICallStateDisconnected = 6,
    /**
     *  User toggle hold
     */
    OMICallStateHold = 7,

    /**
     *  Call being request disconnect
     */
    OMICallStateDisconnecting = 12,
};


/**
 *  The states which a call can have.
 */
typedef NS_ENUM(NSInteger, OMICallMediaState) {
  
    /**
     *  User toggle muted
     */
    OMICallStateMuted = 8,
    /**
     *  User toggle Speaker
     */
    OMICallStateToggleSpeaker = 9,

    /**
     *  Dont have permission Camera
     */
    OMICallStatePermissionCameraDenied = 10,
    /**
     *  Dont have permission microphone
     */
    OMICallStatePermissionMicrophoneDenied = 11,



};



#define OMICallStateString(OMICallState) [@[@"OMICallStateNull", @"OMICallStateCalling", @"OMICallStateIncoming", @"OMICallStateEarly", @"OMICallStateConnecting", @"OMICallStateConfirmed", @"OMICallStateDisconnected", @"OMICallStateDisconnecting"] objectAtIndex:OMICallState]


/**
 *  The states which the media can have.
 */
typedef NS_ENUM(NSInteger, OMIMediaState) {
    /**
     *  There is no media.
     */
    OMIMediaStateNone = 0,
    /**
     *  The media is active.
     */
    OMIMediaStateActive = 1,
    /**
     *  The media is locally on hold.
     */
    OMIMediaStateLocalHold = 2,
    /**
     *  The media is remote on hold.
     */
    OMIMediaStateRemoteHold = 3,
    /**
     *  There is an error with the media.
     */
    OMIMediaStateError = 4,
};
#define OMIMediaStateString(OMIMediaState) [@[@"OMIMediaStateNone", @"OMIMediaStateActive", @"OMIMediaStateLocalHold", @"OMIMediaStateRemoteHold", @"OMIMediaStateError"] objectAtIndex:OMIMediaState]

typedef NS_ENUM(NSInteger, OMICallTransferState) {
    OMICallTransferStateUnkown,
    OMICallTransferStateInitialized,
    OMICallTransferStateTrying,
    OMICallTransferStateAccepted,
    OMICallTransferStateRejected,
};
#define OMICallTransferStateString(OMICallTransferState) [@[@"OMICallTransferStateUnkown", @"OMICallTransferStateInitialized", @"OMICallTransferStateTrying", @"OMICallTransferStateAccepted", @"OMICallTransferStateRejected"] objectAtIndex:OMICallTransferState]

typedef NS_ENUM(NSInteger, OMICallAudioState) {
    /**
     *  There is audio for the call.
     */
    OMICallAudioStateOK,
    /**
     *  There hasn't been any audio received during the call.
     */
    OMICallAudioStateNoAudioReceiving,
    /**
     *  There wasn't any audio transmitted.
     */
    OMICallAudioStateNoAudioTransmitting,
    /**
     *  There wasn't any audio in both directions.
     */
    OMICallAudioStateNoAudioBothDirections,
};
#define OMICallAudioStateString(OMICallAudioState) [@[@"OMICallAudioStateOK", @"OMICallAudioStateNoAudioReceiving", @"OMICallAudioStateNoAudioTransmitting", @"OMICallAudioStateNoAudioBothDirections"] objectAtIndex:OMICallAudioState]

typedef NS_ENUM(NSInteger, OMICallTerminateReason) {
    OMICallTerminateReasonUnknown,
    /**
     * Call has been picked up elsewhere.
     */
    OMICallTerminateReasonCallCompletedElsewhere,
    /**
     * The caller has hung up before the call was picked up (CANCEL).
     */
    OMICallTerminateReasonOriginatorCancel,
    /**
     * Remote party ended the connected call (BYE).
     */
    OMICallTerminateReasonRemoteBye,
};
#define OMICallTerminateReasonString(OMICallTerminateReason) [@[@"OMICallTerminateReasonUnknown", @"OMICallTerminateReasonCallCompletedElsewhere", @"OMICallTerminateReasonOriginatorCancel", @"OMICallTerminateReasonRemoteBye"] objectAtIndex:OMICallTerminateReason]


@interface OMICall : NSObject

#pragma mark - Properties

/**
 *  The callId which a call receives from PJSIP when it is created.
 */
@property (nonatomic) NSInteger callId;

/**
 * OmiID is unique id of call in 2 leg A & B
 */
@property (nonatomic) NSString * _Nullable omiId;

/**
 * Per-leg push identifier. The VoIP push payload carries a `uuid` field that is DISTINCT for
 * every push, whereas `callId` (which backs the `uuid` property below) is REUSED across the
 * legs of an OMI no-answer → forward flow. Recording the per-push uuid lets us tell two legs
 * that share the same callId apart. This is auxiliary bookkeeping only — call routing, CallKit
 * reporting and all PJSIP operations still key off `uuid` / `callId` exactly as before; nothing
 * about the SIP dialog or PJSIP call depends on this value.
 */
@property (nonatomic) NSString * _Nullable pushDialogUuid;

/// Raw VoIP push payload this call was created from (latest push for the call), nil for calls
/// not created from a push. Diagnostics only — logged when a push never gets its INVITE.
@property (nonatomic, copy) NSDictionary * _Nullable pushPayload;

/**
 * sipNumber is selected number for called out/in
 */
@property (nonatomic) NSString * _Nullable sipNumber;

/**
 * sipNameNumber is name off Sip Number (default: Empty)
 */
@property (nonatomic) NSString * _Nullable sipNameNumber;

/**
 *  if call is Video call or normal VOIP Call
 */
@property (nonatomic) BOOL isVideo;

/**
 *  Track if initial INVITE had video offer (m=video in SDP)
 *  This is used to determine if re-INVITE with video should be sent
 *  IMPORTANT: This flag is set ONCE during call initialization and should NOT change
 *  during call lifecycle (re-INVITE, hold, transfer, etc.)
 */
@property (nonatomic, readonly) BOOL hasInitialVideoOffer;

/**
 * TIER 2 FIX (2026-02-04): Persistent video state for SwiftUI integration
 *
 * Track if video media is currently active (PJMEDIA_TYPE_VIDEO with ACTIVE status)
 * This allows SwiftUI views to QUERY video state when they mount,
 * instead of relying only on notification timing.
 *
 * @return YES if video media is currently active, NO otherwise
 */
@property (nonatomic, readonly) BOOL isVideoMediaActive;

/**
 * TIER 2 FIX (2026-02-04): Current active video window ID
 *
 * Returns the PJSIP video window ID if video media is active.
 * Returns PJSUA_INVALID_ID (-1) if video is not active.
 *
 * @return Active video window ID, or -1 if no active video
 */
@property (nonatomic, readonly) int activeVideoWindowId;

/**
 * The Call-ID that is present in the SIP messages.
 */
@property (readonly, nonatomic) NSString * _Nonnull messageCallId;

/**
 *  All created calls get an unique ID.
 */
@property (readonly, nonatomic) NSUUID * _Nonnull uuid;

/**
 *  Current health of the other party's media (see OMIRemoteConnectionState).
 *  Read it when a call UI (re)mounts — the notification is only posted on change.
 */
@property (readonly, nonatomic) OMIRemoteConnectionState remoteConnectionState;

/**
 *  The OMIAccount the call belongs to.
 */
@property (weak, nonatomic) OMIAccount * _Nullable account;

/**
 *  The state in which the call currently has.
 */
@property ( nonatomic) OMICallState callState;

/**
 *  There state in which the audio is for the call.
 */
@property (readonly, nonatomic) OMICallAudioState callAudioState;

/**
 *  The state text which the call currently has.
 */
@property (readonly, nonatomic) NSString * _Nullable callStateText;

/**
 *  The last status code the call had.
 */
@property (readonly, nonatomic) NSInteger lastStatus;

/**
 *  True if the microphone is muted.
 */
@property ( nonatomic) long createDate;


/**
 *  The last status text the call had.
 */
@property (readonly, nonatomic) NSString * _Nullable lastStatusText;

/**
 *  The state in which the media of the call currently is.
 */
@property (readonly, nonatomic) OMIMediaState mediaState;

/**
 *  The local URI of the call.
 */
@property (readonly, nonatomic) NSString * _Nullable localURI;

/**
 * save current remove video size
 */
@property (nonatomic) CGSize currentVideoSize;

/**
 *  The remote URI of the call.
 */
@property (readonly, nonatomic) NSString * _Nullable remoteURI;

/**
 *  The name of the caller.
 */
@property (strong, nonatomic) NSString * _Nullable callerName;

/**
 *  The number of the caller.
 */
@property (strong, nonatomic) NSString * _Nullable callerNumber;

/**
 *  True if the call was incoming.
 */
@property (readonly, getter=isIncoming) BOOL incoming;
@property (nonatomic) BOOL isIncomingCallFromPush;


/**
 *  True if the microphone is muted.
 */
@property (readonly, nonatomic) BOOL muted;

/**
 *  True if the microphone is muted.
 */
@property (readonly, nonatomic) BOOL speaker;

/**
 *  True if the call is on hold locally.
 */
@property (readonly, nonatomic) BOOL onHold;

/**
 *  YES for the consult leg created by `[OmiClient startConsultCall:...]`. Such a call never posts
 *  OMICallStateChangedNotification and is never returned as the current call.
 */
@property (readonly, nonatomic) BOOL isConsult;

/**
 *  The statie in which the transfer of the call currently is.
 */
@property (readonly, nonatomic) OMICallTransferState transferStatus;

/*
 * The reason why a call was termianted.
 */
@property (nonatomic) OMICallTerminateReason terminateReason;

/**
 *  For an outbound call, this property is set and indicates the number
 *  that will be called/dialed when -startWithCompletion is invoked.
 */
@property (readonly, strong) NSString * _Nonnull numberToCall;

/*
 * Property is true when the call was hungup locally.
 */
@property (readonly) BOOL userDidHangUp;

@property (readonly) BOOL connected;

@property (readwrite, nonatomic) SipInvite * _Nullable invite;

#pragma mark - Stats

/**
 *  Calculated amount of data transferred (Receiving & Transmitting).
 */
@property (readonly, nonatomic) float totalMBsUsed;

/**
 *  The connection duration of the call.
 */
@property (readonly, nonatomic) NSTimeInterval connectDuration;

/**
 *  Calculated MOS score of the call.
 *
 *  Based on Mean Opinion Score for calls, see: https://en.wikipedia.org/wiki/Mean_opinion_score
 *  Ranges from 1 to 4.4 (slighty different than on wiki). Translates to:
 *
 *  MOS     Quality     Impairment
 *  5       Excellent	Imperceptible
 *  4       Good        Perceptible but not annoying
 *  3       Fair        Slightly annoying
 *  2       Poor        Annoying
 *  1       Bad         Very annoying
 */
@property (readonly, nonatomic) float MOS;

@property (readonly, nonatomic) float LATENCY;

@property (readonly, nonatomic) float JITTER;

@property (readonly, nonatomic) float PPL;

/**
 * The codec that has been used during the call.
 */
@property (readonly, nonatomic) NSString * _Nonnull activeCodec;

#pragma mark - Methods

/**
 *  Calculate MOS score & data use of call.
 */
- (void)calculateStats;

/**
 * This init is not available.
 */
-  (instancetype _Nonnull)init __attribute__((unavailable("Init is not available")));

/**
 *  Deprecated function. You should init an outbound call using -initOutboundCallWithNumberToCall
 *  and start the call using -startWithCompletion.
 *
 *  This will setup a call to the given number and attached to the account.

/**
 *  When PJSIP receives an incoming call, this initializer is called.
 *
 *  @param callId The call ID generated by PJSIP.
 *
 *  @return OMICall instance
 */
- (instancetype _Nullable)initInboundCallWithCallId:(NSUInteger)callId account:(OMIAccount * _Nonnull)account;

/**
 *  When PJSIP receives an incoming call, this initializer is called.
 *
 *  @param callId The call ID generated by PJSIP.
 *  @param account The account being used to call.
 *  @param invite An instance of SipInvite that has been created using the INVITE packet.
 *  @return OMICall instance
 */
- (instancetype _Nullable)initInboundCallWithCallId:(NSUInteger)callId account:(OMIAccount * _Nonnull)account andInvite:(SipInvite *_Nonnull)invite;

/**
*  When OMI receives a push message reporting an incoming call, this initializer is called.
*
*  @param uuid The call uuid taken from the push message.
*  @param number The number from the caller taken from the push message.
*  @param name The name from the caller taken from the push message.
*  @return OMICall instance
*/
- (instancetype _Nullable)initInboundCallWithUUID:(NSUUID * _Nonnull)uuid number:(NSString * _Nonnull)number name:(NSString * _Nonnull)name;
- (instancetype _Nullable)initInboundCallWithUUID:(NSUUID * _Nonnull)uuid ;

- (instancetype _Nullable)initWithCallId:(NSUInteger)callId accountId:(NSInteger)accountId __attribute__((unavailable("Deprecated, use -initWithCallID: andAccount: instead")));

/*
 *  Init an outbound call.
 *
 *  @param number The number to call (when invoking -startWithCompletion).
 *  @param account The OMIAccount for which this call is created.
 *
 *  @return OMICall instance.
 */
- (instancetype _Nullable)initOutboundCallWithNumberToCall:(NSString * _Nonnull)number account:(OMIAccount * _Nonnull)account;

- (void) increaseCallTime;
- (void) prepairStop;

/**
 *  Start the call. The number that will be called is the number provided when the call was created using
 *  -initWithNumbertoCall
 *
 *  @param completion A completion block called when the call is started. The block has an error
 *  parameter which contains an error when the outbound call fails, otherwise Nil.
 */
- (void)startWithCompletion:(void (^ _Nonnull)(NSError * _Nullable error))completion;

/**
 *  This will end the call.
 *
 *  @param error Pointer to an NSError pointer. Will be set to a NSError instance if cannot hangup the call.
 *
 *  @return BOOL success of hanging up the call.
 */
- (BOOL)hangup:(NSError * _Nullable * _Nullable)error;

/**
 *  This will decline the incoming call and ít still ring in orther devices
 *
 *  @param error Pointer to an NSError pointer. Will be set to a NSError instance if cannot decline the call.
 *
 *  @return BOOL success of declining up the call.
 */
- (BOOL)decline:(NSError * _Nullable * _Nullable)error;

/**
 *  This will decline the incoming call with specified status code
 *
 *  @param useBusyHere BOOL if YES, sends 486 BUSY_HERE; if NO, sends 603 DECLINE. Default is YES.
 *  @param error Pointer to an NSError pointer. Will be set to a NSError instance if cannot decline the call.
 *
 *  @return BOOL success of declining up the call.
 */
- (BOOL)declineWithBusyHere:(BOOL)useBusyHere error:(NSError * _Nullable * _Nullable)error;

/**
 *  This will decline the incoming call and kill call, stop ring in orther device
 *
 *  @param error Pointer to an NSError pointer. Will be set to a NSError instance if cannot decline the call.
 *
 *  @return BOOL success of declining up the call.
 */
- (BOOL)dropCall:(NSError * _Nullable * _Nullable)error;

/**
 *  Toggle mute of the microphone for this call.
 *
 *  @param error Pointer to an NSError pointer. Will be set to a NSError instance if cannot toggle mute of the call.
 */
- (BOOL)toggleMute:(NSError * _Nullable * _Nullable)error;

/**
 *  This will answer the incoming call.
 *
 *  @param completion A completion block called when sucessfully answering the call. The block has an error
 *  parameter which contains an error when answering the call fails, otherwise Nil.
 *
 *  @warning Do not user this function directly, user OMICallManager -anserCall: completion: otherwise the
 *  audio session is not activated.
 */
- (void)answerWithCompletion:(void (^ _Nullable)(NSError * _Nullable error))completion;
- (BOOL)answer:(NSError * _Nullable * _Nullable)error __attribute__((unavailable("Deprecated, use OMICallManager -answerCall: completion: instead")));

/**
 *  Toggle hold of the call.
 *
 *  @param error Pointer to an NSError pointer. Will be set to a NSError instance if cannot put call on hold.
 */
- (BOOL)toggleHold:(NSError * _Nullable * _Nullable)error;

/**
 *  Send DTMF tone for this call with a character.
 *
 *  @param character character NSString the character for the DTMF.
 *  @param error     error Pointer to an NSError pointer. Will be set to a NSError instance if cannot send DTMF for the call.
 */
- (BOOL)sendDTMF:(NSString * _Nonnull)character error:(NSError * _Nullable * _Nullable)error;

/**
 *  Blind transfer a call with a given number.
 *
 *  @param number NSString the number that should be transfered to.
 *
 *  @return BOOL success if the transfer has been sent.
 */
- (BOOL)blindTransferCallWithNumber:(NSString * _Nonnull)number;

/**
 *  Transfer the call to the given OMICall.
 *
 *  @param secondCall OMICall this call should be transferred to.
 *
 *  @return BOOL success of the call transfer.
 */
- (BOOL)transferToCall:(__weak OMICall * _Nonnull)secondCall;

/**
 *  This will change the transferStatus of the call.
 *
 *  @param statusCode The status code of the transfer state.
 *  @param text The description of the transfer state.
 *  @param final BOOL indictating this is the last update of the transfer state.
 */
- (void)callTransferStatusChangedWithStatusCode:(NSInteger)statusCode statusText:(NSString * _Nullable)text final:(BOOL)final;

/**
 *  Will re-invite call.
 */
- (void)reinvite;

/**
 * Enable video after app returns to foreground.
 * When answering video call from background, video init is deferred.
 * Call this method when app becomes active to send re-INVITE with video.
 */
- (void)enableVideoAfterForeground;

/**
 * Check if this call needs video to be enabled after foreground transition.
 * @return YES if video was deferred during background answer, NO otherwise.
 */
@property (readonly, nonatomic) BOOL needsVideoAfterForeground;

/**
 * Check if a re-INVITE is currently in progress.
 * Used to prevent duplicate re-INVITE requests that cause mutex deadlock.
 * @return YES if re-INVITE is being processed, NO otherwise.
 */
@property (readonly, nonatomic) BOOL isReInviteInProgress;

/**
 *  Will sent the UPDATE message to the call.
 */
- (void)update;

/**
 *  Calculate MOS score & data use of call.
 */
- (void)calculateStats;

/**
 *  Setnew.
 */
- (void)setSpeaker:(Boolean)speaker;

+ (NSDictionary *)getCallerInfoFromRemoteUri:(NSString *)string;

- (void)updateLastStatus:(NSInteger)statusCall lastStatusText:(NSString *) lastStatusText;

/**
 * TIER 2 FIX (2026-02-04): Notify SDK that video UI is ready
 *
 * Call this method from SwiftUI when your video view has mounted and is ready to display video.
 * If video media is already active (PJSIP callback already fired), this will re-trigger
 * video setup to show the video views.
 *
 * This fixes cases where:
 * - SwiftUI view mounts AFTER video becomes ready (navigation delays, cold start)
 * - User navigates from another screen to video call screen
 * - App launches slowly and video ready notification was already posted
 *
 * Usage in SwiftUI:
 * @code
 * struct VideoCallScreen: View {
 *     @State var call: OMICall?
 *
 *     var body: some View {
 *         VideoPreviewContainer()
 *             .onAppear {
 *                 // Notify SDK that UI is ready
 *                 call?.notifyVideoUIReady()
 *             }
 *     }
 * }
 * @endcode
 *
 * @discussion This method is safe to call multiple times and will only trigger video setup
 *             if video media is actually active. If video is not yet active, it will be
 *             ignored and video will start normally when PJSIP callback fires.
 */
- (void)notifyVideoUIReady;

@end

// MARK: - Internal Methods (for OmiKit internal use only)
@interface OMICall (Internal)

/**
 * Internal setter for hasInitialVideoOffer property
 * This is used by OMIEndpoint when parsing SDP from incoming INVITE
 * to set the flag based on actual SDP content (m=video presence)
 *
 * @param hasInitialVideoOffer YES if INVITE contains m=video line, NO otherwise
 */
- (void)setHasInitialVideoOfferInternal:(BOOL)hasInitialVideoOffer;

/**
 * Request keyframe (I-frame) from remote encoder
 * Used to accelerate video recovery after MEDIA_ERROR or format changes
 *
 * @param callId The PJSIP call ID to request keyframe for (NSInteger cast from pjsua_call_id)
 */
- (void)requestKeyframeFromRemoteForCallId:(NSInteger)callId;

/**
 * Reset videoReadyNotificationPosted flag so new Metal views can receive their window ID.
 * Called by OMIVideoCallManager.createInternalVideoViews when Metal views are recreated.
 * Allows the next mediaStateChanged (same wid) to re-post OMIVideoRemoteReady to fresh views.
 */
- (void)resetVideoReadyNotificationState;

@end
