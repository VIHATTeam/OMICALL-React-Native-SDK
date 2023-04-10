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
    
    @objc(startServices:withRejecter:)
    func startServices(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        CallManager.shareInstance().registerNotificationCenter()
        resolve(true)
    }
    
    @objc(configPushNotification:withRejecter:)
    func configPushNotification(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        resolve(true)
    }
    
    @objc(getInitialCall:withRejecter:)
    func getInitialCall(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        if let call = CallManager.shareInstance().getAvailableCall() {
            let data : [String: Any] = [
                "callerNumber" : call.callerNumber,
                "status": call.lastStatus,
                "muted": call.muted,
                "speaker": call.speaker
            ]
            resolve(data)
            return
        }
        resolve(false)
    }
    
    @objc(initCallWithUserPassword:withResolver:withRejecter:)
    func initCallWithUserPassword(data: Any, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        if let dataOmi = data as? [String: Any] {
            let result = CallManager.shareInstance().initWithUserPasswordEndpoint(params: dataOmi)
            resolve(result)
        }
    }
    
    @objc(initCallWithApiKey:withResolver:withRejecter:)
    func initCallWithApiKey(data: Any, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        if let dataOmi = data as? [String: Any] {
            let result = CallManager.shareInstance().initWithApiKeyEndpoint(params: dataOmi)
            resolve(result)
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
            let isVideo = dataOmi["isVideo"] as? Bool
            let result = CallManager.shareInstance().startCall(phoneNumber, isVideo: isVideo ?? false)
            sendMuteStatus()
            resolve(result)
        }
    }
    
    @objc(startCallWithUuid:withResolver:withRejecter:)
    func startCallWithUuid(data: Any, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        if let dataOmi = data as? [String: Any] {
            let uuid = dataOmi["uuid"] as! String
            let isVideo = dataOmi["isVideo"] as? Bool
            let result = CallManager.shareInstance().startCallWithUuid(uuid, isVideo: isVideo ?? false)
            sendMuteStatus()
            resolve(result)
        }
    }
    
    @objc(joinCall:withRejecter:)
    func joinCall(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        CallManager.shareInstance().joinCall()
        resolve(true)
    }
    
    @objc(endCall:withRejecter:)
    func endCall(resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        CallManager.shareInstance().endAvailableCall()
        resolve(true)
    }
    
    @objc(toggleMute:withRejecter:)
    func toggleMute(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        CallManager.shareInstance().toggleMute()
        sendMuteStatus()
        if let call = CallManager.shareInstance().getAvailableCall() {
            resolve(call.muted)
        }
    }
    
    @objc(toggleSpeak:withRejecter:)
    func toggleSpeak(resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        CallManager.shareInstance().toogleSpeaker()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {[weak self] in
            guard let self = self else { return }
            self.sendSpeakerStatus()
            if let call = CallManager.shareInstance().getAvailableCall() {
                resolve(call.speaker)
            }
        }
    }
    
    @objc(sendDTMF:withResolver:withRejecter:)
    func sendDTMF(data: Any, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        if let dataOmi = data as? [String: Any] {
            CallManager.shareInstance().sendDTMF(character: dataOmi["character"] as! String)
            resolve(true)
        }
    }
    
    func sendMuteStatus() {
        if let call = CallManager.shareInstance().getAvailableCall() {
            sendEvent(withName: MUTED, body: call.muted)
        }
    }
    
    func sendSpeakerStatus() {
        if let call = CallManager.shareInstance().getAvailableCall() {
            sendEvent(withName: SPEAKER, body: call.speaker)
        }

    }
    
    override func supportedEvents() -> [String]! {
        return [
            INCOMING_RECEIVED,
            CALL_ESTABLISHED,
            CALL_END,
            MUTED,
            SPEAKER,
            VIDEO
        ]
    }
}
