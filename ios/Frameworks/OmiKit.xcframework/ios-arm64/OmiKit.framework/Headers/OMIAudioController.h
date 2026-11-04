//
//  OMIAudioController.h
//  Copyright © 2015 OMICALL. All rights reserved.
//

#import <Foundation/Foundation.h>

extern NSString * __nonnull const OMIAudioControllerAudioInterrupted;
extern NSString * __nonnull const OMIAudioControllerAudioResumed;

/**
 *  Possible outputs the audio can have.
 */
typedef NS_ENUM(NSInteger, OMIAudioControllerOutputs) {
    /**
     *  Audio is sent over the speaker
     */
    OMIAudioControllerOutputSpeaker,
    /**
     *  Audio is sent to the ear speaker or mini jack
     */
    OMIAudioControllerOutputOther,
    /**
     *  Audio is sent to bluetooth
     */
    OMIAudioControllerOutputBluetooth,
};
#define OMIAudioControllerOutputsString(OMIAudioControllerOutputs) [@[@"OMIAudioControllerOutputSpeaker", @"OMIAudioControllerOutputOther", @"OMIAudioControllerOutputBluetooth"] objectAtIndex:OMIAudioControllerOutputs]


@interface OMIAudioController : NSObject

/**
 *  If there is a Bluetooth headset connected, this will return YES.
 */
@property (readonly, nonatomic) BOOL hasBluetooth;

/**
 *  The current routing of the audio.
 *
 *  Attention: Possible values that can be set: OMIAudioControllerSpeaker & OMIAudioControllerOther.
 *  Setting the property to OMIAudioControllerBluetooth won't work, if you want to activatie bluetooth
 *  you have to change the route with the mediaplayer (see example app).
 */
@property (nonatomic) OMIAudioControllerOutputs output;

/**
 *  Configure audio.
 */
- (void)configureAudioSession;

/**
 *  Pre-warm VoiceProcessingIO audio unit to reduce initialization delay.
 *  Call this early (e.g., when receiving VoIP push) to warm up the audio unit
 *  before CallKit activates the audio session.
 *
 *  VoiceProcessingIO typically takes 5-10+ seconds to initialize on first use.
 *  Pre-warming reduces this delay by initializing the audio components early.
 */
- (void)preWarmAudioUnit;

/**
 *  Activate the audio session.
 */
- (void)activateAudioSession;

/**
 *  Deactivate the audio session.
 */
- (void)deactivateAudioSession;

/**
 *  Deactivate sound device only.
 *  Call this before hangup to prevent deadlock when sound device activation is in progress.
 *  This signals any in-progress activation to abort and prevents new activations.
 */
- (void)deactivateSoundDevice;

/**
 * Toggle speaker mode and return true if speaker is enabled
 */
-(BOOL)toggleSpeaker;


@end
