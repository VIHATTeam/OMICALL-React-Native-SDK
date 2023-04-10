//
//  FLRemoteCameraView.m
//  omikit-plugin
//
//  Created by PRO 2019 16' on 10/04/2023.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>


@interface RCT_EXTERN_MODULE(FLRemoteCameraView, RCTViewManager)
    RCT_EXTERN_METHOD(refresh:
                 (RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)
@end

