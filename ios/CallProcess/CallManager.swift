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
    private let omiLib = OMISIPLib.sharedInstance()
    var videoManager: OMIVideoViewManager?
    var isSpeaker = false
    private var guestPhone : String = ""
    private var lastStatusCall : String?
    private var tempCallInfo : [String: Any]?
    private var lastTimeCall : Date = Date()
    /// Get instance
    static func shareInstance() -> CallManager {
        if (instance == nil) {
            instance = CallManager()
        }
        return instance!
    }
    
    func getAvailableCall() -> OMICall? {
        var currentCall = omiLib.getCurrentConfirmCall()
        if (currentCall == nil) {
            currentCall = omiLib.getNewestCall()
        }
        return currentCall
    }

     func transferCall(_ phoneNumber: String)-> Bool {
        var result = false;
        do {
                if let callInfo = self.omiLib.getCurrentConfirmCall() {
                    dump(callInfo)
                    if callInfo.callState != .disconnected {
                        callInfo.blindTransferCall(withNumber: phoneNumber);
                        result = true
                    }
                }
        } catch let error {
            print("ERROR_WHEN_TRANSFER_CALL_IOS: ", error)
        }
        print("calllZiii 2 ==> \(result)")
        return result
    }

    
    func endCall(){
       do {
           if let callInfo = omiLib.getCurrentCall() {
               if callInfo.callState != .disconnected {
                   self.omiLib.callManager.end(callInfo) { error in
                       if error != nil {
                       }
                    }
                }
            }
       } catch let error {
           print("ERROR_WHEN_TRANSFER_CALL_IOS: ", error)
       }
   }
    
     
    func configNotification(data: [String: Any]) {
        let user = UserDefaults.standard
        if let title = data["missedCallTitle"] as? String, let message = data["prefixMissedCallMessage"] as? String {
            user.set(title, forKey: "omicall/missedCallTitle")
            user.set(message, forKey: "omicall/prefixMissedCallMessage")
        }
    }
    
    func convertDictionaryToJson(dictionary: [String: Any]) -> String? {
           do {
               let jsonData = try JSONSerialization.data(withJSONObject: dictionary, options: [])
               if let jsonString = String(data: jsonData, encoding: .utf8) {
                   return jsonString
               }
           } catch {
               print("Error converting dictionary to JSON: \(error.localizedDescription)")
           }
           return nil
       }

     private func messageCall(type: Int) -> String {
            switch(type){
                case 0:
                    return "INVALID_UUID"
                case 1:
                     return "INVALID_PHONE_NUMBER"
                case 2:
                     return "SAME_PHONE_NUMBER_WITH_PHONE_REGISTER"
                case 3:
                    return "MAX_RETRY"
                case 4:
                    return "PERMISSION_DENIED"
                case 5:
                    return "COULD_NOT_FIND_END_POINT"
                case 6:
                    return "REGISTER_ACCOUNT_FAIL"
                case 7:
                    return "START_CALL_FAIL"
                case 9:
                    return "HAVE_ANOTHER_CALL"
                default:
                    return "START_CALL_SUCCESS"
            }
        }
    
    private func requestPermission(isVideo: Bool) {
        AVCaptureDevice.requestAccess(for: .audio) { _ in
//            print("request audio")
        }
        if isVideo {
            AVCaptureDevice.requestAccess(for: .video) { _ in
//                print("request video")
            }
        }
    }
    
    func initWithApiKeyEndpoint(params: [String: Any]) -> Bool {
        //request permission
        var result = false
        if let usrUuid = params["usrUuid"] as? String, let fullName = params["fullName"] as? String, let apiKey = params["apiKey"] as? String, let token = params["fcmToken"] as? String {
            result = OmiClient.initWithUUID(usrUuid, fullName: fullName, apiKey: apiKey)
            OmiClient.setUserPushNotificationToken(token)
        }
        if (result) {
            let isVideo = (params["isVideo"] as? Bool) ?? true
            requestPermission(isVideo: isVideo)
        }
        return result
    }
    
    
    func initWithUserPasswordEndpoint(params: [String: Any]) -> Bool {
        var result = false
        if let userName = params["userName"] as? String, let password = params["password"] as? String, let realm = params["realm"] as? String, let token = params["fcmToken"] as? String {
            OmiClient.initWithUsername(userName, password: password, realm: realm, proxy: "")
            OmiClient.setUserPushNotificationToken(token)
            result = true
        }
        let isVideo = (params["isVideo"] as? Bool) ?? true
        requestPermission(isVideo: isVideo)
        return result
    }

    func showMissedCall() {
        OmiClient.setMissedCall { call in
            UNUserNotificationCenter.current().getNotificationSettings { settings in
                switch settings.authorizationStatus {
                    case .notDetermined:
                       break
                    case .authorized, .provisional:
                        let user = UserDefaults.standard
                        let title = user.string(forKey: "omicall/missedCallTitle") ?? ""
                        let message = user.string(forKey: "omicall/prefixMissedCallMessage") ?? ""
                        let content      = UNMutableNotificationContent()
                        content.title    = title
                        content.body = "\(message) \(call.callerNumber!)"
                        content.sound    = .default
                        content.userInfo = [
                            "omisdkCallerNumber": call.callerNumber,
                            "omisdkIsVideo": call.isVideo,
                        ]
                        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
                        let id = Int.random(in: 0..<10000000)
                        let request = UNNotificationRequest(identifier: "\(id)", content: content, trigger: trigger)
                        UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
                    default:
                        break
                }
            }
        }
    }
    
    
    func registerNotificationCenter(showMissedCall: Bool) {
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
            NotificationCenter.default.addObserver(CallManager.instance!,
                                                   selector: #selector(self.switchBoardAnswer(_:)),
                                                   name: NSNotification.Name.OMICallSwitchBoardAnswer,
                                                   object: nil
            )
            NotificationCenter.default.addObserver(CallManager.instance!, selector: #selector(self.updateNetworkHealth(_:)), name: NSNotification.Name.OMICallNetworkQuality, object: nil)
            NotificationCenter.default.addObserver(CallManager.instance!, selector: #selector(self.audioChanged(_:)), name: NSNotification.Name.OMICallAudioRouteChange, object: nil)
            if (showMissedCall) {
                self.showMissedCall()
            }
        }
    }
    
    func registerVideoEvent() {
        DispatchQueue.main.async {
            NotificationCenter.default.addObserver(CallManager.instance!,
                                                   selector: #selector(self.videoUpdate(_:)),
                                                   name: NSNotification.Name.OMICallVideoInfo,
                                                   object: nil
            )
        }
    }
    
    func removeVideoEvent() {
        DispatchQueue.main.async {
            NotificationCenter.default.removeObserver(CallManager.instance!, name: NSNotification.Name.OMICallVideoInfo, object: nil)
        }
    }
    
    @objc func audioChanged(_ notification: NSNotification) {
        guard let userInfo = notification.userInfo,
              let audioInfo     = userInfo[OMINotificationCurrentAudioRouteKey] as? [[String: String]] else {
            return;
        }
        OmikitPlugin.instance?.sendEvent(withName: AUDIO_CHANGE, body: [
            "data": audioInfo,
        ])
        
    }
    
    @objc func updateNetworkHealth(_ notification: NSNotification) {
        guard let userInfo = notification.userInfo,
              let state     = userInfo[OMINotificationNetworkStatusKey] as? Int else {
            return;
        }
        OmikitPlugin.instance.sendEvent(withName: CALL_QUALITY, body: ["quality": state])
    }
    
    @objc func videoUpdate(_ notification: NSNotification) {
        guard let userInfo = notification.userInfo,
              let state     = userInfo[OMIVideoInfoState] as? Int else {
            return;
        }
        switch (state) {
        case 1:
            OmikitPlugin.instance.sendEvent(withName: REMOTE_VIDEO_READY, body: nil)
            break
        default:
            break
        }
    }
    
    @objc func switchBoardAnswer(_ notification: NSNotification) {
        guard let userInfo = notification.userInfo,
              let sip     = userInfo[OMINotificationSIPKey] as? String else {
            return;
        }
        guestPhone = sip
        OmikitPlugin.instance.sendEvent(withName: SWITCHBOARD_ANSWER, body: ["sip": sip])
    }
    
    @objc func callDealloc(_ notification: NSNotification) {
        if (tempCallInfo != nil) {
            tempCallInfo!["status"] = OMICallState.disconnected.rawValue
            OmikitPlugin.instance.sendEvent(withName: CALL_STATE_CHANGED, body: tempCallInfo!)
        }
    }
    
    @objc fileprivate func callStateChanged(_ notification: NSNotification) {
        guard let userInfo = notification.userInfo,
              let call     = userInfo[OMINotificationUserInfoCallKey] as? OMICall,
              let callState = userInfo[OMINotificationUserInfoCallStateKey] as? Int else {
            return;
        }
       
        var dataToSend: [String: Any] = [
            "status": callState,
            "callInfo": "",
            "incoming": false,
            "callerNumber": "",
            "isVideo": false,
            "transactionId": "",
            "_id": ""
        ]

        if(call != nil){
            if(call.isIncoming && callState == OMICallState.early.rawValue){
                dataToSend["status"] = OMICallState.incoming.rawValue
            }
            dataToSend["_id"] = String(describing: OmiCallModel(omiCall: call).uuid)
            dataToSend["incoming"] = call.isIncoming
            dataToSend["callerNumber"] = call.callerNumber
            dataToSend["isVideo"] = call.isVideo
            dataToSend["transactionId"] =   call.omiId
        }

        if (callState != OMICallState.disconnected.rawValue) {
            OmikitPlugin.instance?.sendEvent(withName: CALL_STATE_CHANGED, body: dataToSend)
        }
       
        switch (callState) {
        case OMICallState.confirmed.rawValue:
            if (videoManager == nil && call.isVideo) {
                videoManager = OMIVideoViewManager.init()
            }
            isSpeaker = call.isVideo
            lastStatusCall = "answered"
            OmikitPlugin.instance.sendMuteStatus()
            break
        case OMICallState.incoming.rawValue:
            guestPhone = call.callerNumber ?? ""
            break
        case OMICallState.disconnected.rawValue:
            tempCallInfo = getCallInfo(call: call)
            if (videoManager != nil) {
                videoManager = nil
            }
            lastStatusCall = nil
            guestPhone = ""
            var combinedDictionary: [String: Any] = dataToSend
            if (tempCallInfo != nil && tempCallInfo?.count ?? 0 > 0) {
                combinedDictionary.merge(tempCallInfo ?? [:], uniquingKeysWith: { (_, new) in new })
            }
            OmikitPlugin.instance?.sendEvent(withName: CALL_STATE_CHANGED, body: combinedDictionary )
            lastTimeCall = Date()
            tempCallInfo = [:]
            break
        default:
            break
        }
    }
    
    private func getCallInfo(call: OMICall) -> [String: Any] {
        var direction = "outbound"
        if (guestPhone.count < 10) {
            direction = "inbound"
        }
        let user = OmiClient.getCurrentSip()
        let status = call.callState == .confirmed ? "answered" : "no_answered"
        let timeEnd = Int(Date().timeIntervalSince1970)
        return [
            "transaction_id" : call.omiId,
            "direction" : direction,
            "source_number" : user,
            "destination_number" : guestPhone,
            "time_start_to_answer" : call.createDate,
            "time_end" : timeEnd,
            "sip_user": user,
            "disposition" : lastStatusCall == nil ? "no_answered" : "answered",
            "code_end_call" : call.lastStatus
        ]
    }
    
    
    /// Start call
    func startCall(_ phoneNumber: String, isVideo: Bool, completion: @escaping (_ : String) -> Void) {
        let secondsSinceCurrentTime = lastTimeCall.timeIntervalSinceNow
        guestPhone = phoneNumber
        OmiClient.startCall(phoneNumber, isVideo: isVideo) { status in
            DispatchQueue.main.async {
                let callCurrent = self.omiLib.getCurrentCall()
                     var dataToSend: [String: Any] = [
                                        "status": status.rawValue,
                                        "_id": "",
                                        "message": self.messageCall(type: status.rawValue)
                                    ]

                                    if(callCurrent != nil){
                                        dataToSend["_id"] = String(describing: OmiCallModel(omiCall: callCurrent!).uuid)
                                    }
                                    
                                    if let jsonString = self.convertDictionaryToJson(dictionary: dataToSend) {
                                        completion(jsonString)
                                    } else {
                                        completion("Conversion to JSON failed")
                                    }
                                    return     
            }
        }
    }
    
    /// Start call
    func startCallWithUuid(_ uuid: String, isVideo: Bool, completion: @escaping (_ : String) -> Void) {
        let phoneNumber = OmiClient.getPhone(uuid)
        if let phone = phoneNumber {
            guestPhone = phoneNumber ?? ""
               DispatchQueue.main.async {
                OmiClient.startCall(phone, isVideo: isVideo) { statusCall in
                    let callCurrent = self.omiLib.getCurrentCall()
                        // completion(status.rawValue)
                        var dataToSend: [String: Any] = [
                                        "status": statusCall.rawValue,
                                        "_id": "",
                                        "message": self.messageCall(type: statusCall.rawValue)
                                    ]
                                        if(callCurrent != nil){
                                            dataToSend["_id"] = String(describing: OmiCallModel(omiCall: callCurrent!).uuid)
                                        }
                                    if let jsonString = self.convertDictionaryToJson(dictionary: dataToSend) {
                                        completion(jsonString)
                                    } else {
                                        completion("Conversion to JSON failed")
                                    }
                                    return      
                    
                }
            }
            return
        }
    }
    
    func endAvailableCall() -> [String: Any] {
        guard let call = getAvailableCall() else {
            let callInfo = [
                "status": OMICallState.disconnected.rawValue,
            ]
            OmikitPlugin.instance.sendEvent(withName: CALL_STATE_CHANGED, body: callInfo)
            return [:]
        }
        tempCallInfo = getCallInfo(call: call)
        omiLib.callManager.end(call)
        return tempCallInfo!
    }
    
    func endAllCalls() {
        omiLib.callManager.endAllCalls()
    }
    
    func joinCall() {
        guard let call = getAvailableCall() else {
            return
        }
        OmiClient.answerIncommingCall(call.uuid)
    }
    
    func sendDTMF(character: String) {
        guard let call = getAvailableCall() else {
            return
        }
        try? call.sendDTMF(character)
    }
    
    /// Toogle mtue
    func toggleMute() {
        guard let call = getAvailableCall() else {
            return
        }
        try? call.toggleMute()
    }
    
    /// Toogle hold
    func toggleHold() {
        guard let call = getAvailableCall() else {
            return
        }
        try? call.toggleHold()
    }
    
    /// Toogle speaker
    func toogleSpeaker() {
        if !isSpeaker {
            try? AVAudioSession.sharedInstance().overrideOutputAudioPort(.speaker)
        } else {
            try? AVAudioSession.sharedInstance().overrideOutputAudioPort(.none)
        }
        isSpeaker = !isSpeaker
        OmikitPlugin.instance.sendSpeakerStatus()
    }
    
    func getAudioOutputs() -> [[String: String]] {
        return OmiClient.getAudioInDevices()
    }
    
    func setAudioOutputs(portType: String) {
        return OmiClient.setAudioOutputs(portType)
    }
    
    func getCurrentAudio() -> [[String: String]] {
        return OmiClient.getCurrentAudio()
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
    
    func getLocalPreviewView(frame: CGRect) -> UIView? {
        guard let videoManager = videoManager  else { return nil}
        return videoManager.createView(forVideoLocal: frame)
    }
    
    func getRemotePreviewView(frame: CGRect) -> UIView?  {
        guard let videoManager = videoManager  else { return nil }
        return videoManager.createView(forVideoRemote: frame)
    }
    
    func logout() {
        OmiClient.logout()
    }
    
    func getCurrentUser(completion: @escaping (([String: Any]) -> Void)) {
        if let sip = OmiClient.getCurrentSip() {
            getUserInfo(phone: sip, completion: completion)
        }  else {
            completion([:])
        }
    }
    
    func getGuestUser(completion: @escaping (([String: Any]) -> Void)) {
        getUserInfo(phone: guestPhone, completion: completion)
    }
    
    func getUserInfo(phone: String, completion: @escaping (([String: Any]) -> Void)) {
        if let account = OmiClient.getAccountInfo(phone) as? [String: Any] {
            completion(account)
        } else {
            completion([:])
        }
    }
    
    private func baseInfoFromCall(call: OMICall) -> [String: Any] {
        return [
            "callerNumber": call.callerNumber,
            "isVideo": call.isVideo,
            "transactionId": call.omiId,
        ]
    }
}


