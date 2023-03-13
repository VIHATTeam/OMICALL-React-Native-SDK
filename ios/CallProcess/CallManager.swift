//
//  CallUtils.swift
//  OMICall Contact Center
//
//  Created by Tuan on 22/03/2022.
//

import Foundation
import AVFoundation
import MediaPlayer
import SwiftUI
import OmiKit
import AVFoundation

class CallManager {
    
    static private var instance: CallManager? = nil // Instance
    var call: OMICall? // Call
    private var numberRetry: Int = 0
    var isCallError: Bool = false  // check when call error
    private let omiLib = OMISIPLib.sharedInstance()
    private var isSpeaker = false
    var currentConfirmedCall : OMICall?
    var videoManager: OMIVideoViewManager?
    
    
    /// Get instance
    static func shareInstance() -> CallManager {
        if (instance == nil) {
            instance = CallManager()
        }
        return instance!
    }
    
    func updateToken(params: [String: Any]) {
        if let apnsToken = params["apnsToken"] as? String {
            OmiClient.setUserPushNotificationToken(apnsToken)
        }
    }
    
    func initEndpoint(params: [String: Any]){
        var isSupportVideoCall = false
        if let userName = params["userName"] as? String, let password = params["password"] as? String, let realm = params["realm"] as? String {
            OmiClient.initWithUsername(userName, password: password, realm: realm)
            if let isVideoCall = params["isVideo"] as? Bool {
                isSupportVideoCall = isVideoCall
            }
            OmiClient.startOmiService(isSupportVideoCall)
            if (isSupportVideoCall) {
                OmiClient.registerAccount()
                videoManager = OMIVideoViewManager.init()
            }
            registerNotificationCenter()
        }
    }
    
