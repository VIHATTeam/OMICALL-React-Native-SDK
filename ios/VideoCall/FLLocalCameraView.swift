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
    override func view() -> UIView! {
        let view = UIView()
        view.backgroundColor = .red
        return view
    }
}
//
//class FLLocalCameraFactory: NSObject, FlutterPlatformViewFactory {
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
//        return FLLocalCameraView(
//            frame: frame,
//            viewIdentifier: viewId,
//            arguments: args,
//            binaryMessenger: messenger
//        )
//    }
//}
//
//class FLLocalCameraView: NSObject, FlutterPlatformView {
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
//        methodChannel = FlutterMethodChannel(name: "local_camera_controller/\(viewId)", binaryMessenger: messenger!)
//        super.init()
//        methodChannel?.setMethodCallHandler(onMethodCall)
//        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1, execute: {[weak self] in
//            guard let self = self else { return }
//            self.setupViews()
//        })
//    }
//
//    func onMethodCall(call: FlutterMethodCall, result: FlutterResult) {
//            switch(call.method){
//            case "switch":
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
//        CallManager.shareInstance().getLocalPreviewView(callback: {[weak self] previewView in
//            guard let self = self else { return }
//            self._view.setView(previewView)
//        })
//    }
//}
