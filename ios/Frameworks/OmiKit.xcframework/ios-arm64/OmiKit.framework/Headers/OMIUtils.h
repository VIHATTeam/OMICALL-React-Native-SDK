//
//  OMIUtils.h
//  Copyright © 2016 OMICALL. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <CallKit/CallKit.h>

@interface OMIUtils : NSObject

/**
 *  This will configure the basic Endpoint to use with pjsip.
 *
 *  @param endpointConfiguration Instance of an endpoint configuration.
 *  @param error                 Pointer to NSError pointer. Will be set to a NSError instance if it can't configure the library.
 *
 *  @return success of configuration.
 */

/**
 *  This will clean the input phone number from characters that cannot be used when setting up a call.
 *
 *  @param phoneNumber Phone number that needs to be cleaned.
 *
 *  @return the cleaned phone number.
 */
+ (NSString *_Nullable)cleanPhoneNumber:(NSString *_Nonnull)phoneNumber;

+ (NSString*) getOmiID;
+ (int)getAvailableBandwidth ;
+ (BOOL)isPhoneNumber:(NSString *)name;
+ (NSString *)formatPhoneNumber:(NSString *)name;
+ (void)saveProxy:(NSString *)proxy;
+ (NSString *)getProxy;
+ (BOOL)lookupSipHeaders:(NSString *) textFind textPosition:(NSString *) textPosition sipMessage:(NSString *) sipMessage;
+ (void)delayActionAfterTime:(NSInteger ) numberSecond completion:(void (^)(void))completion;
/*
 Find the method: INVITED, REGISTER from the sip string
 */
+ (NSString *)getMethodFromSIPMessage:(NSString *)sipMessage;
/*
 Find the UUID from Sip Message
 */
+ (NSString *)findAndCutUUIDFromSipMessages:(NSString *)sipMessage;


/*
 Find and cut sip number from message
 */
+ (NSString *)findAndCutSipNumberFromSipMessages:(NSString *)sipMessage;

/*
 Find IP and cut ip from proxy
 */
+(NSString *)extractIPAddress:(NSString * _Nonnull)inputString;


/*
 Find phone number and hide with *
 */
+ (NSString *)maskedPhoneNumberOrName:(NSString *)inputString;

/*
 Update UI CallKit
 */
+ (CXCallUpdate *)prepareCallUpdateWithVideo:(BOOL)isVideo
                                  callNumber:(NSString *)callNumber
                                  remoteName:(NSString *)remoteName ;

/// INTERNAL USE ONLY — SDK consumers should call `[OmiClient setDisplayName:forCallUUID:]`
/// to override the CallKit display name; the SDK then routes through this
/// builder automatically. Direct usage from app code is unsupported and the
/// signature may change between versions.
///
/// Same behaviour as the 3-arg variant but also consults the per-call-UUID
/// display-name mapping (set via `[OmiClient setDisplayName:forCallUUID:]`).
/// Used by the SDK when reporting a known active call so the lockscreen
/// reflects the app-injected name on every CallKit refresh (answered,
/// connected, etc.).
+ (CXCallUpdate *)prepareCallUpdateWithVideo:(BOOL)isVideo
                                  callNumber:(NSString *)callNumber
                                  remoteName:(NSString *)remoteName
                                     callUUID:(nullable NSUUID *)callUUID;

/*
 Check if IPv6 is available on cellular network
 */
+ (BOOL)isIPv6Available;

/*
 Check if IP address is APIPA (169.254.x.x)
 */
+ (BOOL)isAPIPA_Address:(NSString *)ipAddress;

/*
 Get valid local IP address (not APIPA)
 */
+ (NSString *)getValidLocalIPAddress;

extern NSString *const SDK_VERSION;

@end

@interface HttpRequest : NSObject

// ─────────────────────────────────────────────────────────────────────────────
// API request/response logging (🟠 [API-CHECK])
// ─────────────────────────────────────────────────────────────────────────────
// All HTTP traffic runs through one central logger. Toggle it at runtime — no
// rebuild needed. Two independent switches:
//   • setAPILogEnabled:     master on/off for the [API-CHECK] logs (default: OFF).
//   • setAPILogBodyEnabled: also log request/response BODY + headers (default: OFF).
//                           Bodies may contain PII/credentials — only turn on for
//                           debugging, keep off in production.
// When APILogEnabled is OFF, nothing is logged regardless of the body switch.
// When APILogEnabled is ON but body is OFF, only method + URL + status + elapsed
// are logged (no bodies) — safe for production diagnostics.
+ (void)setAPILogEnabled:(BOOL)enabled;
+ (BOOL)isAPILogEnabled;
+ (void)setAPILogBodyEnabled:(BOOL)enabled;
+ (BOOL)isAPILogBodyEnabled;

- (NSData* _Nonnull )httpRequestWithURL:(NSURL * _Nonnull)url httpMethod:(NSString * _Nullable)httpMethod body:(NSData *_Nullable)body contentType:(NSString * _Nullable)contentType error:(NSError *_Nullable* _Nullable)error;
- (NSData* _Nonnull )httpRequestWithURLAuthen:(NSURL * _Nonnull)url httpMethod:(NSString * _Nullable)httpMethod body:(NSData *_Nullable)body contentType:(NSString * _Nullable)contentType error:(NSError *_Nullable* _Nullable)error;
- (NSData* _Nonnull )httpRequestWithDefaultAuthen:(NSURL * _Nonnull)url httpMethod:(NSString * _Nullable)httpMethod body:(NSData *_Nullable)body contentType:(NSString * _Nullable)contentType error:(NSError *_Nullable* _Nullable)error;
- (NSString* _Nullable )httpRequestWithURLFast:(NSURL * _Nonnull)url httpMethod:(NSString * _Nullable)httpMethod body:(NSData *_Nullable)body contentType:(NSString * _Nullable)contentType error:(NSError *_Nullable* _Nullable)error;
@end