    func registerNotificationCenter() {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            NotificationCenter.default.removeObserver(CallManager.instance!)
            NotificationCenter.default.addObserver(CallManager.instance!,
                                                   selector: #selector(self.callStateChanged(_:)),
                                                   name: NSNotification.Name.OMICallStateChanged,
                                                   object: nil
            )
            NotificationCenter.default.addObserver(CallManager.instance!,
                                                   selector: #selector(self.callDealloc(_:)),
                                                   name: NSNotification.Name.OMICallDealloc,
                                                   object: nil
            )
        }
    }
    
    @objc func callDealloc(_ notification: NSNotification) {
        guard let userInfo = notification.userInfo,
              let call     = userInfo[OMINotificationUserInfoCallKey] as? OMICall else {
            return;
        }
        if (call.callState == .disconnected) {
            DispatchQueue.main.async {
                OmikitPlugin.instance.sendEvent(withName: onCallEnd, body: [:])
                self.currentConfirmedCall = nil
            }
        }
    }
    
    @objc fileprivate func callStateChanged(_ notification: NSNotification) {
        guard let userInfo = notification.userInfo,
              let call     = userInfo[OMINotificationUserInfoCallKey] as? OMICall else {
            return;
        }
        print("call state")
        print(call.callState)
        switch (call.callState) {
        case .calling:
            if (!call.isIncoming) {
                NSLog("Outgoing call, in CALLING state, with UUID \(call.uuid)")
                OmikitPlugin.instance.sendEvent(withName: onRinging, body: [:])
            }
            break
        case .early:
            if (!call.isIncoming) {
                NSLog("Outgoing call, in EARLY state, with UUID: \(call.uuid)")
            }
            break
        case .connecting:
            if (!call.isIncoming) {
                NSLog("Outgoing call, in CONNECTING state, with UUID: \(call.uuid)")
            }
            break
        case .confirmed:
            NSLog("Outgoing call, in CONFIRMED state, with UUID: \(call.uuid)")
            OmikitPlugin.instance.sendEvent(withName: onCallEstablished, body: ["isVideo": call.isVideo != 0, "callerNumber": call.callerNumber, "isIncoming": call.isIncoming])
            OmikitPlugin.instance.sendEvent(withName: onMuted, body: ["isMuted": call.muted])
            self.currentConfirmedCall = call
            break
        case .disconnected:
            if (!call.connected) {
                NSLog("Call never connected, in DISCONNECTED state, with UUID: \(call.uuid)")
            } else if (!call.userDidHangUp) {
                NSLog("Call remotly ended, in DISCONNECTED state, with UUID: \(call.uuid)")
            }
            print(omiLib.getCurrentCall()?.uuid.uuidString)
            print(call.uuid.uuidString)
            if let currentActiveCall = currentConfirmedCall, currentActiveCall.uuid.uuidString == call.uuid.uuidString {
                OmikitPlugin.instance.sendEvent(withName: onCallEnd, body: [:])
                currentConfirmedCall = nil
                break
            }
            if currentConfirmedCall == nil {
                OmikitPlugin.instance.sendEvent(withName: onCallEnd, body: [:])
                break
            }
            print(omiLib.getNewestCall()?.uuid.uuidString)
            break
        case .incoming:
            OmikitPlugin.instance.sendEvent(withName: incomingReceived, body: ["isVideo": call.isVideo != 0, "callerNumber": "0961046493", "isIncoming": call.isIncoming])
            break
        case .muted:
            OmikitPlugin.instance.sendEvent(withName: onMuted, body: ["isMuted": call.muted])
            break
        case .hold:
            OmikitPlugin.instance.sendEvent(withName: onHold, body: ["isHold": call.onHold])
            break
        @unknown default:
            NSLog("Default call state")
        }
    }
    
    /// Start call
    func startCall(_ phoneNumber: String, isVideo: Bool) {
        registerNotificationCenter()
        if (isVideo) {
            OmiClient.startVideoCall(phoneNumber)
            return
        }
        OmiClient.startCall(phoneNumber)
    }
    
    /// End call
    func endNewestCall() {
        guard let call = omiLib.getNewestCall() else {
            return
        }
        omiLib.callManager.end(call) { error in
            if error != nil {
                NSLog("error hanging up call(\(call.uuid.uuidString)): \(error!)")
            }
        }
        OmikitPlugin.instance.sendEvent(withName: onCallEnd, body: [:])
        NotificationCenter.default.removeObserver(self)
    }
    
    func endCurrentConfirmCall() {
        guard let call = omiLib.getCurrentCall() else {
            endNewestCall()
            return
        }
        omiLib.callManager.end(call) { error in
            if error != nil {
                NSLog("error hanging up call(\(call.uuid.uuidString)): \(error!)")
            }
        }
        OmikitPlugin.instance.sendEvent(withName: onCallEnd, body: [:])
        NotificationCenter.default.removeObserver(self)
    }
    
    
    func endAllCalls() {
        omiLib.callManager.endAllCalls()
        OmikitPlugin.instance.sendEvent(withName: onCallEnd, body: [:])
        NotificationCenter.default.removeObserver(self)
    }
    
    func sendDTMF(character: String) {
        guard let call = omiLib.getCurrentCall() else {
            return
        }
        try? call.sendDTMF(character)
    }
    
    
    /// Toogle mtue
    func toggleMute(completion: @escaping () -> Void?) {
        guard let omicall = OMISIPLib.sharedInstance().getCurrentCall() else {
            return
        }
        
        omiLib.callManager.toggleMute(for: omicall) { error in
            if error != nil {
                NSLog("toggle mute error:  \(error))")
            }
        }
        
    }
    
    /// Toogle hold
    func toggleHold(completion: @escaping () -> Void?) {
        guard let omicall = OMISIPLib.sharedInstance().getCurrentCall() else {
            return
        }
        DispatchQueue.main.async {[weak self] in
            guard let self = self else { return }
            self.omiLib.callManager.toggleHold(for: omicall) { error in
                if error != nil {
                    NSLog("Error holding current call: \(error!)")
                    return
                } else {
                    completion()
                }
            }
        }
    }
    
    
    /// Toogle speaker
    func toogleSpeaker() {
        do {
            if (!isSpeaker) {
                isSpeaker = true
                try AVAudioSession.sharedInstance().overrideOutputAudioPort(.speaker)
                
            } else {
                isSpeaker = false
                try AVAudioSession.sharedInstance().overrideOutputAudioPort(.none)
            }
        } catch (let error){
            NSLog("Error toogleSpeaker current call: \(error)")

        }
    }
    
    
    func inputs() -> [[String: String]] {
          let inputs = AVAudioSession.sharedInstance().availableInputs ?? []
          let results = inputs.map { item in
              return [
                  "name": item.portName,
                  "id": item.uid,
              ]
          }
          return results
    }
      
    func setInput(id: String) {
        let inputs = AVAudioSession.sharedInstance().availableInputs ?? []
        if let newOutput = inputs.first(where: {$0.uid == id}) {
            try? AVAudioSession.sharedInstance().setPreferredInput(newOutput)
        }
    }
    
    func outputs() -> [[String: String]] {
        let outputs = AVAudioSession.sharedInstance().currentRoute.outputs
        var results = outputs.map { item in
           return [
              "name": item.portName,
              "id": item.uid,
           ]
        }
        let hasSpeaker = results.contains{ $0["name"] == "Speaker" }
        if (!hasSpeaker) {
            results.append([
                "name": "Speaker",
                "id": "Speaker",
            ])
        } else {
            results.append([
                "name": "Off Speaker",
                "id": "Off Speaker",
            ])
        }
        return results
    }
    
    func setOutput(id: String) {
        if (id == "Speaker") {
            try? AVAudioSession.sharedInstance().overrideOutputAudioPort(.speaker)
            return
        }
        if (id == "Off Speaker") {
            try? AVAudioSession.sharedInstance().overrideOutputAudioPort(.none)
            return
        }
        let outputs = AVAudioSession.sharedInstance().currentRoute.outputs
        if let newOutput = outputs.first(where: {$0.uid == id}) {
            try? AVAudioSession.sharedInstance().setPreferredInput(newOutput)
        }
    }
    
    //video call
    func toggleCamera() {
        if let videoManager = videoManager {
            videoManager.toggleCamera()
        }
    }
    
    func getCameraStatus() -> Bool {
        guard let videoManager = videoManager else { return false }
        return videoManager.isCameraOn
    }
    
    func switchCamera() {
        if let videoManager = videoManager {
            videoManager.switchCamera()
        }
    }
    
//    func getLocalPreviewView(callback: @escaping (UIView) -> Void) {
//        guard let videoManager = videoManager  else { return }
//        videoManager.localView {previewView in
//            DispatchQueue.main.async {
//                if (previewView != nil) {
//                    previewView!.contentMode = .scaleAspectFill
//                    callback(previewView!)
//                }
//            }
//        }
//    }
//
//    func getRemotePreviewView(callback: @escaping (UIView) -> Void) {
//        guard let videoManager = videoManager  else { return }
//        videoManager.remoteView { previewView in
//            DispatchQueue.main.async {
//                if (previewView != nil) {
//                    previewView!.contentMode = .scaleAspectFill
//                    callback(previewView!)
//                }
//            }
//        }
//    }
}


