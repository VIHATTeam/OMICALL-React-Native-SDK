//
//  OMIVideoPreviewView.h
//  OmiKit
//
//  Created by VietHQ on 2022/11/6.
//

#import <UIKit/UIKit.h>
#import <AVFoundation/AVFoundation.h>
#import "OMICall.h"


NS_ASSUME_NONNULL_BEGIN

@interface OMIVideoPreviewView : UIView

/// YES if this is local camera preview, NO if remote video
@property (nonatomic, assign) BOOL isLocalVideo;

/// YES if the PJSIP video window has been successfully shown (pjsua_vid_win_set_show called)
/// Use this to check if video is already rendering before triggering recovery.
@property (nonatomic, assign, readonly) BOOL hasShownWindow;

/// YES to use Aspect FIT (show full video with letterboxing), NO for Aspect FILL (crop to fill, default)
/// Aspect FIT is recommended for remote video to avoid cropping the face
/// Default is NO (Aspect FILL)
/// NOTE: If useAutoAspect is YES, this property is ignored
@property (nonatomic, assign) BOOL useAspectFit;

/// YES to automatically select aspect mode based on video and container orientation
/// - Landscape video in portrait container → Aspect FIT (show full video)
/// - Portrait video in portrait container → Aspect FILL (fill container)
/// - Landscape video in landscape container → Aspect FILL (fill container)
/// Default is YES for remote video (recommended for cross-platform compatibility)
@property (nonatomic, assign) BOOL useAutoAspect;

/// update preview view from ViewManager
/// - Parameter view: the preview view from VideoViewManager
- (void)setView: (UIView *)view;

/// update preview view with explicit window ID
/// - Parameter view: the preview view from VideoViewManager
/// - Parameter windowId: the PJSIP video window ID (used for showVideoWindow)
/// Use this method when windowId is known to avoid layer.name extraction issues
- (void)setView:(UIView *)view withWindowId:(int)windowId;

- (void)setPlayer:(AVPlayer *)player;

/**
 * Cleanup video resources - call when done with the view
 * Hides PJSIP window and removes subviews to release memory
 */
- (void)cleanup;

/**
 * Show loading indicator overlay
 * Used to indicate waiting for video frames to arrive
 */
- (void)showLoadingIndicator;

/**
 * Hide loading indicator overlay
 * Called when video frames start rendering or video becomes unavailable
 */
- (void)hideLoadingIndicator;

/**
 * Check if video is currently receiving frames
 * Uses RTCP statistics to verify if new RTP packets are arriving
 * @return YES if frames received in last 2 seconds, NO otherwise
 */
- (BOOL)isReceivingFrames;

/**
 * FIX-LL: Centralized gatekeeper for pjsua_vid_win_set_show(TRUE).
 * Prevents duplicate set_show(TRUE) which corrupts vid_conf routing table.
 * @param wid PJSIP video window ID
 * @param reason Logging reason string
 * @return YES if set_show was called, NO if skipped (already visible or invalid)
 */
- (BOOL)safeShowVideoWindow:(int)wid reason:(NSString *)reason;

/**
 * Show/hide the built-in connection overlay for the remote video (main thread).
 * Called by OMIVideoCallManager; apps normally do not call it directly.
 */
- (void)updateRemoteConnectionState:(OMIRemoteConnectionState)state;

/**
 * FIX-LL: Centralized gatekeeper for pjsua_vid_win_set_show(FALSE).
 * @param wid PJSIP video window ID
 * @param reason Logging reason string
 */
- (void)safeHideVideoWindow:(int)wid reason:(NSString *)reason;

/**
 * FIX XX: Invalidate all pending recovery callbacks (TRANSIENT-FIX, PLI burst, etc.).
 * Call after stream RECREATED to prevent stale callbacks from triggering unnecessary re-INVITEs.
 */
- (void)invalidatePendingRecoveryCallbacks;

/**
 * FIX BB: Re-show Metal window after GPU recovery re-INVITE (flag=0).
 * With flag=0 re-INVITE, wid stays the same but Metal was hidden by FIX AA.
 * The normal show path is blocked by hasShownWindow=YES — this method bypasses that guard.
 * Only call 2+ seconds after re-INVITE to ensure 200 OK has been processed.
 * @param wid PJSIP video window ID (must match current stored windowId or call is skipped)
 */
- (void)reshowWindowAfterGPURecovery:(int)wid;

@end

NS_ASSUME_NONNULL_END
