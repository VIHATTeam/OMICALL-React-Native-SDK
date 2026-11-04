//
//  OmiClient.h
//  Copyright © 2022 OMICALL. All rights reserved.
//

#import "OmiConsult.h"
#import <Foundation/Foundation.h>
#import "OMISIPLib.h"
#import "Constants.h"
#import <AVFoundation/AVFoundation.h>


@class OMICallInfo, OMICallInfoItem;
@interface OmiClient : NSObject

#pragma mark - On-premise configuration

/**
 * Configure on-premise endpoints. Call ONCE in `didFinishLaunchingWithOptions`
 * BEFORE any `initWith...` call.
 *
 * Each parameter is OPTIONAL: pass the customer-provided value to override the
 * SDK default; pass `nil` (or empty string) to keep the SDK default.
 *
 * SDK swaps only the scheme+host of internal endpoint URLs — path and query
 * params are preserved 100%.
 *
 * Persisted in NSUserDefaults so the config survives app relaunch.
 *
 * Example (Chailease):
 * @code
 * [OmiClient setOnPremiseInfoWithMobileSdkHost:@"omisdk-v1-stg-callcenter.chailease.com.vn"
 *                                callEventHost:@"call-event-v2-stg-callcenter.chailease.com.vn"
 *                                publicApiHost:@"public-v1-stg-callcenter.chailease.com.vn"
 *                                 pushInfoHost:@"push-info-v2-stg-callcenter.chailease.com.vn"
 *                                  app2AppHost:@"app-2-app-stg-callcenter.chailease.com.vn"
 *                                logUploadHost:@"elastic-v2-stg-callcenter.chailease.com.vn"
 *                                     sipProxy:@"sig-callcenter.chailease.com.vn:5222"
 *                                   stunServer:@"stun-callcenter.chailease.com.vn:3478"
 *                                   turnServer:@"turn-callcenter.chailease.com.vn:2222"
 *                                 turnUsername:nil
 *                                 turnPassword:nil];
 * @endcode
 *
 * @param mobileSdkHost  Replaces omisdk-v1-stg.omicrm.com (devices, extensions, network info, ICE provider, rtp log)
 * @param callEventHost  Replaces call-event-v2-stg.omicrm.com (call-action APIs)
 * @param publicApiHost  Replaces public-v1-stg.omicrm.com (init call API)
 * @param pushInfoHost   Replaces push-info-v2-stg.omicrm.com (has-answered)
 * @param app2AppHost    Replaces app-2-app-stg.omicrm.com (agent/customer login)
 * @param logUploadHost  Replaces elastic-v2-stg.omicrm.com (log upload)
 * @param sipProxy       SIP proxy "host:port" (nil = SDK default)
 * @param stunServer     STUN "host:port" (nil = SDK default)
 * @param turnServer     TURN "host:port" (nil = SDK default)
 * @param turnUsername   TURN username (nil = SDK default)
 * @param turnPassword   TURN password (nil = SDK default)
 */
+ (void)setOnPremiseInfoWithMobileSdkHost:(NSString *_Nullable)mobileSdkHost
                            callEventHost:(NSString *_Nullable)callEventHost
                            publicApiHost:(NSString *_Nullable)publicApiHost
                             pushInfoHost:(NSString *_Nullable)pushInfoHost
                              app2AppHost:(NSString *_Nullable)app2AppHost
                            logUploadHost:(NSString *_Nullable)logUploadHost
                                 sipProxy:(NSString *_Nullable)sipProxy
                               stunServer:(NSString *_Nullable)stunServer
                               turnServer:(NSString *_Nullable)turnServer
                             turnUsername:(NSString *_Nullable)turnUsername
                             turnPassword:(NSString *_Nullable)turnPassword;

/**
 * Clear all on-premise overrides — revert SDK to default endpoints/STUN/TURN/proxy.
 */
+ (void)clearOnPremiseInfo;

