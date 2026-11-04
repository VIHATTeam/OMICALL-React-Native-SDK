//
//  OMIVideoCallManager.h
//  OmiKit
//
//  Singleton manager that automatically handles video call lifecycle.
//  App only needs to provide container views - SDK handles the rest.
//

#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>
#import "OMICall.h"

NS_ASSUME_NONNULL_BEGIN

@class OMIVideoCallManager;

/**
 * Delegate protocol for video call events.
 * All methods are optional - SDK handles video automatically.
 * Use this for UI updates only (show/hide loading, update buttons, etc.)
 */
@protocol OMIVideoCallManagerDelegate <NSObject>
@optional

/// Called when video is ready and displaying (both local and remote)
- (void)videoCallManagerDidStartVideo:(OMIVideoCallManager *)manager;

/// Called when video call ended
- (void)videoCallManagerDidEndCall:(OMIVideoCallManager *)manager;

/// Called when remote video becomes available
- (void)videoCallManagerDidReceiveRemoteVideo:(OMIVideoCallManager *)manager;

/// Called when there's an error with video
- (void)videoCallManager:(OMIVideoCallManager *)manager didFailWithError:(NSError *)error;

/// Called (main thread) when the other party's media health changes — e.g. they lost
/// network (Reconnecting), turned the camera off / went to background (VideoPaused).
/// @param duration seconds the previous problem state lasted (0 when entering one).
/// The SDK never hangs up on its own; decide in the app (e.g. after N seconds Reconnecting).
- (void)videoCallManager:(OMIVideoCallManager *)manager
    remoteConnectionDidChange:(OMIRemoteConnectionState)state
                     duration:(NSTimeInterval)duration;

/// Called (main thread) when system Picture-in-Picture starts / stops.
- (void)videoCallManager:(OMIVideoCallManager *)manager
    pictureInPictureDidChange:(BOOL)active;

@end


/**
 * OMIVideoCallManager - Automatic video call management
 *
 * USAGE (SIMPLE):
 *
 *   // 1. In your video call view controller's viewDidLoad:
 *   [[OMIVideoCallManager shared] setupWithRemoteView:self.remoteContainerView
 *                                           localView:self.localContainerView];
 *
 *   // 2. That's it! SDK handles everything automatically:
 *       - Detecting when call is confirmed
 *       - Setting up video streams
 *       - Handling background/foreground transitions
 *       - Recreating views when needed
 *       - Cleanup when call ends
 *
 *   // 3. Optional: Set delegate for UI updates
 *   [OMIVideoCallManager shared].delegate = self;
 *
 *   // 4. In your dealloc or when leaving video call:
 *   [[OMIVideoCallManager shared] cleanup];
 *
 *
 * CONTROLS:
 *   [[OMIVideoCallManager shared] switchCamera];     // Switch front/back
 *   [[OMIVideoCallManager shared] toggleCamera];     // On/off camera
 *   [OMIVideoCallManager shared].isCameraOn;         // Check camera state
 */
@interface OMIVideoCallManager : NSObject

/// Shared singleton instance
+ (instancetype)shared;

/// Delegate for optional UI callbacks
@property (nonatomic, weak, nullable) id<OMIVideoCallManagerDelegate> delegate;

/// Built-in overlay on the remote video for connection problems (last frame dimmed +
/// spinner + short Vietnamese text). Default YES. Set NO to draw your own UI from
/// videoCallManager:remoteConnectionDidChange:duration: / OMICallRemoteConnectionNotification.
@property (nonatomic, assign) BOOL showsRemoteConnectionOverlay;

/// Distance (points) from the bottom safe-area edge to the bottom of the small banner shown
/// for the mild states (Weak, UplinkPoor) — keep it above your call controls. Default 160.
/// Capped at half of the remote video view's height.
@property (nonatomic, assign) CGFloat remoteConnectionBannerBottomInset;

/// Localized text for the remote-connection overlay. Called on the main queue every
/// time the overlay updates (so a runtime language change needs no re-assignment).
/// Return nil (or an empty string) to use the built-in Vietnamese text.
/// Not called for OMIRemoteConnectionConnected (no overlay). Dim / last-frame freeze /
/// spinner / banner layout stay per state.
/// Swift: OMIVideoCallManager.shared().remoteConnectionOverlayTextProvider = { state in ... }
@property (nonatomic, copy, nullable) NSString * _Nullable (^remoteConnectionOverlayTextProvider)(OMIRemoteConnectionState state);

/// System Picture-in-Picture for the remote video (iOS 15+). Default NO.
/// When YES, the remote video moves into a floating PiP window automatically when
/// the app goes to the background during a video call, and returns when the app
/// becomes active. Requires `audio` in UIBackgroundModes. To keep SENDING your
/// camera while in PiP the app also needs the entitlement
/// com.apple.developer.avfoundation.multitasking-camera-access (iOS 16+); without
/// it the other party sees your video paused while audio continues.
@property (nonatomic, assign) BOOL pictureInPictureEnabled;

