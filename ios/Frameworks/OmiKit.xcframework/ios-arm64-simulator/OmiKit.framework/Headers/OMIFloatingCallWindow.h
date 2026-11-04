//
//  OMIFloatingCallWindow.h
//  OmiKit
//
//  Created by OmiKit on 2025/01/13.
//

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@class OMIFloatingCallWindow;

/**
 * Delegate protocol for floating window events
 */
@protocol OMIFloatingCallWindowDelegate <NSObject>
@optional
/// Called when user taps on floating window to restore full screen
- (void)floatingWindowDidRequestRestore:(OMIFloatingCallWindow *)window;

/// Called when user dismisses floating window
- (void)floatingWindowDidDismiss:(OMIFloatingCallWindow *)window;
@end

/**
 * Floating window for video call when app goes to background or user minimizes
 * Similar to WhatsApp/Messenger floating call UI
 *
 * Features:
 * - Draggable floating window
 * - Shows local and remote video preview
 * - Tap to restore full screen
 * - Swipe to dismiss
 * - Auto-snaps to screen edges
 */
@interface OMIFloatingCallWindow : UIWindow

/// Delegate to receive floating window events
@property (nonatomic, weak) id<OMIFloatingCallWindowDelegate> delegate;

/// YES if floating window is currently shown
@property (nonatomic, readonly) BOOL isShowing;

/// Size of the floating window (default: 120x160)
@property (nonatomic, assign) CGSize windowSize;

/**
 * Initialize floating window
 * @return Initialized floating window
 */
- (instancetype)initWithFrame:(CGRect)frame;

/**
 * Show floating window at default position (top-right corner)
 */
- (void)show;

/**
 * Show floating window at specific position
 * @param position The center position for the window
 */
- (void)showAtPosition:(CGPoint)position;

/**
 * Hide and remove floating window
 */
- (void)hide;

/**
 * Update video content view
 * @param localView The local camera preview view
 * @param remoteView The remote video view
 */
- (void)updateLocalVideoView:(UIView *)localView remoteVideoView:(UIView *)remoteView;

/**
 * Check if any floating window is currently showing
 * @return YES if there's an active floating window
 */
+ (BOOL)hasActiveFloatingWindow;

@end

NS_ASSUME_NONNULL_END