/**
 *  Init user name/password for endpoint, ussually this step need to be init
 * when app open firstime or login
 *  @Param usrUuid This is unique id of user
 *  @Param fullName is user not exits it will create new user with this name
 *  @Param apiKey this key From omicall, help we can authen request from
 * SDK
 */
+ (BOOL)initWithUUID:(NSString *_Nonnull)usrUuid
            fullName:(NSString *_Nullable)fullName
            apiKey:(NSString *_Nonnull)apiKey;

+ (BOOL)initWithUUIDAndPhone:(NSString *_Nonnull)usrUuid
            fullName:(NSString *_Nullable)fullName
            apiKey:(NSString *_Nonnull)apiKey
            phone: (NSString *_Nonnull)phone;

+ (void)initWithUsername:(NSString *_Nonnull)userName
                password:(NSString *_Nonnull)password
                   realm:(NSString *_Nonnull)realm
                   proxy:(NSString *_Nonnull)proxy;

/**
 * Initialize with username/password and optional skip devices flag.
 * Use this method when you need to skip device registration API call.
 *
 * @param userName SIP username
 * @param password SIP password
 * @param realm SIP realm/domain
 * @param proxy SIP proxy server
 * @param isSkipDevices If YES, skip device registration API (https://omisdk-v1-stg.omicrm.com/mobile_sdk/internal_phone/devices/add)
 *                      If NO (default), call API normally
 *
 * Example:
 * // Skip device registration API
 * [OmiClient initWithUsername:@"user"
 *                    password:@"pass"
 *                       realm:@"realm"
 *                       proxy:@"proxy"
 *              isSkipDevices:YES];
 */
+ (void)initWithUsername:(NSString *_Nonnull)userName
                password:(NSString *_Nonnull)password
                   realm:(NSString *_Nonnull)realm
                   proxy:(NSString *_Nonnull)proxy
          isSkipDevices:(BOOL)isSkipDevices;

/**
 *  call this function when user logout to prevent notification came to this
 * device without login
 *
 */
+ (void)logout;

/**
 *  Logout with completion callback.
 *  Use this when you need to login again immediately after logout.
 *
 *  @param completion Called on main thread when logout finishes. success=YES if API call succeeded.
 *                    Pass nil to fire-and-forget (same behavior as logout).
 *
 *  Example:
 *  [OmiClient logoutWithCompletion:^(BOOL success) {
 *      [OmiClient initWithUUID:... fullName:... ...];
 *  }];
 */
+ (void)logoutWithCompletion:(void (^ _Nullable)(BOOL success))completion;

/**
 *  Start Service OMI - in Most case User ussually dont call this function
 */
+ (BOOL)startOmiService:(BOOL)isVideo;

/**
 *  Pre-warm the SIP endpoint to reduce call setup time.
 *  Call this method early (e.g., at app launch or user login) to initialize
 *  the PJSIP stack in the background. This avoids ~3-4 second delay when making
 *  the first call, as video subsystem initialization happens ahead of time.
 *
 *  @param completion Callback with success status and any error that occurred.
 *
 *  Example usage:
 *  - Call in AppDelegate didFinishLaunchingWithOptions
 *  - Or call after user successfully logs in
 *
 *  Note: If endpoint is already initialized, this method returns immediately with success.
 */
+ (void)preWarmEndpointWithCompletion:(void (^_Nullable)(BOOL success, NSError *_Nullable error))completion;

/**
 *  Check if network is available (WiFi or Cellular)
 */
+ (BOOL)isNetworkAvailable;

/**
 *  Start call with option video call
 */
+ (void)startCall:(NSString *_Nonnull) toNumber isVideo:(BOOL) isVideo result: (void (^)(OMIStartCallStatus status)) completion;
/**
 *  Get phone number from UUID
 */
+ (NSString *)getPhone:(NSString *_Nonnull)toUuid;

+ (id)getAccountInfo:(NSString *_Nonnull)sipAccount;

