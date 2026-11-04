//
//  OMIVideoViewManager.h
//  Pods
//
//  Created by VietHQ on 2022/11/5.
//

#ifndef OMIVideoViewManager_h
#define OMIVideoViewManager_h

#import <UIKit/UIKit.h>
#import <OmiKit/OMIVideoPreviewView.h>

@interface OMIVideoViewManager : NSObject

@property (nonatomic, assign, readonly) BOOL isCameraOn;

/// Flag indicating camera scan has completed
/// Use this to check before sending re-INVITE to avoid mutex deadlock
/// scanCameras holds PJSIP mutex for 9+ seconds, blocking re-INVITE attempts
@property (nonatomic, assign, readonly) BOOL isCameraScanComplete;

/// Turn on/off camera.
- (void)toggleCamera;

- (void)stopPreview;


/// Switch front/back camera.
- (void)switchCamera;

/// got current active call's local camera preview view from PJSIP apis
- (void)localView: (void(^)(UIView *view))handler;

/// got current active call's remote camera preview view from PJSIP apis
- (void)remoteView: (void(^)(UIView *view))handler;
/**
 *  create view for local camera capture & stream to another leg
*/
- (UIView *)createViewForVideoLocal:(CGRect)frame;

/**
 * create view for local camera capture (ASYNC - recommended for outgoing calls)
 * Does not block caller thread - camera initialization runs in background
 * Prevents 500-800ms UI freeze during camera startup
 */
- (void)createViewForVideoLocalAsync:(CGRect)frame completion:(void (^)(UIView *view))completion;
/**
 * create view for remote stream
*/
- (UIView *)createViewForVideoRemote:(CGRect)frame;

/**
 * create view for remote stream (ASYNC - recommended)
 * Does not block caller thread - avoids 9+ second delays during SIP transactions
 */
- (void)createViewForVideoRemoteAsync:(CGRect)frame completion:(void (^)(UIView *view))completion;

/**
 * create view for remote stream with specific windowId (ASYNC)
 * Use this when windowId is already known (e.g., from stored notification)
 * This avoids re-querying pjsua_call_get_info which may return wid=-1
 *
 * @param frame The frame for the video view
 * @param windowId The PJSIP video window ID (must be >= 0)
 * @param completion Called with the video view (or empty view if failed)
 */
- (void)createViewForVideoRemoteAsyncWithWindowId:(CGRect)frame windowId:(int)windowId completion:(void (^)(UIView *view))completion;

/**
 * Cleanup video resources when call ends
 * Should be called when dismissing video call view controller
 * Stops video preview and releases PJSIP video resources
 */
- (void)cleanup;

/**
 * Pre-warm camera capture subsystem for faster video startup
 * Call this when VoIP push is received for video call
 * Scans available cameras and initializes capture device in background
 * Does not block - runs asynchronously
 */
- (void)preWarmCameraCapture;

@end


#endif /* OMIVideoViewManager_h */
