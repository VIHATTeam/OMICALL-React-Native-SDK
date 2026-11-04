//
//  OMICodecConfiguration.h
//  Copyright © 2018 OMICALL. All rights reserved.
//

#import <Foundation/Foundation.h>

#import "OMIAudioCodecs.h"
#import "OMIVideoCodecs.h"
#import "OMIOpusConfiguration.h"

@interface OMICodecConfiguration : NSObject

/**
 * An array of available audio codecs.
 */
@property (strong, nonatomic) NSArray * _Nullable audioCodecs;

/**
 * An array of available video codecs.
 */
@property (strong, nonatomic) NSArray * _Nullable videoCodecs;

/**
 *  The linked OPUS configuration when opus is being used.
 */
@property (nonatomic) OMIOpusConfiguration * _Nullable opusConfiguration;

@end