/**
 *  Fetch OMI devices info for the current user from server
 *  @return NSArray of device dictionaries; empty array if no data or on error
 */
+ (NSArray<NSDictionary *> *_Nonnull)getOmiDevices;

/**
 *  Check whether the current device is already registered on the backend
 *  for the current SIP user.
 *  @return YES if a matching device_id exists in the fetched device list.
 */
+ (BOOL)isCurrentDeviceRegistered;

/**
 *  Determine whether the user should be forced to logout and login again.
 *  Returns YES when a SIP user is set locally but no matching device is
 *  registered on the backend (e.g. backend state was lost, app reinstalled,
 *  or device info diverged).
 *  @return YES if re-login is required, NO otherwise.
 */
+ (BOOL)needsReLogin;

#pragma mark - CallKit Display Name

/**
 *  Set a display name for a phone number / userId. The SDK will use this
 *  name when reporting the call to CallKit (lockscreen, banner, in-call UI)
 *  instead of the raw value. Typical use case: resolve a Zalo userId to a
 *  human-friendly name and inject it before/after the call is reported.
 *
 *  @param displayName  Human-friendly name. Pass nil/empty to clear the mapping.
 *  @param phoneNumber  Phone number or userId the name applies to.
 */
+ (void)setDisplayName:(NSString * _Nullable)displayName
              forPhone:(NSString * _Nonnull)phoneNumber;

/**
 *  Set a display name bound to a specific call UUID. Takes priority over
 *  the phone-number mapping. Use this when the app fetched the name AFTER
 *  CallKit was already reported (typical Zalo VoIP-push flow) — the SDK
 *  will push a CXCallUpdate to refresh the name on lockscreen.
 *
 *  @param displayName  Human-friendly name. Pass nil/empty to clear the mapping.
 *  @param uuid         Call UUID returned by the SDK / push payload.
 */
+ (void)setDisplayName:(NSString * _Nullable)displayName
           forCallUUID:(NSUUID * _Nonnull)uuid;

/// Remove the display-name mapping for one phone number.
+ (void)removeDisplayNameForPhone:(NSString * _Nonnull)phoneNumber;

/// Remove the display-name mapping for one call UUID.
+ (void)removeDisplayNameForCallUUID:(NSUUID * _Nonnull)uuid;

/// Wipe every display-name mapping. Typically called on logout.
+ (void)clearAllDisplayNames;

/**
 *  Start call with Uuid (use for api key)
 */
+ (void)startCallWithUuid:(NSString * _Nonnull) toUuid isVideo: (BOOL) isVideo result: (void (^)(OMIStartCallStatus status)) completion;
/**
 *  Answer by function call, dont neet user interactive with callkit
 */
+ (void)answerIncommingCall:(NSUUID *)uuid;

/**
 *  Remove one call by UUID
 */
+ (void)removeCallByUUid:(NSUUID *_Nonnull)uuid;
/**
 *  Remove all call exept this call
 */
+ (void)removeCallExcepCall:(NSUUID *_Nonnull)uuid;

/**
 *  Register the sip account with the endpoint.
 *
 *  @return BOOL YES if the registration was a success.
 */
+ (void)registerSIPAccountWithEndpointWithCompletion:
    (void (^_Nonnull)(BOOL success, OMIAccount *_Nullable account))completion;

/**
 *  Get a OMICall instance based on a callId.
 *
 *  @param callId NSString with the callId that needs the be found.
 *
 *  @return OMICall instance or nil.
 */
+ (__weak OMICall *_Nullable)getCallWithId:(NSString *_Nonnull)callId
    __attribute__((unavailable(
        "Deprecated, use OMICallManager -callWithCallId: instead")));

/**
 *  Check if there is another call in progress.
 *
 *  @param receivedCall OMICall instance of the call that is incoming.
 *
 *  @return BOOL YES if there is another call in progress.
 */
+ (BOOL)anotherCallInProgress:(__weak OMICall *_Nonnull)receivedCall;

