//
//  OmiLocalCameraViewManager.swift
//  omikit-plugin
//
//  Plain UIView container for OMIVideoCallManager.
//  SDK creates and manages camera preview subview internally.
//

import Foundation
import React
import UIKit
import OmiKit

@objc(OmiLocalCameraView)
class OmiLocalCameraViewManager: RCTViewManager {

    override class func requiresMainQueueSetup() -> Bool {
        return true
    }

    override func view() -> UIView! {
        // Create fresh container each time and register with CallManager
        let container = UIView()
        container.backgroundColor = UIColor(red: 0.118, green: 0.192, blue: 0.314, alpha: 1.0)
        container.clipsToBounds = true
        container.layer.cornerRadius = 12
        NSLog("📹 [OmiLocalCameraViewManager] view() called — creating container")
        CallManager.shareInstance().localContainerView = container
        return container
    }

    @objc(refresh:withRejecter:)
    func refresh(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        // With new SDK API, refresh is handled by SDK automatically
        // prepareForVideoDisplay handles local camera restart if needed
        DispatchQueue.main.async {
            OMIVideoCallManager.shared().prepareForVideoDisplay()
        }
        resolve(true)
    }
}
