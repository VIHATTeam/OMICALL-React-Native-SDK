//
//  OmiRemoteCameraViewManager.swift
//  omikit-plugin
//
//  Plain UIView container for OMIVideoCallManager.
//  SDK creates and manages Metal (OMIVideoPreviewView) subview internally.
//

import Foundation
import React
import UIKit
import OmiKit

@objc(OmiRemoteCameraView)
class OmiRemoteCameraViewManager: RCTViewManager {

    override class func requiresMainQueueSetup() -> Bool {
        return true
    }

    override func view() -> UIView! {
        // Create fresh container each time and register with CallManager
        let container = UIView()
        container.backgroundColor = .black
        container.clipsToBounds = true
        NSLog("📹 [OmiRemoteCameraViewManager] view() called — creating container")
        CallManager.shareInstance().remoteContainerView = container
        return container
    }

    @objc(refresh:withRejecter:)
    func refresh(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        // With new SDK API, refresh just calls prepareForVideoDisplay
        // SDK handles reconnecting Metal view to container automatically
        DispatchQueue.main.async {
            OMIVideoCallManager.shared().prepareForVideoDisplay()
        }
        resolve(true)
    }
}
