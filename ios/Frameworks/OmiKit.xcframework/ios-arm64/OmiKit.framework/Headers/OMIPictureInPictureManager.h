//
//  OMIPictureInPictureManager.h
//  OmiKit
//
//  Created by OmiKit on 2025/01/13.
//

#import <Foundation/Foundation.h>
#import <AVKit/AVKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Delegate protocol for PiP events
 */
@protocol OMIPictureInPictureDelegate <NSObject>
@optional
/// Called when user taps on PiP window to restore full screen
- (void)pictureInPictureDidRequestRestore;

/// Called when PiP starts
- (void)pictureInPictureDidStart;

/// Called when PiP stops
- (void)pictureInPictureDidStop;

/// Called when PiP fails
- (void)pictureInPictureFailedToStart:(NSError *)error;
@end

/**
 * Manager class for Picture-in-Picture functionality during video calls
 *
 * Usage:
 * 1. Check if PiP is supported: [OMIPictureInPictureManager isPictureInPictureSupported]
 * 2. Create manager with video layer: [[OMIPictureInPictureManager alloc] initWithVideoLayer:layer]
 * 3. Set delegate to handle restore events
 * 4. Start PiP when entering background: [manager startPictureInPicture]
 * 5. Stop PiP when needed: [manager stopPictureInPicture]
 */
@interface OMIPictureInPictureManager : NSObject

/// Delegate to receive PiP events
@property (nonatomic, weak) id<OMIPictureInPictureDelegate> delegate;

/// YES if PiP is currently active
@property (nonatomic, readonly) BOOL isPictureInPictureActive;

/// YES if PiP is possible (supported and properly configured)
@property (nonatomic, readonly) BOOL isPictureInPicturePossible;

/**
 * Check if Picture-in-Picture is supported on this device
 * @return YES if PiP is supported
 */
+ (BOOL)isPictureInPictureSupported;

/**
 * Initialize PiP manager with a video layer (CALayer from PJSIP Metal renderer)
 * @param layer The CALayer that contains video content
 * @return Initialized PiP manager
 */
- (instancetype)initWithVideoLayer:(CALayer *)layer;

/**
 * Initialize PiP manager with an AVPlayerLayer
 * @param playerLayer The AVPlayerLayer for video playback
 * @return Initialized PiP manager
 */
- (instancetype)initWithPlayerLayer:(AVPlayerLayer *)playerLayer;

/**
 * Start Picture-in-Picture mode
 * Call this when app enters background or user requests PiP
 */
- (void)startPictureInPicture;

/**
 * Stop Picture-in-Picture mode
 * Call this when call ends or user closes PiP
 */
- (void)stopPictureInPicture;

/**
 * Cleanup resources
 */
- (void)invalidate;

@end

NS_ASSUME_NONNULL_END
