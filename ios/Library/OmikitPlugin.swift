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
        CallManager.shareInstance().registerNotificationCenter(showMissedCall: true)
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
                "isVideo": call.isVideo,
            ]
            resolve(data)
            return
        }
        resolve(nil)
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
    
    
    @objc(startCall:withResolver:withRejecter:)
    func startCall(data: Any, resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        if let dataOmi = data as? [String: Any] {
            let phoneNumber = dataOmi["phoneNumber"] as! String
            var isVideo = false
            if let isVideoCall = dataOmi["isVideo"] as? Bool {
                isVideo = isVideoCall
            }
            CallManager.shareInstance().startCall(phoneNumber, isVideo: isVideo) { callResult in
                resolve(callResult)
            }
        }
    }
    
    @objc(startCallWithUuid:withResolver:withRejecter:)
    func startCallWithUuid(data: Any, resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        if let dataOmi = data as? [String: Any] {
            let uuid = dataOmi["usrUuid"] as! String
            var isVideo = false
            if let isVideoCall = dataOmi["isVideo"] as? Bool {
                isVideo = isVideoCall
            }
            CallManager.shareInstance().startCallWithUuid(uuid, isVideo: isVideo) { callResult in
                resolve(callResult)
            }
        }
    }
    
    @objc(joinCall:withRejecter:)
    func joinCall(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        CallManager.shareInstance().joinCall()
        resolve(true)
    }
    
    @objc(endCall:withRejecter:)
    func endCall(resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        CallManager.shareInstance().endCall()
        resolve(true)
    }
    
    @objc(toggleMute:withRejecter:)
    func toggleMute(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        CallManager.shareInstance().toggleMute()
        if let call = CallManager.shareInstance().getAvailableCall() {
            resolve(call.muted)
        }
        sendMuteStatus()
    }
    
    @objc(toggleSpeaker:withRejecter:)
    func toggleSpeaker(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
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
    func switchOmiCamera(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        CallManager.shareInstance().switchCamera()
        resolve(true)
    }
    
    @objc(toggleOmiVideo:withRejecter:)
    func toggleOmiVideo(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        CallManager.shareInstance().toggleCamera()
        resolve(true)
    }
    
    @objc(logout:withRejecter:)
    func logout(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        CallManager.shareInstance().logout()
        resolve(true)
    }
    
    @objc(registerVideoEvent:withRejecter:)
    func registerVideoEvent(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        CallManager.shareInstance().registerVideoEvent()
        resolve(true)
    }
    
    @objc(removeVideoEvent:withRejecter:)
    func removeVideoEvent(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        CallManager.shareInstance().removeVideoEvent()
        resolve(true)
    }
    
    @objc(getCurrentUser:withRejecter:)
    func getCurrentUser(resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        CallManager.shareInstance().getCurrentUser { user in
            resolve(user)
        }
    }

    @objc(getGuestUser:withRejecter:)
    func getGuestUser(resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        CallManager.shareInstance().getGuestUser { user in
            resolve(user)
        }
    }
    
    @objc(getUserInfor:withResolver:withRejecter:)
    func getUserInfor(data: Any, resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        CallManager.shareInstance().getUserInfo(phone: data as! String) { user in
            resolve(user)
        }
    }
    
    @objc(getAudio:withRejecter:)
    func getAudio(resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        let audios = CallManager.shareInstance().getAudioOutputs()
        resolve(audios)
    }
    
    @objc(setAudio:withResolver:withRejecter:)
    func setAudio(data: Any, resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        if let dataOmi = data as? [String: Any] {
            let portType = dataOmi["portType"] as! String
            CallManager.shareInstance().setAudioOutputs(portType: portType)
        }
    }
    
    @objc(getCurrentAudio:withRejecter:)
    func getCurrentAudio(resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
        let currentAudio = CallManager.shareInstance().getCurrentAudio()
        resolve(currentAudio)
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
        if let callerNumber = data["omisdkCallerNumber"] as? String, let isVideo = data["omisdkIsVideo"] as? Bool {
            sendEvent(withName: CLICK_MISSED_CALL, body: [
                "callerNumber": callerNumber,
                "isVideo": isVideo,
            ])
        }
    }

    @objc(transferCall:withResolver:withRejecter:)
    func transferCall(data: Any, resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
        if let dataOmi = data as? [String: Any] {
            let phoneNumber = dataOmi["phoneNumber"] as! String
            CallManager.shareInstance().transferCall(phoneNumber)
        }
    }
    
    public override func supportedEvents() -> [String]! {
        return [
            CALL_STATE_CHANGED,
            MUTED,
            SPEAKER,
            REMOTE_VIDEO_READY,
            CLICK_MISSED_CALL,
            SWITCHBOARD_ANSWER,
            CALL_QUALITY,
            AUDIO_CHANGE,
        ]
    }
}
