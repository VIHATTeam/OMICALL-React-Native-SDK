////
////  LocalCameraView.swift
////  omicall_flutter_plugin
////
////  Created by PRO 2019 16' on 15/02/2023.
////
import Foundation
import React
import UIKit
import OmiKit

@objc(FLRemoteCameraView)
class FLRemoteCameraView: RCTViewManager {
    
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
        self.setupViews()
    }
    
    func setupViews() {
        DispatchQueue.main.async {[weak self] in
            guard let self = self else { return }
            if let videoView = CallManager.shareInstance().getRemotePreviewView(frame: self._view.frame) {
                self._view.setView(videoView)
            }
        }
    }
    
}



//import Foundation
//import Flutter
//import WebKit
//import UIKit
//import OmiKit
//
//class FLRemoteCameraFactory: NSObject, FlutterPlatformViewFactory {
//    private var messenger: FlutterBinaryMessenger
//
//    init(messenger: FlutterBinaryMessenger) {
//        self.messenger = messenger
//        super.init()
//    }
//    
//    func createArgsCodec() -> FlutterMessageCodec & NSObjectProtocol {
//        return FlutterStandardMessageCodec.sharedInstance()
//    }
//    
//    func create(
//        withFrame frame: CGRect,
//        viewIdentifier viewId: Int64,
//        arguments args: Any?
//    ) -> FlutterPlatformView {
//        return FLRemoteCameraView(
//            frame: frame,
//            viewIdentifier: viewId,
//            arguments: args,
//            binaryMessenger: messenger
//        )
//    }
//}
//
//class FLRemoteCameraView: NSObject, FlutterPlatformView {
//    private var _view: OMIVideoPreviewView
//    private var _arg : [String : Any]?
//    private let methodChannel: FlutterMethodChannel?
//
//    init(
//        frame: CGRect,
//        viewIdentifier viewId: Int64,
//        arguments args: Any?,
//        binaryMessenger messenger: FlutterBinaryMessenger?
//    ) {
//        _view = OMIVideoPreviewView.init()
//        _arg = args as? [String: Any]
//        methodChannel = FlutterMethodChannel(name: "remote_camera_controller/\(viewId)", binaryMessenger: messenger!)
//        super.init()
//        methodChannel?.setMethodCallHandler(onMethodCall)
//    }
//    
//    func onMethodCall(call: FlutterMethodCall, result: FlutterResult) {
//            switch(call.method){
//            case "refresh":
//                setupViews()
//                break
//            default:
//                result(FlutterMethodNotImplemented)
//            }
//        }
//
//    func view() -> UIView {
//        return _view
//    }
//
//    func setupViews() {
//        self._view.layer.cornerRadius = 5
////        self._view.layer.borderColor = UIColor.gray.cgColor
////        self._view.layer.borderWidth = 1.0
//        self._view.clipsToBounds = true
//        CallManager.shareInstance().getRemotePreviewView(callback: { previewView in
//            self._view.setView(previewView)
//            print("\(previewView.frame)")
//            print("\(self._view.frame)")
//            print("AAAA")
//        })
//    }
//}
