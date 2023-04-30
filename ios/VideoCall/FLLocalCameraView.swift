//
//  LocalCameraView.swift
//  omicall_flutter_plugin
//
//  Created by PRO 2019 16' on 15/02/2023.
//

import Foundation
import React
import UIKit
import OmiKit

@objc(FLLocalCameraView)
class FLLocalCameraView: RCTViewManager {
    
    private var _view: OMIVideoPreviewView
    
    override init() {
        _view = OMIVideoPreviewView.init()
        super.init()
    }
    
    override class func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    override func view() -> UIView! {
        return _view
    }
    
    @objc(refresh:withRejecter:)
    func refresh(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        setupViews()
    }
    
    func setupViews() {
        DispatchQueue.main.async {[weak self] in
            guard let self = self else { return }
            if let videoView = CallManager.shareInstance().getLocalPreviewView(frame: self._view.frame) {
                self._view.setView(videoView)
            }
        }
    }
}
