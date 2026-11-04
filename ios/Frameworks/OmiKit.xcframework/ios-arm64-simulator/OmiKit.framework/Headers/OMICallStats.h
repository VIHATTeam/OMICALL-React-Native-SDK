//
//  OMICallStats.h
//  Copyright © 2017 OMICALL. All rights reserved.
//
#import <Foundation/Foundation.h>

@class OMICall;

/**
 * The key to get the MOS value from the call stats dictionairy.
 */
extern NSString * _Nonnull const OMICallStatsMOS;

/**
 * The key to get the active codec from the call stats dictionairy.
 */
extern NSString * _Nonnull const OMICallStatsActiveCodec;

/**
 * The key to get the total MBs used from the call stats dictionairy.
 */
extern NSString * _Nonnull const OMICallStatsTotalMBsUsed;

@interface OMICallStats : NSObject

/**
 *  Make the init unavailable.
 *
 *  @return compiler error.
 */
-(instancetype _Nonnull) init __attribute__((unavailable("init not available. Use initWithCall instead.")));

/**
 *  The init to set an own ringtone file.
 *
 *  @param call OMICall object.
 *
 *  @return OMICallStats instance.
 */
- (instancetype _Nullable)initWithCall:(__weak OMICall * _Nonnull)call NS_DESIGNATED_INITIALIZER;

/**
 * Generate the call status 
 * 
 * @return NSDictionary with following format:
 * @{
 *  OMICallStatsMOS: NSNumber,
 *  OMICallStatsActiveCodec: NSString,
 *  OMICallStatsTotalMBsUsed: NSNumber
 * };
 */
- (NSDictionary * _Nullable)generate;

@end
