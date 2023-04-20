import Foundation
import React
import OmiKit

@objc(OmikitPlugin)
public class OmikitPlugin: RCTEventEmitter {
    
    @objc public static var instance : OmikitPlugin!

    override init() {
        super.init()
        OmikitPlugin.instance = self
    }
    
    @objc(startServices:withRejecter:)
    func startServices(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        CallManager.shareInstance().registerNotificationCenter()
        resolve(true)
    }
    
    @objc(configPushNotification:withResolver:withRejecter:)
    func configPushNotification(data: Any, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        if let dataOmi = data as? [String: Any] {
            CallManager.shareInstance().configNotification(data: dataOmi)
        }
        resolve(true)
    }
    
    @objc(getInitialCall:withRejecter:)
    func getInitialCall(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        if let call = CallManager.shareInstance().getAvailableCall() {
            let data : [String: Any] = [
                "callerNumber" : call.callerNumber,
                "status": call.lastStatus,
                "muted": call.muted,
                "speaker": call.speaker,
                "isVideo": call.isVideo
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
            resolve(result)
        }
    }
    
    @objc(startCallWithUuid:withResolver:withRejecter:)
    func startCallWithUuid(data: Any, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        if let dataOmi = data as? [String: Any] {
            let uuid = dataOmi["usrUuid"] as! String
            let isVideo = dataOmi["isVideo"] as? Bool
            let result = CallManager.shareInstance().startCallWithUuid(uuid, isVideo: isVideo ?? false)
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
        if let call = CallManager.shareInstance().getAvailableCall() {
            resolve(call.muted)
        }
    }
    
    @objc(toggleSpeaker:withRejecter:)
    func toggleSpeaker(resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        CallManager.shareInstance().toogleSpeaker() 
        resolve(CallManager.shareInstance().isSpeaker)
    }
    
    @objc(sendDTMF:withResolver:withRejecter:)
    func sendDTMF(data: Any, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        if let dataOmi = data as? [String: Any] {
            CallManager.shareInstance().sendDTMF(character: dataOmi["character"] as! String)
            resolve(true)
        }
    }
    
    @objc(switchOmiCamera:withRejecter:)
    func switchOmiCamera(resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        CallManager.shareInstance().switchCamera()
        resolve(true)
    }
    
    @objc(toggleOmiVideo:withRejecter:)
    func toggleOmiVideo(resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        CallManager.shareInstance().toggleCamera()
        resolve(true)
    }
    
    @objc(logout:withRejecter:)
    func logout(resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        CallManager.shareInstance().logout()
        resolve(true)
    }
    
    @objc(registerVideoEvent:withRejecter:)
    func registerVideoEvent(resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        CallManager.shareInstance().registerVideoEvent()
        resolve(true)
    }
    
    @objc(removeVideoEvent:withRejecter:)
    func removeVideoEvent(resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        CallManager.shareInstance().removeVideoEvent()
        resolve(true)
    }
    
    func sendMuteStatus() {
        if let call = CallManager.shareInstance().getAvailableCall() {
            sendEvent(withName: MUTED, body: call.muted)
        }
    }
    
    func sendSpeakerStatus() {
        sendEvent(withName: SPEAKER, body: CallManager.shareInstance().isSpeaker)

    }
    
    @objc public func didReceive(data: [String: Any]) {
        print(data)
    }
    
    public override func supportedEvents() -> [String]! {
        return [
            INCOMING_RECEIVED,
            CALL_ESTABLISHED,
            CALL_END,
            MUTED,
            SPEAKER,
            VIDEO,
            REMOTE_VIDEO_READY,
            LOCAL_VIDEO_READY
        ]
    }
}
