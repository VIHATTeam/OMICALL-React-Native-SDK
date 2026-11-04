//
//  OMIAccount.h
//  Copyright © 2015 OMICALL. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "OMIAccountConfiguration.h"

@class OMICall, OMICallManager;

/**
 *  Possible errors the account can return.
 */
typedef NS_ENUM(NSInteger, OMIAccountErrors) {
    /**
     *  Unable to configure the account
     */
    OMIAccountErrorCannotConfigureAccount,
    /**
     *  Unable to call the number
     */
    OMIAccountErrorFailedCallingNumber,
    /**
     *  Unable to register the account
     */
    OMIAccountErrorRegistrationFailed,
    /**
     *  Unable to register the account because account is invalid.
     */
    OMIAccountErrorInvalidAccount,
    /**
     *  When the account has invalid info and registrations fails with a 403.
     */
    OMIAccountErrorRegistrationFailedInvalidAccount
};
#define OMIAccountErrorsString(OMIAccountErrors) [@[@"OMIAccountErrorCannotConfigureAccount", @"OMIAccountErrorFailedCallingNumber", @"OMIAccountErrorRegistrationFailed", @"OMIAccountErrorInvalidAccount", @"OMIAccountErrorRegistrationFailedInvalidAccount"] objectAtIndex:OMIAccountErrors]

/**
 *  Possible states for an account.
 */
typedef NS_ENUM(NSInteger, OMIAccountState) {
    /**
     *  Account isn't added to the endpoint
     */
    OMIAccountStateOffline,
    /**
     *  Account is connecting with endpoint
     */
    OMIAccountStateConnecting,
    /**
     *  Account is connected with endpoint
     */
    OMIAccountStateConnected,
    /**
     *  Account is disconnected from endpoint
     */
    OMIAccountStateDisconnected,
};
#define OMIAccountStateString(OMIAccountState) [@[@"OMIAccountStateOffline", @"OMIAccountStateConnecting", @"OMIAccountStateConnected", @"OMIAccountStateDisconnected"] objectAtIndex:OMIAccountState]

/**
 *  Completionblock that will be called after the account was registered.
 *
 *  @param success BOOL will indicate the success of the registration.
 *  @param error   NSError instance with possible error. Can be nil.
 */
typedef void (^RegistrationCompletionBlock)(BOOL success, NSError * _Nullable error);

@interface OMIAccount : NSObject

/**
 *  The accountId which an account receives when it is added.
 */
@property (nonatomic) NSInteger accountId;

/**
 *  The current state of an account.
 */
@property (readonly, nonatomic) OMIAccountState accountState;

/**
 *  The current SIP registration status code.
 */
@property (readonly, nonatomic) NSInteger registrationStatus;

/**
 *  A Boolean value indicating whether the account is registered.
 */
@property (readonly, nonatomic) BOOL isRegistered;

/**
 *  An up to date expiration interval for the account registration session.
 */
@property (readonly, nonatomic) NSInteger registrationExpiresTime;

/**
 *  The account configuration that has been set in the configure function for the account.
 */
@property (readonly, nonatomic) OMIAccountConfiguration * _Nonnull accountConfiguration;

@property (readwrite, nonatomic) BOOL forceRegistration;

/**
 * This init is not available.
 */
-(instancetype _Nonnull)init __attribute__((unavailable("init not available")));

/**
 * Designated initializer
 *
 * @param callManager A instance of OMICallManager.
 */
-(instancetype _Nonnull)initWithCallManager:(OMICallManager * _Nonnull)callManager;

/**
 *  This will configure the account on the endpoint.
 *
 *  @param accountConfiguration Instance of the OMIAccountConfiguration.
 *  @param error                Pointer to NSError pointer. Will be set to a NSError instance if cannot configure account.
 *
 *  @return BOOL success of configuration.
 */
- (BOOL)configureWithAccountConfiguration:(OMIAccountConfiguration * _Nonnull)accountConfiguration error:(NSError * _Nullable * _Nullable)error;

/**
 *  Register the account with pjsua.
 *
 *  @param completion RegistrationCompletionBlock, will be called with success of registration and possible error.
 */
- (void)registerAccountWithCompletion:(_Nullable RegistrationCompletionBlock)completion;

/**
 *  Ensure ICE/NAT configuration is properly set for this account.
 *  This should be called before processing incoming calls to ensure NAT traversal works.
 *
 *  The method checks if STUN/TURN/ICE config is already set and updates only if needed.
 *  This prevents redundant updates while ensuring incoming calls have proper NAT configuration.
 */
- (void)ensureIceConfigUpdated;

/**
 *  Unregister the account if registered.
 *
 *  If an account isn't registered, there will be no unregister message sent to the proxy, and will return success.
 *
 *  @param error Pointer to NSError pointer. Will be set to a NSError instance if cannot register the account.
 *
 *  @return BOOL success if account is no longer registered
 */
- (BOOL)unregisterAccount:(NSError * _Nullable * _Nullable)error;

/**
 *  Will unregister the account and will re-register the account once the account
 *  state reaches "unregistered".
 */
- (void)reregisterAccount;

/**
 *  This will remove the account from the Endpoint and will also de-register the account from the server.
 */
- (void)removeAccount;

/**
 *  This will set the state of the account. Based on the pjsua account state and the OMIAccountState enum.
 */
- (void)accountStateChanged;


/**
 *  This will add the call to the account.
 *
 *  @param call The call instance that should be added.
 */
- (void)addCall:(__weak OMICall * _Nonnull)call __attribute__((unavailable("Deprecated, use OMICallManager -addCall: instead")));

/**
 *  This will check if there is a call present on this account given the callId.
 *
 *  @param callId The callId of the call.
 *
 *  @return OMICall instance.
 */
- (__weak OMICall * _Nullable)lookupCall:(NSInteger)callId;

/**
 *  This will remove the call from the account.
 *
 *  @param call OMICall instance that should be removed from the account.
 */
- (void)removeCall:(__weak OMICall * _Nonnull)call __attribute__((unavailable("Deprecated, use OMICallManager -removeCall: instead")));;

/**
 *  Remove all calls connected to account.
 */
- (void)removeAllCalls;

/**
 *  Get the first call available to this account.
 *
 *  @return OMICall instance can also return nil.
 */
- (__weak OMICall * _Nullable)firstCall;

/**
 *  Get the first active call available to this account.
 *
 *  @return OMICall instance can also return nil.
 */
- (__weak OMICall * _Nullable)firstActiveCall;

/**
 *  Variable used to store state, if transportTCPDefaultFail initialization TCP = TRUE, this time it will initialize with UDP
 */
@property (nonatomic) Boolean transportTCPDefaultFail;

@property (nonatomic) Boolean isActiveBackground;


@end