/**
 *  Get the first active call.
 *
 *  @return A OMICall instance or nil.
 */
+ (__weak OMICall *_Nullable)getCurrentConfirmCall;

/**
 *  The codec configuration that is going to be used.
 *
 *  @return a OMICodecConfiguration instance.
 */
+ (OMICodecConfiguration *_Nonnull)codecConfiguration;

/**
 *Set Enviroment for product
 *PRODUCTION = 1;
 *SANDBOX = 2;
 */

+ (void)setEnviroment:(NSString *_Nonnull)enviroment userNameKey: (NSString *) userNameKey maxCall: (int) maxCall callKitImage: (NSString*) callKitImage typePushVoip:(NSString *)typePushVoip;

+  (void) setEnviroment:(NSString *) enviroment userNameKey: (NSString *) userNameKey maxCall: (int) maxCall callKitImage: (NSString*) callKitImage typePushVoip: (NSString *)typePushVoip representName: (NSString *)representName;

/**
 * Used to set your projectId of Firebase project for OMI. This is important, because we need to know to properly push incoming calls according to your project Id.
 *
 * Params:
 * - projectId: NSString*
 */
+ (void) setFcmProjectId:(NSString * _Nonnull) projectId;

/**
 *Check and remove voip token on my server.
 */
+ (void) checkVoipToken:(NSString * _Nonnull) voipToken;

/**
 *Use to set APNS Normal push notification by application
 *This push notification will use to make SDK able to push cancel call, chat,
 *another infomation
 */
+ (void)setUserPushNotificationToken:(NSString *)token;
/**
 *Use this function to set love level 0 - 5
 *  1 - OMILogVerbose
 *  2 - OMILogDebug
 *  3 - OMILogInfo
 *  4 - OMILogWarning
 *  5 - OMILogError

 */
+ (void)setLogLevel:(int)level;

/**
 * Dev/proxy mode. When set to YES, the SDK does NOT apply the STUN/TURN/proxy
 * values returned by the dynamic `network-ice-provider/list` API — it behaves
 * like on-premise in that respect, so your own custom proxy/ICE config is not
 * overwritten by the server response. Default is NO (dynamic API applied, normal
 * cloud behaviour). Call this BEFORE login / init if you need it.
 * @param value YES to skip applying the dynamic ICE-provider list, NO for default.
 */
+ (void)setProxyDev:(BOOL)value;

/**
 * Current value of the dev/proxy mode set via `setProxyDev:`. Defaults to NO.
 */
+ (BOOL)isProxyDev;

/**
 *Use to change information of Call in Callkit like CallerName, Caller Number
 * @Param: call: object call need to update
 */
+ (void)reportIncomingCall:(OMICall *_Nonnull)call;

/**
 *Use to set output sound for call
 * @Param: output: Outut need to request
 */
+ (void)setOutput:(NSString *_Nonnull)output;
/**
 *Use to get list of output sound devices
 * @Param:
 * @return: list String name of output device
 */
+ (NSMutableArray<NSString *> *)getListOutputDevices;

/**
 *  state using noise cancel. Notice that user will slow down or add latency
 * with noise cancel
 *
 */
+ (void)setNoiseSuppression:(BOOL)isUseNoiseSuppression;

/**
 * Set the missed block for when a call is missed.
 *
 *  @param missedCallBlock block that will be invoked when a call is completed elsewhere or has been hungup before pickup
 */
+ (void)setMissedCallBlock:(void(^ _Nonnull )(__weak OMICall * _Nonnull call))missedCallBlock;

/**
 * get current user sip
 */
+ (NSString *_Nullable)getCurrentSip;

/**
 * get user sip info
 */
+ (NSString *_Nullable)getSipInfo;


/**
 * get all audios in your device
 */
+ (NSArray<NSDictionary<NSString *, NSString *> *> *_Nonnull) getAudioInDevices;

/**
 * get current audio in device
 */
