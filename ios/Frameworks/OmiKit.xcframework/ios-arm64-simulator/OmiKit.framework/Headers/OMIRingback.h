//
//  OMIRingback.h
//  Copyright © 2016 OMICALL. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface OMIRingback : NSObject

/**
 *  The current status if the Ringback is playing.
 */
@property (nonatomic) BOOL isPlaying;

/**
 *  This will start the ringback if it isn't playing already.
 */
- (void)start;

/**
 *  This will stop the ringback if it isn't stopped already.
 */
- (void)stop;

@end
