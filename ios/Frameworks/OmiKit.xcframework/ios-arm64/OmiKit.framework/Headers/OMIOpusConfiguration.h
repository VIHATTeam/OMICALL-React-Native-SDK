//
//  OMIOpusConfiguration.h
//  Copyright © 2018 OMICALL. All rights reserved.
//

#import <Foundation/Foundation.h>

typedef NS_ENUM(NSUInteger, OMIOpusConfigurationSampleRate) {
    OMIOpusConfigurationSampleRateFullBand = 48000,
    OMIOpusConfigurationSampleRateSuperWideBand = 24000,
    OMIOpusConfigurationSampleRateWideBand = 16000,
    OMIOpusConfigurationSampleRateMediumBand = 12000,
    OMIOpusConfigurationSampleRateNarrowBand = 8000,
    OMIOpusConfigurationSampleRateFullBand_BitRate = 48000,
    OMIOpusConfigurationSampleRateSuperWideBand_BitRate = 24000,
    OMIOpusConfigurationSampleRateWideBand_BitRate = 16000,
    OMIOpusConfigurationSampleRateMediumBand_BitRate = 12000,
    OMIOpusConfigurationSampleRateNarrowBand_BitRate = 8000,

};

typedef NS_ENUM(NSUInteger, OMIOpusConfigurationFrameDuration) {
    OMIOpusConfigurationFrameDurationFive = 5,
    OMIOpusConfigurationFrameDurationTen = 10,
    OMIOpusConfigurationFrameDurationTwenty = 20,
    OMIOpusConfigurationFrameDurationForty = 40,
    OMIOpusConfigurationFrameDurationSixty = 60
};

/**
 *  OPUS configuration for more explanation read the RFC at https://tools.ietf.org/html/rfc6716
 */
@interface OMIOpusConfiguration : NSObject

/**
 * Sample rate in Hz
 *
 *  Default: OMIOpusConfigurationSampleRateFullBand (48000 hz)
 */
@property (nonatomic) OMIOpusConfigurationSampleRate sampleRate;

/**
 *  The frame size of the packets being sent over.
 *
 *  Default: OMIOpusConfigurationFrameDurationSixty (60 msec)
 */
@property (nonatomic) OMIOpusConfigurationFrameDuration frameDuration;

/**
 *  Encoder complexity, 0-10 (10 is highest) 
 *
 *  Default: 5
 */
@property (nonatomic) NSUInteger complexity;

/**
 *  Bit rate in bps of codec
 *
 *  Default: 0
 */
@property (nonatomic) NSUInteger bitRate;


/**
 *  YES for Constant bitrate (CBR) and no to use Variable bitrate (VBR)
 *
 *  Set to YES for:
 *      - When the transport only supports a fixed size for each compressed frame, or
 *      - When encryption is used for an audio stream that is either highly constrained (e.g., yes/no, recorded prompts) or highly sensitive
 *
 *  Default: NO
 */
@property (nonatomic) BOOL constantBitRate;

@end