+ (NSArray<NSDictionary<NSString *, NSString *> *> *_Nonnull) getCurrentAudio;


/**
 * set audio output/input
 */
+ (void)setAudioOutputs:(NSString *_Nonnull)portType;

+ (int)getLogLevel;

/**
 * Upload the SDK log after EVERY call of the listed accounts, including calls that end
 * normally (same as Android SDK setLogWhitelist). By default the log is only uploaded on
 * specific failures, so quality problems on calls that still end with 200 (no audio,
 * frozen video) never get a log.
 *
 * Each entry is case-insensitive and can be:
 *   - `sip_domain` or `domain_sip` (e.g. `101_it51` / `it51_101`): one account;
 *   - `domain` (e.g. `it51`): every account of that domain.
 *
 * The app decides where the list comes from (its backend, Firebase Remote Config, ...).
 * With Remote Config, fetch it once per launch with the default 12 h cache.
 * Pass nil or an empty array to turn it off. The list is persisted across launches.
 *
 * Privacy: the log contains the remote party's number — enable only for internal
 * accounts or customers who agreed.
 *
 * @code
 * [OmiClient setLogWhitelist:@[@"it51_101", @"nnpanda0410"]];
 * @endcode
 */
+ (void)setLogWhitelist:(NSArray<NSString *> *_Nullable)accounts;

/// YES when the logged-in account matches an entry of setLogWhitelist:.
+ (BOOL)isLogWhitelisted;

+ (void)sendLogRTPCall:(OMICallInfoItem *_Nonnull)_OMICallInfoItem;

+ (void)handleEndpointNotAvailable:(NSString *)toNumber isVideo:(BOOL)isVideo retry:(int)retryTimes isFirstCall:(BOOL)isFirstCall result:(void (^)(OMIStartCallStatus status))completion;

+ (void)handleExistingEndpoint:(NSString *)toNumber isVideo:(BOOL)isVideo retry:(int)retryTimes isFirstCall:(BOOL)isFirstCall result:(void (^)(OMIStartCallStatus status))completion;

/**
 Close all active calls. Use when user kills app or wants to end everything.
 WARNING: This ends ALL calls. For multi-call scenarios, use endCallWithUUID: instead.
 */
+ (void) OMICloseCall;

/**
 End a specific call by UUID. Safe for multi-call scenarios.
 - Call 1 active + Call 2 incoming → endCallWithUUID:call2UUID → only call 2 ends, call 1 continues.
 - Call 1 active + Call 2 incoming → endCallWithUUID:call1UUID → only call 1 ends.
 @param uuid The UUID of the call to end (from OMICall.uuid or notification userInfo).
 */
+ (void)endCallWithUUID:(NSUUID * _Nonnull)uuid;

/**
 End current active call and answer incoming call.
 Typical flow: User on Call 1, Call 2 rings → user taps "End & Answer" →
 Call 1 hangs up, Call 2 answers after 500ms delay (PJSIP cleanup time).
 @param currentCallUUID UUID of the call to end (Call 1).
 @param incomingCallUUID UUID of the call to answer (Call 2).
 */
+ (void)endCall:(NSUUID * _Nonnull)currentCallUUID andAnswerCall:(NSUUID * _Nonnull)incomingCallUUID;

/**
 Get all active calls info for UI display (multi-call scenarios).
 @return Array of NSDictionary with keys: uuid, state, phone, incoming, isVideo, isOnHold, isConsult.
 Returns empty array if no calls.
 */
+ (NSArray<NSDictionary *> * _Nonnull)getAllActiveCalls;

// ═══════════════════════════════════════════════════════════════════════
// Consult (attended) transfer — same names and behaviour as the Android SDK 2.9.1.
// Events: OMIConsultStateChangedNotification, OMITransferStatusNotification,
// OMICallHoldChangedNotification (see OmiConsult.h). CallKit shows the consult as a second
// call (the SDK allows it for the consult even when maxCall is 1).
// ═══════════════════════════════════════════════════════════════════════

