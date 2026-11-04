//
//  OMICodecs.h
//  Copyright © 2018 OMICALL. All rights reserved.
//


#import <Foundation/Foundation.h>

#import "OMICodecConfiguration.h"

/**
 *  Enum of possible Audio Codecs.
 */
typedef NS_ENUM(NSInteger, OMIAudioCodec) {
        // G711a
    OMIAudioCodecG711a,
        // G722
    OMIAudioCodecG722,
        // iLBC
    OMIAudioCodecILBC,
        // G711
    OMIAudioCodecG711,
        // Speex 8 kHz
    OMIAudioCodecSpeex8000,
        // Speex 16 kHz
    OMIAudioCodecSpeex16000,
        // Speex 32 kHz
    OMIAudioCodecSpeex32000,
        // GSM 8 kHZ
    OMIAudioCodecGSM,
        // Opus
    OMIAudioCodecOpus,
};
#define OMIAudioCodecString(OMIAudioCodec) [OMIAudioCodecArray objectAtIndex:OMIAudioCodec]
#define OMIAudioCodecStringWithIndex(NSInteger) [OMIAudioCodecArray objectAtIndex:NSInteger]
#define OMIAudioCodecArray @[@"PCMA/8000/1", @"G722/16000/1", @"iLBC/8000/1", @"PCMU/8000/1", @"speex/8000/1", @"speex/16000/1", @"speex/32000/1", @"GSM/8000/1", @"opus/48000/2"]


@interface OMIAudioCodecs : NSObject

/**
 *  The prioritiy of the codec
 */
@property (readonly, nonatomic) NSUInteger priority;

/**
 * The used codec.
 */
@property (readonly, nonatomic) OMIAudioCodec codec;

/**
 * Make the default init unavaibale.
 */
- (instancetype _Nonnull) init __attribute__((unavailable("init not available. Use initWithAudioCodec instead.")));

/**
 * The init to setup the audio codecs.
 *
 * @param codec     Audio codec codec to set the prioritiy for.
 * @param priority  NSUInteger the priority the codec will have.
 */
- (instancetype _Nonnull)initWithAudioCodec:(OMIAudioCodec)codec andPriority:(NSUInteger)priority;

/**
 * Get the codec from the #define OMICodecConfigurationAudioString with a OMICodecConfigurationAudio type.
 *
 * @param codec OMICodecConfigurationAudio the codec to get the string representation of.
 *
 * @return NSString the string representation of the OMICodecConfigurationAudio type.
 */
+ (NSString * _Nonnull)codecString:(OMIAudioCodec)codec;

/**
 * Get the codec from the defined OMICodecConfigurationAudioString with an index.
 */
+ (NSString * _Nonnull)codecStringWithIndex:(NSInteger)index;

@end
