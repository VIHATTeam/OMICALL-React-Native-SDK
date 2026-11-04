//
//  OMIConsultHeaders.h
//  OmiKit
//
//  INTERNAL — public only so the unit tests can reach it.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// Safe extra SIP headers (port of Android SipExtraHeaders + ConsultHeaders).
@interface OMIConsultHeaders : NSObject
/// Drops invalid / reserved names, CR/LF or control characters, over-long values;
/// duplicate names (case-insensitive): the last wins; keeps at most 10. Returns ordered pairs.
+ (NSArray<NSArray<NSString *> *> *)sanitize:(nullable NSDictionary<NSString *, NSString *> *)headers;
/// App extras first; X-Original-Caller / X-Parent-Call-ID from the SDK always win (blank values omitted).
+ (NSArray<NSArray<NSString *> *> *)consultInviteHeadersWithExtras:(nullable NSDictionary<NSString *, NSString *> *)extras
                                                    originalCaller:(nullable NSString *)originalCaller
                                                      parentCallId:(nullable NSString *)parentCallId;
@end

NS_ASSUME_NONNULL_END