/**
 Hold the customer (CONFIRMED audio call) and call `extension`. The INVITE carries
 X-Original-Caller and X-Parent-Call-ID (SDK values override `extraHeaders`).
 @param callback called on the main queue with the start status.
 */
+ (void)startConsultCall:(NSString * _Nonnull)extension
            extraHeaders:(NSDictionary<NSString *, NSString *> * _Nullable)extraHeaders
                callback:(void (^ _Nullable)(OmiConsultStartStatus status))callback
    NS_SWIFT_NAME(startConsultCall(_:extraHeaders:callback:));

/**
 Consult answered: hang up the consult, then blind-transfer the customer to the same extension
 (`extraHeaders` go on the REFER). The customer is taken off hold if the transfer fails or has no
 result within 30 s. Returns NO when the consult is not answered or the customer already ended.
 */
+ (BOOL)completeConsultTransfer:(NSDictionary<NSString *, NSString *> * _Nullable)extraHeaders
    NS_SWIFT_NAME(completeConsultTransfer(_:));

/// End the consult and take the customer off hold. Hanging up the customer is not a cancel.
+ (BOOL)cancelConsult;
+ (BOOL)isConsulting;
/// The customer hung up while the consult is still running (complete is refused then).
+ (BOOL)isConsultOriginalEnded;
/// Live calls with hold state and the consult flag, sorted by call id.
+ (NSArray<OmiCallSummary *> * _Nonnull)getActiveCalls;


// isPartialPhoneNumber lưu trữ giá trị ẩn hay hiện thị số điện thoại ở callkit
+ (void)setIsPartialPhoneNumber:(BOOL)value;

// isPartialPhoneNumber lưu trữ giá trị ẩn hay hiện thị số điện thoại ở callkit
+ (BOOL)isPartialPhoneNumber;

/// Set the masking style used by the SDK when displaying a phone number on
/// CallKit. Only takes effect when `isPartialPhoneNumber` is YES. Default is
/// `OMIPhoneMaskPolicyKeepLeading3`, which matches the previous SDK behavior.
+ (void)setPhoneMaskPolicy:(OMIPhoneMaskPolicy)policy;

/// Current SDK masking policy. Defaults to `OMIPhoneMaskPolicyKeepLeading3`
/// when the app has never set one.
+ (OMIPhoneMaskPolicy)phoneMaskPolicy;

/**
 * Kiểm tra cuộc gọi có được trả lời hay không.
 * @param callId ID của cuộc gọi cần kiểm tra
 * @return YES nếu cuộc gọi đã trả lời, NO nếu cuộc gọi bị hủy hoặc không được trả lời.
 */
+ (BOOL)checkHasAnsweredCall:(NSString * _Nonnull)callId;

/**
 * Cấu hình hành vi từ chối cuộc gọi.
 * @param useBusyHere YES để sử dụng mã 486 (BUSY_HERE), NO để sử dụng mã 603 (DECLINE)
 */
+ (void)configureDeclineCallBehavior:(BOOL)useBusyHere;

/**
 * Từ chối và kết thúc cuộc gọi trên tất cả thiết bị.
 * @param uuid UUID của cuộc gọi cần drop
 */
+ (void)dropCall:(NSUUID *_Nonnull)uuid;

/**
 * Cập nhật hành động cuộc gọi (như HANGUP, ANSWERED, TRANSFER) và kết thúc cuộc gọi trên tất cả thiết bị.
 *
 * @param eventCall   Sự kiện cuộc gọi, ví dụ: @"HANGUP", @"ANSWERED", @"TRANSFER"
 * @param callId      omiCall id của cuộc gọi cần xử lý
 * @param isIncoming   Hướng cuộc gọi isCommingCall thì true
 * @param dest        Thiết bị đích khi chuyển tiếp cuộc gọi
 * @param phoneNumber Số điện thoại liên quan đến cuộc gọi
 * @param sipNumber   Số SIP của người dùng
 *
 * @return YES nếu gửi thành công, NO nếu có lỗi.
 */