/// YES when this device/OS supports system Picture-in-Picture.
@property (nonatomic, readonly) BOOL isPictureInPictureSupported;

/// YES while the PiP window is showing.
@property (nonatomic, readonly) BOOL isPictureInPictureActive;

/// Start / stop PiP manually (needs pictureInPictureEnabled and an active video call).
- (void)startPictureInPicture;
- (void)stopPictureInPicture;

/// Whether camera is currently on
@property (nonatomic, readonly) BOOL isCameraOn;

/// Whether video is currently active
@property (nonatomic, readonly) BOOL isVideoActive;

/// Whether video setup is in progress (media rebuilding after re-INVITE)
/// Use this to avoid sending concurrent re-INVITEs during media rebuild
@property (nonatomic, readonly) BOOL isVideoSetupInProgress;

/// Check if remote video is currently receiving frames
/// Use this to check if video is actually working before triggering re-INVITE
/// @return YES if frames received in last 2 seconds, NO otherwise
- (BOOL)checkIsVideoReceivingFrames;

#pragma mark - Setup (REQUIRED)

/**
 * Setup video with container views.
 * Call this once in your video call view controller's viewDidLoad.
 * SDK will automatically handle all video lifecycle events.
 *
 * @param remoteView Container view for remote video (typically full screen)
 * @param localView Container view for local camera preview (typically small PiP)
 */
- (void)setupWithRemoteView:(UIView *)remoteView localView:(UIView *)localView;

#pragma mark - Controls

/// Switch between front and back camera
- (void)switchCamera;

/// Toggle camera on/off
- (void)toggleCamera;

/// Force refresh video views (useful after orientation change)
- (void)refreshVideoViews;

#pragma mark - Video Recovery

/**
 * Attempts to recover video channel by sending SIP re-INVITE.
 *
 * WHEN TO USE:
 * - When video channel was destroyed due to camera failure in background
 * - When prepareForVideoDisplay() cannot recover video (win_in=-1 persists)
 * - When remote video shows black screen but audio works
 *
 * HOW IT WORKS:
 * 1. Sends SIP re-INVITE with PJSUA_CALL_REINIT_MEDIA flag
 * 2. PJSIP recreates video channel from scratch
 * 3. After 2 seconds, calls prepareForVideoDisplay() to setup views
 *
 * NOTE: This method is called AUTOMATICALLY when win_in=-1 persists after
 * 10 retry attempts in prepareForVideoDisplay(). You only need to call this
 * manually if you want to force video recovery at a specific time.
 *
 * @return YES if re-INVITE was sent, NO if call is not in correct state
 */
- (BOOL)attemptVideoRecovery;

#pragma mark - Background/Foreground Handling

/**
 * Prepare video for display after app comes to foreground.
 *
 * IMPORTANT: Call this method when your video call screen appears from background!
 *
 * WHEN TO USE:
 * - In your video call ViewController's viewDidAppear:
 * - When app transitions from background to foreground with active video call
 * - After CallKit answer from background and video screen becomes visible
 *
 * WHY THIS IS NEEDED:
 * When answering a call from background (via CallKit), iOS cannot start
 * AVFoundation camera session while app is in background state. This causes:
 * 1. "Unable to start AVFoundation capture session" error
 * 2. Video window ID becomes invalid (wid=-1)
 * 3. Remote video shows loading forever
 *
 * This method handles proper video initialization after foreground transition.
 *
 * USAGE EXAMPLE:
 * @code
 * - (void)viewDidAppear:(BOOL)animated {
 *     [super viewDidAppear:animated];
 *     [[OMIVideoCallManager shared] prepareForVideoDisplay];
 * }
 * @endcode
 */
- (void)prepareForVideoDisplay;

#pragma mark - Cleanup (REQUIRED)

/**
 * Cleanup video resources.
 * Call this when:
 * - Leaving video call screen
 * - Call ends
 * - In your view controller's dealloc
 */
- (void)cleanup;

#pragma mark - Internal (SDK use only)

/**
 * Flag to indicate video recovery is in progress.
 * Used internally to coordinate between Metal recovery and other operations.
 * DO NOT set this directly from app code.
 */
@property (atomic, assign) BOOL isRecoveryInProgress;

/**
 * Timestamp when last Metal recovery completed.
 * Used to implement cooldown period - skip refreshVideoViews for 2 seconds after recovery.
 */
@property (atomic, assign) NSTimeInterval lastRecoveryCompletedTime;

/**
 * FIX BB: Re-show Metal window 2s after flag=0 GPU recovery re-INVITE.
 * With flag=0 re-INVITE, wid stays same but Metal was hidden by FIX AA.
 * The normal notification-driven re-show path is blocked by hasShownWindow=YES.
 * This method bypasses that guard directly, called from forceReinviteForGPURecovery.
 */
- (void)reshowMetalWindowAfterGPURecovery:(int)wid;

@end

NS_ASSUME_NONNULL_END
