import Foundation
import React
import OmiKit

@objc(OmikitPlugin)
class OmikitPlugin: RCTEventEmitter {
    
    public static var instance : OmikitPlugin!

    override init() {
        super.init()
        OmikitPlugin.instance = self
    }
    
    @objc(getInitialCall:withRejecter:)
    func initCall(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        if let call = CallManager.shareInstance().getAvailableCall() {
            
        }
    }
    
    @objc(initCall:withResolver:withRejecter:)
    func initCall(data: Any, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        if let dataOmi = data as? [String: Any] {
            CallManager.shareInstance().initEndpoint(params: dataOmi)
            resolve(true)
        }
    }
    
    @objc(updateToken:withResolver:withRejecter:)
    func updateToken(data: Any, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        if let dataOmi = data as? [String: Any] {
            CallManager.shareInstance().updateToken(params: dataOmi)
            resolve(true)
        }
    }
    
    @objc(startCall:withResolver:withRejecter:)
    func startCall(data: Any, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        if let dataOmi = data as? [String: Any] {
            let phoneNumber = dataOmi["phoneNumber"] as! String
            var isVideo = false
            if let isVideoCall = dataOmi["isVideo"] as? Bool {
                isVideo = isVideoCall
            }
            CallManager.shareInstance().startCall(phoneNumber, isVideo: isVideo)
            sendOnMuteStatus()
            resolve(true)
        }
    }
    
    @objc(endCall:withRejecter:)
    func endCall(resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        CallManager.shareInstance().endAvailableCall()
        resolve(true)
    }
    
    @objc(toggleMute:withRejecter:)
    func toggleMute(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        CallManager.shareInstance().toggleMute()
        sendOnMuteStatus()
        resolve(true)
    }
    
    @objc(toggleSpeak:withRejecter:)
    func toggleSpeak(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        CallManager.shareInstance().toogleSpeaker()
        sendOnSpeakerStatus()
        resolve(true)
    }
    
    @objc(sendDTMF:withResolver:withRejecter:)
    func sendDTMF(data: Any, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        if let dataOmi = data as? [String: Any] {
            CallManager.shareInstance().sendDTMF(character: dataOmi["character"] as! String)
            resolve(true)
        }
    }
    
    func sendOnMuteStatus() {
        if let call = CallManager.shareInstance().getAvailableCall() {
            if let isMuted = call.muted as? Bool {
                print("muteeeeed \(isMuted)")
                sendEvent(withName: onMuted, body: isMuted)
            }
        }
    }
    
    func sendOnSpeakerStatus() {
        sendEvent(withName: onSpeaker, body: CallManager.shareInstance().isSpeaker)
    }
    
    override func supportedEvents() -> [String]! {
        return [
            incomingReceived,
            onCallEstablished,
            onCallEnd,
            onMuted,
            onSpeaker
        ]
    }
}