+ (BOOL)updateActionCall:(NSString * _Nonnull)eventCall
                  callId:(NSString * _Nonnull)callId
              isIncoming:(BOOL * _Nonnull)isIncoming
                    dest:(NSString * _Nonnull)dest
             phoneNumber:(NSString * _Nonnull)phoneNumber
               sipNumber:(NSString * _Nonnull)sipNumber;

/**
 * Kiểm tra domain fussion có cấu hình
 */
+ (void)checkHasConfig;


/**
 * Kiểm tra có nên show cuộc gọi nhỡ hay không
 * @param callId ID của cuộc gọi cần kiểm tra
 * @return YES là có show cuộc gọi nhỡ, NO không show cuộc gọi nhỡ
 */
+ (BOOL)checkHasShowMissedCall:(NSString * _Nonnull)callId;


/**
 * Kiểm tra giá trị từ backend có nên show cuộc gọi nhỡ hay không
 * @param value: ANSWERED, TRANSFERRED, HUNG_UP, UNKNOWN
 * @return YES nếu value là UNKNOWN, NO nếu là ANSWERED, TRANSFERRED, HUNG_UP
 */
+ (BOOL)checkPayloadShowMissCall:(NSString * _Nonnull)value;

/**
 *  Get phone number from UUID with callback completion
 */
+ (void)getPhone:(NSString *_Nonnull)toUuid completion:(void (^)(NSString * _Nullable phone))completion;

/**
 * Fetch network information from server
 */
+ (void)fetchNetworkInfo;

/**
 * Fetch ICE provider list from server
 */
+ (void)fetchProviderList;

/**
 * Apply dynamic STUN/TURN/Proxy configuration based on current network
 */
+ (void)applyDynamicConfiguration;

/**
 * Get fallback proxy IP for retry when DNS fails
 * @return Fallback IP with port :5222, or nil if not available
 */
+ (NSString * _Nullable)getFallbackProxyIP;

/**
 * Test helper: Override network name for testing ICE provider matching
 * @param networkName The test network name (e.g., "fpt" to match FPT provider)
 * Usage: [OmiClient setTestNetworkName:@"fpt"];
 */
+ (void)setTestNetworkName:(NSString * _Nonnull)networkName;

/**
 * Test helper: Clear network name override
 * Usage: [OmiClient clearTestNetworkName];
 */
+ (void)clearTestNetworkName;

#pragma mark - Device Info Getters

/**
 * Get Firebase Cloud Messaging project ID
 * @return Project ID or empty string if not set
 */
+ (NSString * _Nonnull)getProjectId;

/**
 * Get application bundle identifier
 * @return Bundle identifier or empty string
 */
+ (NSString * _Nonnull)getAppId;

/**
 * Get unique device identifier (vendor UUID)
 * @return Device ID in lowercase or empty string
 */
+ (NSString * _Nonnull)getDeviceId;

/**
 * Get FCM (Firebase Cloud Messaging) token for push notifications
 * @return FCM token or empty string if not set
 */
+ (NSString * _Nonnull)getFcmToken;

/**
 * Get VoIP push token (iOS PushKit)
 * @return VoIP token or empty string if not set
 */
+ (NSString * _Nonnull)getVoipToken;

/**
 * Get current SIP extension/username
 * @return SIP username or empty string if not logged in
 */
+ (NSString * _Nonnull)getSipExtension;

/**
 * Get current user UUID
 * @return User UUID or empty string if not set
 */
+ (NSString * _Nonnull)getUserUuid;

