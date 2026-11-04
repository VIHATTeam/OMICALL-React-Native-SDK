//
//  OMIVideoCallViewController.h
//  OmiKit
//
//  Created by VietHQ on 2022/11/14.
//

#import <UIKit/UIKit.h>
#import <OmiKit/OmiKit-umbrella.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * View controller for video calls with built-in Picture-in-Picture support
 *
 * Features:
 * - Full screen video call UI
 * - Automatic floating PiP window when app goes to background
 * - Draggable floating window (like Messenger/WhatsApp)
 * - Tap to restore full screen
 * - Camera switching, mute controls
 *
 * Usage:
 * 1. Create instance: [[OMIVideoCallViewController alloc] initWithCall:call]
 * 2. Enable auto PiP: viewController.enableAutoPiP = YES (default: YES)
 * 3. Present: [self presentViewController:viewController animated:YES completion:nil]
 */
@interface OMIVideoCallViewController : UIViewController

/// Enable automatic Picture-in-Picture when app enters background (default: YES)
@property (nonatomic, assign) BOOL enableAutoPiP;

/// Size of the floating PiP window (default: 120x160)
@property (nonatomic, assign) CGSize pipWindowSize;

/**
 * Initialize with a video call
 * @param call The active OMICall instance
 * @return Initialized view controller
 */
- (id)initWithCall:(__weak OMICall *)call;

/**
 * Manually show floating PiP window
 * Use this if you want to show PiP without going to background
 */
- (void)showFloatingWindow;

/**
 * Manually hide floating PiP window
 */
- (void)hideFloatingWindow;

@end

NS_ASSUME_NONNULL_END
