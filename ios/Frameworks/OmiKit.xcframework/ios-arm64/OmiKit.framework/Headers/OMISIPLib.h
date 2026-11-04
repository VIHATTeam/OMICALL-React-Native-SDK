//
//  OMISIPLib.h
//  Copyright © 2015 OMICALL. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "OMIAccountConfiguration.h"
#import "OMICallManager.h"
#import "OMICall.h"
#import "OMICodecConfiguration.h"
#import "OMIEndpointConfiguration.h"
#import "OMIIceConfiguration.h"
#import "OMIStunConfiguration.h"
#import "OMITransportConfiguration.h"
#import "CallKitProviderDelegate.h"
#import "OMIEndpoint.h"

@class DDLogMessage;


typedef NS_ENUM(NSInteger, OMIAppState) {
    /**
     *  app go to background
     */
    OMIAppStateBackground,
    /**
     *   App go to foreground
     */
    OMIAppStateForeground,

};


/**
 *  Key to be used for retreiving a Call object out of NSNotification user info dict.
 */
extern NSString * __nonnull const OMINotificationUserInfoCallKey;

/**
 *  Key to be used for retreiving a CallId out of NSNotification user info dict.
 */
extern NSString * __nonnull const OMINotificationUserInfoCallIdKey;
/**
 *  Key to be used for retreiving a render window id out of NSNotification user info dict.
 */
extern NSString * __nonnull const OMINotificationUserInfoWindowIdKey;
/**
 *  Key to be used for retreiving a new size of render view out of NSNotification user info dict.
 */
extern NSString * __nonnull const OMINotificationUserInfoWindowSizeKey;

/**
 * Key to be used for retrieving the currentCall state out of the NSSNotification user info dict.
 */
extern NSString * __nonnull const OMINotificationUserInfoCallStateKey;

/**
 * Key to be used for retrieving the currentCall state out of the NSSNotification user info dict.
 */
extern NSString * __nonnull const OMINotificationUserInfoCallMediaStateKey;

/**
 * Key to be used for retrieving the Call UUID.
 */
extern NSString * __nonnull const OMINotificationCallUUIDKey;


/**
 *  Key to be used for retrieving the current audio state for call out of the NSNotificaton user info dict.
 */
extern NSString * __nonnull const OMINotificationUserInfoCallAudioStateKey;

/**
 *  Key to be used for retrieving the status code when there is an error setting up a call.
 */
extern NSString * __nonnull const OMINotificationUserInfoErrorStatusCodeKey;

/**
 *  Key to be used for retrieving the status message when there is an error setting up a call.
 */
extern NSString * __nonnull const OMINotificationUserInfoErrorStatusMessageKey;

/**
 *  Key to be used for retrieving the status speaker.
 */
extern NSString * __nonnull const OMINotificationUserToggleSpeakerState;

/**
 *  Key to be used for retrieving the status video.
 */
extern NSString * __nonnull const OMIVideoInfoState;

/**
 *  Key to be used for retrieving the status video.
 */
extern NSString * __nonnull const OMINotificationNetworkStatusKey;

/**
 *  Key to be used for showing network information
 */
extern NSString * __nonnull const OMINotificationJitterKey;
extern NSString * __nonnull const OMINotificationMOSKey;
extern NSString * __nonnull const OMINotificationPPLKey;
extern NSString * __nonnull const OMINotificationLatencyKey;

/**
 *  Key to be used for end cause
 */
extern NSString * __nonnull const OMINotificationEndCauseKey;

/**
 *  Key to be used for receiving sip number.
 */
extern NSString * __nonnull const OMINotificationSIPKey;

/**
 *  Key to be used for receiving current route
 */
extern NSString * __nonnull const OMINotificationCurrentAudioRouteKey;

/**
 *  Possible errors the OMISIPLib can return.
 */
typedef NS_ENUM(NSUInteger, OMISIPLibErrors) {
    /**
     *  Unable to configure the endpoint.
     */
    OMISIPLibErrorEndpointConfigurationFailed,
    /**
     *  Unable to configure the account.
     */
    OMISIPLibErrorAccountConfigurationFailed,
};
#define OMISIPLibErrorsString(OMISIPLibErrors) [@[@"OMISIPLibErrorEndpointConfigurationFailed", @"OMISIPLibErrorAccountConfigurationFailed"] objectAtIndex:OMISIPLibErrors]

/**
 *  The protocol which needs to be implemented in order to use the library.
 */
@protocol SIPEnabledUser <NSObject>

/**
 *  The sip account that should be used when authenticate on remote PBX.
 *
 *  @return NSString with the password.
 */
@property (readonly, nonatomic) NSString * _Nonnull sipAccount;
@property (readonly, nonatomic) NSString * _Nonnull contactUriParams;
@property (readonly, nonatomic) NSString * _Nullable transportType;
@property (strong, nonatomic) NSString * _Nullable state;
@property (nonatomic) BOOL  isUseContactV2;