/**
 * Get all device info as dictionary for easy access
 * @return Dictionary with all device info parameters
 *
 * Dictionary keys:
 * - projectId: Firebase project ID
 * - appId: Application bundle identifier
 * - deviceId: Unique device identifier
 * - fcmToken: FCM push token
 * - voipToken: VoIP push token
 * - sipExtension: Current SIP username
 * - userUuid: Current user UUID
 *
 * Example:
 * NSDictionary *info = [OmiClient getDeviceInfo];
 * NSLog(@"Device ID: %@", info[@"deviceId"]);
 * NSLog(@"FCM Token: %@", info[@"fcmToken"]);
 */
+ (NSDictionary * _Nonnull)getDeviceInfo;

#pragma mark - Agent/Customer Login Flow

/**
 * Set authentication token for Agent/Customer login flows.
 * MUST be called before loginAgent or loginCustomer.
 *
 * @param token Bearer token from your backend authentication
 *
 * Example:
 * [OmiClient setAuthen:@"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."];
 */
+ (void)setAuthen:(NSString * _Nonnull)token;

/**
 * Login with Agent extension flow.
 * Calls Agent API endpoint and initializes SIP with provided credentials.
 *
 * @param uuid Agent UUID
 * @param domain Agent domain (SIP realm)
 * @param sipUser SIP username (extension number)
 * @param password SIP password
 * @param completion Callback with success status and error (if any)
 *
 * Example:
 * [OmiClient loginAgent:@"agent-123"
 *                domain:@"sip.example.com"
 *               sipUser:@"11111112"
 *              password:@"secret"
 *            completion:^(BOOL success, NSError *error) {
 *     if (success) {
 *         NSLog(@"Agent login successful");
 *     } else {
 *         NSLog(@"Agent login failed: %@", error.localizedDescription);
 *     }
 * }];
 */
+ (void)loginAgent:(NSString * _Nonnull)uuid
            domain:(NSString * _Nonnull)domain
           sipUser:(NSString * _Nonnull)sipUser
          password:(NSString * _Nonnull)password
        completion:(void (^ _Nullable)(BOOL success, NSError * _Nullable error))completion;

/**
 * Logout from Agent extension flow.
 * Calls Agent logout API and clears session.
 *
 * @param completion Callback with success status and error (if any)
 *
 * Example:
 * [OmiClient logoutAgent:^(BOOL success, NSError *error) {
 *     if (success) {
 *         NSLog(@"Agent logout successful");
 *     }
 * }];
 */
+ (void)logoutAgent:(void (^ _Nullable)(BOOL success, NSError * _Nullable error))completion;

/**
 * Login with Customer extension flow.
 * Calls Customer API endpoint and initializes SIP with provided credentials.
 *
 * @param uuid Customer UUID
 * @param domain Customer domain (SIP realm)
 * @param sipUser SIP username (extension number)
 * @param password SIP password
 * @param completion Callback with success status and error (if any)
 *
 * Example:
 * [OmiClient loginCustomer:@"customer-456"
 *                   domain:@"sip.example.com"
 *                  sipUser:@"22222223"
 *                 password:@"secret"
 *               completion:^(BOOL success, NSError *error) {
 *     if (success) {
 *         NSLog(@"Customer login successful");
 *     } else {
 *         NSLog(@"Customer login failed: %@", error.localizedDescription);
 *     }
 * }];
 */
+ (void)loginCustomer:(NSString * _Nonnull)uuid
               domain:(NSString * _Nonnull)domain
              sipUser:(NSString * _Nonnull)sipUser
             password:(NSString * _Nonnull)password
           completion:(void (^ _Nullable)(BOOL success, NSError * _Nullable error))completion;

/**
 * Logout from Customer extension flow.
 * Calls Customer logout API and clears session.
 *
 * @param completion Callback with success status and error (if any)
 *
 * Example:
 * [OmiClient logoutCustomer:^(BOOL success, NSError *error) {
 *     if (success) {
 *         NSLog(@"Customer logout successful");
 *     }
 * }];
 */
+ (void)logoutCustomer:(void (^ _Nullable)(BOOL success, NSError * _Nullable error))completion;


@end
