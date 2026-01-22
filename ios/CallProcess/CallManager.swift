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
  // Use lazy initialization to avoid crash during New Architecture module loading
  private lazy var omiLib: OMISIPLib = {
    return OMISIPLib.sharedInstance()
  }()
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
      if let callInfo = omiLib.getCurrentConfirmCall() {
        if callInfo.callState != .disconnected {
          callInfo.blindTransferCall(withNumber: phoneNumber);
          result = true
        }
      }
    } catch let error {
      print("ERROR_WHEN_TRANSFER_CALL_IOS: ", error)
    }
    return result
  }
  
  
  func endCall(){
    do {
      if let callInfo = omiLib.getCurrentCall() {
        if callInfo.callState != .disconnected {
          omiLib.callManager.end(callInfo) { error in
            if error != nil {
            }
          }
        }
      }
    } catch let error {
      print("ERROR_WHEN_TRANSFER_CALL_IOS: ", error)
    }
  }
  
  func rejectCall() -> Bool {
    do {
      if let callInfo = omiLib.getCurrentCall(), callInfo.callState != .disconnected {
        if callInfo.callState == .confirmed {
          try callInfo.hangup()
        } else {
          try callInfo.decline(withBusyHere: true)  // 486
        }
        return true
      }
    } catch {
      print("ERROR_WHEN_TRANSFER_CALL_IOS:", error)
    }
    return false
  }

  func dropCall() -> Bool {
    do {
      if let callInfo = omiLib.getCurrentCall(), callInfo.callState != .disconnected {
        if callInfo.callState == .confirmed {
          omiLib.callManager.end(callInfo) { error in
            if error != nil {
            }
          }
        } else {
          try callInfo.drop()  // 603
        }
        return true
      }
    } catch {
      print("ERROR_WHEN_TRANSFER_CALL_IOS:", error)
    }
    return false
  }
  
  func configNotification(data: [String: Any]) {
    let user = UserDefaults.standard
    if let title = data["missedCallTitle"] as? String,
      let message = data["prefixMissedCallMessage"] as? String
    {
      user.set(title, forKey: "omicall/missedCallTitle")
      user.set(message, forKey: "omicall/prefixMissedCallMessage")
    }

    let isUserBusy = data["isUserBusy"] as? Bool ?? true
    OmiClient.configureDeclineCallBehavior(isUserBusy)

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
      if let projectID =  params["projectId"] as? String, !projectID.isEmpty {
        OmiClient.setFcmProjectId(projectID)
      }
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
      // Kiểm tra thông tin đầu vào
      guard let userName = params["userName"] as? String,
            let password = params["password"] as? String,
            let realm = params["realm"] as? String,
            let token = params["fcmToken"] as? String else {
          print("🚨 Lỗi: Thiếu thông tin đăng nhập!")
          return false
      }


      // Nếu `projectId` có giá trị, thiết lập Project ID cho FCM
      if let projectID = params["projectId"] as? String, !projectID.isEmpty {
          OmiClient.setFcmProjectId(projectID)
      }

      // Thử khởi tạo OmiClient với username & password
      do {
          try OmiClient.initWithUsername(userName, password: password, realm: realm, proxy: "")
      } catch {
          print("🚨 Lỗi khởi tạo OmiClient: \(error.localizedDescription)")
          return false
      }

      // Thiết lập FCM Token cho user
      OmiClient.setUserPushNotificationToken(token)

      // Đảm bảo requestPermission chạy trên main thread
      let isVideo = (params["isVideo"] as? Bool) ?? false
      if isVideo {
        DispatchQueue.main.async { [weak self] in
            guard let strongSelf = self else {
                print("⚠️ Không thể gọi requestPermission vì self đã bị giải phóng!")
                return
            }
            strongSelf.requestPermission(isVideo: isVideo)
        }
      }

      return true
  }
  
  func showMissedCall() {
    OmiClient.setMissedCall { call in
      UNUserNotificationCenter.current().getNotificationSettings { settings in
        switch settings.authorizationStatus {
        case .notDetermined:
          break
        case .authorized, .provisional:
          if call == nil {
            return // No missed call to show
          }

          let statusAnswer = OmiClient.checkHasShowMissedCall(call.omiId ?? "")
          if (!statusAnswer) {
            return // Do not show missed call notification 
          }
          
          // Lý do không cần hiển thị
          switch call.terminateReason {
          case .callCompletedElsewhere:
            return
          case .originatorCancel, .unknown:
            break // Tiếp tục show
          default:
            return
          }
          
          let user = UserDefaults.standard
          let title = user.string(forKey: "omicall/missedCallTitle") ?? ""
          let message = user.string(forKey: "omicall/prefixMissedCallMessage") ?? ""
          let content      = UNMutableNotificationContent()
          content.title    = title

          if let nameCallerNumber = call.callerNumber { 
            let callerName = call.callerName ?? ""
            let nameShow =  callerName.count > 0 ? callerName : nameCallerNumber
              content.body = message.isEmpty ? nameShow : "\(message) \(nameShow)"
          } else {
              content.body = "\(message) \(call.callerNumber!)"
          }

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
      guard let self = self, let instance = CallManager.instance else { return }
      NotificationCenter.default.removeObserver(instance)
      NotificationCenter.default.addObserver(instance,
                                             selector: #selector(self.callStateChanged(_:)),
                                             name: NSNotification.Name.OMICallStateChanged,
                                             object: nil
      )
      NotificationCenter.default.addObserver(instance,
                                             selector: #selector(self.callDealloc(_:)),
                                             name: NSNotification.Name.OMICallDealloc,
                                             object: nil
      )
      NotificationCenter.default.addObserver(instance,
                                             selector: #selector(self.switchBoardAnswer(_:)),
                                             name: NSNotification.Name.OMICallSwitchBoardAnswer,
                                             object: nil
      )
      NotificationCenter.default.addObserver(instance, selector: #selector(self.updateNetworkHealth(_:)), name: NSNotification.Name.OMICallNetworkQuality, object: nil)
      NotificationCenter.default.addObserver(instance, selector: #selector(self.audioChanged(_:)), name: NSNotification.Name.OMICallAudioRouteChange, object: nil)
      if (showMissedCall) {
        self.showMissedCall()
      }
    }
  }
  
  func registerVideoEvent() {
    DispatchQueue.main.async { [weak self] in
      guard let self = self, let instance = CallManager.instance else { return }
      NotificationCenter.default.addObserver(instance,
                                             selector: #selector(self.videoUpdate(_:)),
                                             name: NSNotification.Name.OMICallVideoInfo,
                                             object: nil
      )
    }
  }
  
  func removeVideoEvent() {
    DispatchQueue.main.async {
      guard let instance = CallManager.instance else { return }
      NotificationCenter.default.removeObserver(instance, name: NSNotification.Name.OMICallVideoInfo, object: nil)
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
    OmikitPlugin.instance?.sendEvent(withName: CALL_QUALITY, body: ["quality": state])
  }
  
  @objc func videoUpdate(_ notification: NSNotification) {
    guard let userInfo = notification.userInfo,
          let state = userInfo[OMIVideoInfoState] as? Int else {
      return;
    }
    switch (state) {
    case 1:
      OmikitPlugin.instance?.sendEvent(withName: REMOTE_VIDEO_READY, body: nil)
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
    OmikitPlugin.instance?.sendEvent(withName: SWITCHBOARD_ANSWER, body: ["sip": sip])
  }
  
  @objc func callDealloc(_ notification: NSNotification) {
    if (tempCallInfo != nil) {
      tempCallInfo!["status"] = OMICallState.disconnected.rawValue
      OmikitPlugin.instance?.sendEvent(withName: CALL_STATE_CHANGED, body: tempCallInfo!)
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
      "_id": "",
      "typeNumber": ""
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
      dataToSend["typeNumber"] = OmiUtils.checkTypeNumber(phoneNumber: call.callerNumber ?? "")
    }
    
    if (callState != OMICallState.disconnected.rawValue) {
      OmikitPlugin.instance?.sendEvent(withName: CALL_STATE_CHANGED, body: dataToSend)
    }
    
    switch (callState) {
    case OMICallState.confirmed.rawValue:
      if (videoManager == nil && call.isVideo) {
        videoManager = OMIVideoViewManager.init()
      }
      isSpeaker = call.speaker
      lastStatusCall = "answered"
      OmikitPlugin.instance?.sendMuteStatus()
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
      "code_end_call" : call.lastStatus,

      "transactionId" : call.omiId,
      "sourceNumber" : user,
      "destinationNumber" : guestPhone,
      "timeStartToAnswer" : call.createDate,
      "timeEnd" : timeEnd,
      "sipUser": user,
      "codeEndCall" : call.lastStatus
    ]
  }
  
  
  /// Start call
func startCall(_ phoneNumber: String, isVideo: Bool, completion: @escaping (_: String) -> Void) {
    let secondsSinceCurrentTime = lastTimeCall.timeIntervalSinceNow
    guestPhone = phoneNumber
    var isCompletionCalled = false // ✅ Biến kiểm soát callback để tránh gọi nhiều lần

    OmiClient.startCall(phoneNumber, isVideo: isVideo) { status in
        DispatchQueue.main.async {
            if isCompletionCalled { return } // ✅ Nếu callback đã gọi trước đó thì không thực hiện tiếp

            var dataToSend: [String: Any] = [
                "status": status.rawValue,
                "_id": "",
                "message": OmiUtils.messageCall(type: status.rawValue),
                "message_detail": OmiUtils.messageCallDetail(type: status.rawValue)
            ]

            // ✅ Kiểm tra và lấy ID cuộc gọi nếu có
            if let callCurrent = self.omiLib.getCurrentCall() {
                dataToSend["_id"] = String(describing: OmiCallModel(omiCall: callCurrent).uuid)
            }

            // ✅ Chuyển đổi Dictionary sang JSON
            if let jsonString = OmiUtils.convertDictionaryToJson(dictionary: dataToSend) {
                completion(jsonString)
            } else {
                completion("{\"status\": \"error\", \"message\": \"JSON conversion failed\"}")
            }

            isCompletionCalled = true // ✅ Đánh dấu callback đã được gọi
        }
    }
}
  
  
  /// Start call
  func startCallWithUuid(_ uuid: String, isVideo: Bool, completion: @escaping (_ : String) -> Void) {
    let phoneNumber = OmiClient.getPhone(uuid)
    if let phone = phoneNumber {
      guestPhone = phoneNumber ?? ""
        OmiClient.startCall(phone, isVideo: isVideo) {  statusCall in
          let callCurrent = self.omiLib.getCurrentCall()
          // completion(status.rawValue)
          var dataToSend: [String: Any] = [
            "status": statusCall.rawValue,
            "_id": "",
            "message": OmiUtils.messageCall(type: statusCall.rawValue),
            "message_detail": OmiUtils.messageCallDetail(type: statusCall.rawValue)
          ]
          if(callCurrent != nil){
            dataToSend["_id"] = String(describing: OmiCallModel(omiCall: callCurrent!).uuid)
          }
          if let jsonString = OmiUtils.convertDictionaryToJson(dictionary: dataToSend) {
            completion(jsonString)
          } else {
             completion("{\"status\": \"error\", \"message\": \"JSON conversion failed\"}")
          }
          return
          
        }
      
      return
    } else {
       var dataToSend: [String: Any] = [
            "status": 0,
            "_id": "",
            "message": "INVALID_UUID",
            "message_detail": "UUID does not exist"
          ]
          if let jsonString = OmiUtils.convertDictionaryToJson(dictionary: dataToSend) {
            completion(jsonString)
          } else {
           completion("{\"status\": \"error\", \"message\": \"JSON conversion failed\"}")
          }
          return
    }
  }
  
  func endAvailableCall() -> [String: Any] {
    guard let call = getAvailableCall() else {
      let callInfo = [
        "status": OMICallState.disconnected.rawValue,
      ]
      OmikitPlugin.instance?.sendEvent(withName: CALL_STATE_CHANGED, body: callInfo)
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
  func toggleHold() -> Bool {
    guard let call = getAvailableCall() else {
      return false // Không có cuộc gọi khả dụng
    }
    
    do {
      try call.toggleHold()
      return true // Thành công
    } catch {
      print("Error toggling hold: \(error)")
      return false // Thất bại
    }
  }
  
  /// Toogle speaker
  func toogleSpeaker() {
    let result = omiLib.callManager.audioController.toggleSpeaker();
    isSpeaker = result
    OmikitPlugin.instance?.sendSpeakerStatus()
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


