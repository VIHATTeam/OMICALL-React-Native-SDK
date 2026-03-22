//
//  OmiRemoteCameraViewBridge.m
//  omikit-plugin
//
//  Bridge for OmiRemoteCameraView — exposes Swift ViewManager to ObjC runtime.
//  RCT_EXTERN_MODULE is REQUIRED to prevent linker from stripping Swift symbols.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(OmiRemoteCameraView, RCTViewManager)
@end
