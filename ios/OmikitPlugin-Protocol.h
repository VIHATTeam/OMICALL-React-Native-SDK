#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTTurboModule.h>

@protocol OmikitPluginSpec <RCTBridgeModule, RCTTurboModule>

// Registration & Authentication
- (void)initCallWithUserPassword:(NSDictionary *)data
                         resolve:(RCTPromiseResolveBlock)resolve
                          reject:(RCTPromiseRejectBlock)reject;

- (void)initCallWithApiKey:(NSDictionary *)data
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject;

// Call Control
- (void)startServices:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject;

- (void)startCall:(NSDictionary *)data
          resolve:(RCTPromiseResolveBlock)resolve
           reject:(RCTPromiseRejectBlock)reject;

- (void)startCallWithUuid:(NSDictionary *)data
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject;

- (void)joinCall:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject;

- (void)endCall:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject;

- (void)rejectCall:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject;

- (void)dropCall:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject;

- (void)transferCall:(NSDictionary *)data
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject;

- (void)getInitialCall:(NSDictionary *)data
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject;

// Media Control
- (void)toggleMute:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject;

- (void)toggleHold:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject;

- (void)onHold:(NSDictionary *)data
       resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject;

- (void)toggleSpeaker:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject;

- (void)toggleOmiVideo:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject;

- (void)switchOmiCamera:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject;

- (void)registerVideoEvent:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject;

- (void)removeVideoEvent:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject;

- (void)sendDTMF:(NSDictionary *)data
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject;

- (void)getAudio:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject;

- (void)getCurrentAudio:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject;

- (void)setAudio:(NSDictionary *)data
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject;

// User & Info
- (void)getCurrentUser:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject;

- (void)getGuestUser:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject;

- (void)getUserInfo:(NSDictionary *)data
            resolve:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject;

// Notifications
- (void)configPushNotification:(NSDictionary *)data
                       resolve:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject;

- (void)hideSystemNotificationSafely:(RCTPromiseResolveBlock)resolve
                              reject:(RCTPromiseRejectBlock)reject;

- (void)hideSystemNotificationOnly:(RCTPromiseResolveBlock)resolve
                            reject:(RCTPromiseRejectBlock)reject;

- (void)hideSystemNotificationAndUnregister:(NSDictionary *)data
                                    resolve:(RCTPromiseResolveBlock)resolve
                                     reject:(RCTPromiseRejectBlock)reject;

// Permissions
- (void)checkAndRequestPermissions:(NSDictionary *)data
                           resolve:(RCTPromiseResolveBlock)resolve
                            reject:(RCTPromiseRejectBlock)reject;

- (void)checkPermissionStatus:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject;

- (void)requestPermissionsByCodes:(NSDictionary *)data
                          resolve:(RCTPromiseResolveBlock)resolve
                           reject:(RCTPromiseRejectBlock)reject;

- (void)systemAlertWindow:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject;

- (void)requestSystemAlertWindowPermission:(RCTPromiseResolveBlock)resolve
                                    reject:(RCTPromiseRejectBlock)reject;

- (void)openSystemAlertSetting:(RCTPromiseResolveBlock)resolve
                         reject:(RCTPromiseRejectBlock)reject;

// Advanced Features
- (void)checkCredentials:(NSDictionary *)data
                 resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject;

- (void)registerWithOptions:(NSDictionary *)data
                    resolve:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject;

- (void)getKeepAliveStatus:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject;

- (void)triggerKeepAlivePing:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject;

// Logout
- (void)logout:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject;

// Constants
- (NSDictionary *)constantsToExport;

@end

#endif