/**
 *  The password that should be used when authenticate on remote PBX.
 *
 *  @return NSString with the password.
 */
@property (readonly, nonatomic) NSString * _Nonnull sipPassword;

/**
 *  The domain where the PBX can be found.
 *
 *  @return NSString with the domain.
 */
@property (readonly, nonatomic) NSString * _Nonnull sipDomain;
@optional

/**
 *  When set to YES, the account will be registered on configuration.
 *
 *  Defaults to NO.
 *
 *  @return BOOL is registration should happen.
 */
@property (readonly, nonatomic) BOOL sipRegisterOnAdd;

/**
 *  When set to YES, calls will be dropped after registration fails.
 *
 *  Default is NO.
 *
 *  @return BOOL if call should be dropped if registration fails.
 */
@property (readonly, nonatomic) BOOL dropCallOnRegistrationFailure;

/**
 *  The proxy address where to connect to.
 *
 *  If not set, the sipDomain will be used.
 *
 *  @return NSString with the proxy Address.
 */
@property (readonly, nonatomic) NSString * _Nullable sipProxy;

/**
 * Control the use of STUN for the SIP signaling.
 *
 * Default: PJSUA_STUN_USE_DEFAULT
 */
@property (nonatomic) OMIStunUse sipStunType;

/**
 * Control the use of STUN for the media transports.
 *
 * Default: PJSUA_STUN_RETRY_ON_FAILURE
 */
@property (nonatomic) OMIStunUse mediaStunType;

/**
 *  The ICE Configuration that should be used.
 */
@property (readonly, nonatomic) OMIIceConfiguration * _Nullable iceConfiguration;

/**
 *  The STUN Configuration (dynamic based on network provider).
 */
@property (readonly, nonatomic) OMIStunConfiguration * _Nullable stunConfiguration;

/**
 *  The TURN Configuration (dynamic based on network provider).
 */
@property (readonly, nonatomic) OMITurnConfiguration * _Nullable turnConfiguration;

/**
 * Specify if source TCP port should be used as the initial Contact
 * address if TCP/TLS transport is used. Note that this feature will
 * be automatically turned off when nameserver is configured because
 * it may yield different destination address due to DNS SRV resolution.
 * Also some platforms are unable to report the local address of the
 * TCP socket when it is still connecting. In these cases, this
 * feature will also be turned off.
 *
 *  Default: YES
 */
@property (readonly, nonatomic) BOOL contactUseSrcPort;

/**
 * This option is used to overwrite the "sent-by" field of the Via header
 * for outgoing messages with the same interface address as the one in
 * the REGISTER request, as long as the request uses the same transport
 * instance as the previous REGISTER request.
 *
 *  Default: YES
 */
@property (readonly, nonatomic) BOOL allowViaRewrite;

/**
 * This option is used to update the transport address and the Contact
 * header of REGISTER request. When this option is  enabled, the library
 * will keep track of the public IP address from the response of REGISTER
 * request. Once it detects that the address has changed, it will
 * unregister current Contact, update the Contact with transport address
 * learned from Via header, and register a new Contact to the registrar.
 * This will also update the public name of UDP transport if STUN is
 * configured.
 *
 *  Default: YES
 */
@property (readonly, nonatomic) BOOL allowContactRewrite;

/**
 * Control how Contact update will be done with the registration.
 *
 * Default: OMIContactRewriteMethodAlwaysUpdate
 */
@property (readonly, nonatomic) OMIContactRewriteMethod contactRewriteMethod;

@end // End of the SIPEnabledUser protocol

@interface OMISIPLib : NSObject

/**
 *  If the endpoint is available to use.
 */
@property (readonly, nonatomic) BOOL endpointAvailable;

/**
 * If the endpoint is configured with TLS.
 */
@property (readonly, nonatomic) BOOL hasTLSTransport;

/**
 * If the endpoint is configured to use STUN.
 */
@property (readonly, nonatomic) BOOL hasSTUNEnabled;

/*
 *  The callManager used by the Lib.
 */
@property (readonly, nonatomic) OMICallManager * _Nonnull callManager;

@property (readonly, nonatomic) OMIEndpoint * _Nonnull endpoint;

@property (copy, nonatomic) void (^ _Nonnull onIncomingCall)(__weak OMICall * _Nullable call);

/**
 *  The shared instance for the sip library.
 */
+ (instancetype _Nonnull)sharedInstance;

/**
 *  This will configure the basic Endpoint to use with pjsip.
 *
 *  @param endpointConfiguration Instance of an endpoint configuration.
 *  @param error                 Pointer to NSError pointer. Will be set to a NSError instance if it can't configure the library.
 *
 *  @return success of configuration.
 */
- (void)configureLibraryWithEndPointConfiguration:(OMIEndpointConfiguration * _Nonnull)endpointConfiguration error:(NSError * _Nullable * _Nullable)error;

