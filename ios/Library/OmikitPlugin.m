#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(OmikitPlugin, NSObject)

// Start services
RCT_EXTERN_METHOD(startServices:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Configure push notification
RCT_EXTERN_METHOD(configPushNotification:(id)data
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Get initial call
RCT_EXTERN_METHOD(getInitialCall:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Initialize call with user password
RCT_EXTERN_METHOD(initCallWithUserPassword:(id)data
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Initialize call with API key
RCT_EXTERN_METHOD(initCallWithApiKey:(id)data
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Start a call
RCT_EXTERN_METHOD(startCall:(id)data
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Start a call with UUID
RCT_EXTERN_METHOD(startCallWithUuid:(id)data
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Join a call
RCT_EXTERN_METHOD(joinCall:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// End a call
RCT_EXTERN_METHOD(endCall:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Toggle mute
RCT_EXTERN_METHOD(toggleMute:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Toggle speaker
RCT_EXTERN_METHOD(toggleSpeaker:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Toggle hold
RCT_EXTERN_METHOD(toggleHold:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Send DTMF
RCT_EXTERN_METHOD(sendDTMF:(id)data
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Switch camera
RCT_EXTERN_METHOD(switchOmiCamera:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Toggle video
RCT_EXTERN_METHOD(toggleOmiVideo:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Logout
RCT_EXTERN_METHOD(logout:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Register video event
RCT_EXTERN_METHOD(registerVideoEvent:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Remove video event
RCT_EXTERN_METHOD(removeVideoEvent:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Get current user
RCT_EXTERN_METHOD(getCurrentUser:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Get guest user
RCT_EXTERN_METHOD(getGuestUser:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Get user info
RCT_EXTERN_METHOD(getUserInfo:(id)data
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Get audio
RCT_EXTERN_METHOD(getAudio:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Set audio
RCT_EXTERN_METHOD(setAudio:(id)data
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Get current audio
RCT_EXTERN_METHOD(getCurrentAudio:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Transfer call
RCT_EXTERN_METHOD(transferCall:(id)data
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Required to run on the main thread
+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

// Queue to run methods
- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}

@end