/**
 *  Pre-warm endpoint to reduce incoming call delay.
 *  Call this method when app launches or when user logs in.
 *  This initializes PJSIP endpoint (including audio device) in advance,
 *  reducing VoIP push → CallKit show time by ~1.5 seconds.
 *
 *  IMPORTANT: This is optional. If not called, endpoint will be initialized
 *  automatically when first call arrives (existing behavior).
 *
 *  @param endpointConfiguration Endpoint configuration to use
 *  @param completion            Called when pre-warming completes (success or failure)
 */
- (void)preWarmEndpointWithConfiguration:(OMIEndpointConfiguration * _Nonnull)endpointConfiguration
                              completion:(void (^_Nullable)(BOOL success, NSError * _Nullable error))completion;

/**
 *  This will create and add a OMIAccount to the Endpoint.
 *
 *  @param sipUser Instance that conforms to SIPEnabledUser protocol.
 *  @param error   Pointer to NSError pointer. Will be set to a NSError instance if it can't create a OMIAccount.
 *
 *  @return OMIAccount the account that was added. It can be null.
 */
- (OMIAccount * _Nullable)createAccountWithSipUser:(__autoreleasing id<SIPEnabledUser> _Nonnull)sipUser error:(NSError * _Nullable * _Nullable)error;

/**
 *  Register the account to the incoming sip proxy for incoming calls.
 *
 *  @param sipUser    Instance that conforms to the SIPEnabledUser protocol.
 *  @param completion Completion block which will be executed when registration has completed or failed. 
 *                    It will return the success of the registration and an account if registration was successfull.
 */
- (void)registerAccountWithUser:(__autoreleasing id<SIPEnabledUser> _Nonnull)sipUser forceRegistration:(BOOL)force withCompletion:(void (^_Nullable)(BOOL success, OMIAccount * _Nullable account))completion;

/*
 *  This will return the first account that is available.
 *
 *  @return OMIAccount instance or null.
 */
- (OMIAccount * _Nullable)firstAccount;

/**
 * OmiID is unique id of call in 2 leg A & B
 */
- (void)setOmiID:(NSString * _Nonnull) omiId callID:(NSInteger) callId;


/**
 * sipNumber is selected number for call out/in
 */
- (void)setSipNumber:(NSString * _Nonnull) sipNumber callID:(NSInteger) callId;
/*
 *
 *  @return current active call.
 */
- (__weak OMICall * _Nullable)getCurrentConfirmCall;
/*
 *  @return Returns all accounts registerd with the EndPoint
 */
- (NSArray * _Nullable)accounts;

/*
 *  @return Returns current active call
 */

- (__weak OMICall * _Nullable )getCurrentCall;

/*
 *  @return Returns newest call incomming or call out
 */
- (__weak OMICall *)getNewestCall;

/**
 *  Set the incoming call block for a incoming call.
 *
 *  @param incomingCallBlock block that will be invoked when an incoming call is setup.
 */
- (void)setIncomingCallBlock:(void(^ _Nonnull )(__weak OMICall * _Nonnull call))incomingCallBlock;

- (BOOL)safelyRemoveSipEndpoint;

/**
 * Set the missed block for when a call is missed.
 *
 *  @param missedCallBlock block that will be invoked when a call is completed elsewhere or has been hungup before pickup 
 */
- (void)setMissedCallBlock:(void(^ _Nonnull )(__weak OMICall * _Nonnull call))missedCallBlock;

/**
 Set the log call back method to do own custom logging.

 @param logCallBackBlock block that will be invoked when a log message is shown.
 */
- (void)setLogCallBackBlock:(void(^ _Nonnull)(DDLogMessage * _Nonnull logMessage))logCallBackBlock;

/**
 *  Get a OMICall with the callId.
 *
 *  @param callId   NSString the callId that needs to be found.
 *  @param sipUser  Instance that conforms to SIPEnabledUser protocol.
 *
 *  @return VSCall instance of OMICall of nil when not found.
 */
- (__weak OMICall * _Nullable)getOMICallWithId:(NSString * _Nonnull)callId andSipUser:(__autoreleasing id<SIPEnabledUser> _Nonnull)sipUser;

/**
 *  Remove the configured endpoint from PJSUA.
 */
- (void)removeEndpoint;
- (void)removeAllAccounts;

/**
 *  This will check if there is another call in progress.
 *
 *  @param call OMICall instance that you want to compare to.
 *
 *  @return BOOL YES if there is a call in progress.
 */
- (BOOL)anotherCallInProgress:(__weak OMICall * _Nonnull)call;

/**
 *  This will update the codec configuration on the SIP endpoint
 *
 *  @param codecConfiguration OMICodecConfiguration Instance of an OMICodecConfiguration
 */
- (BOOL)updateCodecConfiguration:(OMICodecConfiguration * _Nonnull)codecConfiguration;


@end
