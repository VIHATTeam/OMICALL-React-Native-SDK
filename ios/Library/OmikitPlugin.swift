import Foundation
import React
import OmiKit

@objc(OmikitPlugin)
public class OmikitPlugin: RCTEventEmitter {
  
  @objc public static var instance : OmikitPlugin!
  
  public override init() {
    super.init()
    OmikitPlugin.instance = self
  }
  
  
  // MARK: - Service Methods
  @objc(startServices:rejecter:)
  func startServices(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    CallManager.shareInstance().registerNotificationCenter(showMissedCall: true)
    resolve(true)
  }
  
  @objc(configPushNotification:resolver:rejecter:)
  func configPushNotification(data: Any, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    guard let dataOmi = data as? [String: Any] else {
      reject("INVALID_DATA", "Expected a dictionary with push notification data.", nil)
      return
    }
    CallManager.shareInstance().configNotification(data: dataOmi)
    resolve(true)
  }
  
  
  @objc(getInitialCall:rejecter:)
  func getInitialCall(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    if let call = CallManager.shareInstance().getAvailableCall() {
      let data: [String: Any] = [
        "callerNumber": call.callerNumber,
        "status": call.lastStatus,
        "muted": call.muted,
        "isVideo": call.isVideo
      ]
      resolve(data)
    } else {
      resolve(nil)
    }
  }
  
  // MARK: - Call Methods
  @objc(initCallWithUserPassword:resolver:rejecter:)
  func initCallWithUserPassword(data: Any, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
      // ✅ Bước 1: Kiểm tra dữ liệu đầu vào có đúng định dạng không
      guard let dataOmi = data as? [String: Any] else {
        reject("INVALID_DATA", "Expected a dictionary with user credentials.", nil)
        return
      }
      // ✅ Bước 2: Gọi initWithUserPasswordEndpoint() và kiểm tra kết quả
      let result = CallManager.shareInstance().initWithUserPasswordEndpoint(params: dataOmi)
      if result {
          resolve(true)
      } else {
          reject("INIT_FAILED", "Không thể login vào OMI.", nil)
      }
  }
  
  @objc(initCallWithApiKey:resolver:rejecter:)
  func initCallWithApiKey(data: Any, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    guard let dataOmi = data as? [String: Any] else {
      reject("INVALID_DATA", "Expected a dictionary with API key.", nil)
      return
    }
    let result = CallManager.shareInstance().initWithApiKeyEndpoint(params: dataOmi)
    resolve(result)
  }
  
  
  @objc(startCall:resolver:rejecter:)
  func startCall(data: Any, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
      guard let dataOmi = data as? [String: Any],
            let phoneNumber = dataOmi["phoneNumber"] as? String else {
          reject("INVALID_DATA", "Expected a dictionary with phone number.", nil)
          return
      }

      let isVideo = dataOmi["isVideo"] as? Bool ?? false

      CallManager.shareInstance().startCall(phoneNumber, isVideo: isVideo) { callResult in
          DispatchQueue.main.async {
              if let result = callResult as? String, !result.isEmpty {
                  resolve(result)
              } else {
                  reject("CALL_FAILED", "You have not logged into OMI", nil)
              }
          }
      }
  }
  
  @objc(startCallWithUuid:resolver:rejecter:)
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
  
  @objc(joinCall:rejecter:)
  func joinCall(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    CallManager.shareInstance().joinCall()
    resolve(true)
  }
  
  @objc(endCall:rejecter:)
  func endCall(resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
    CallManager.shareInstance().endCall()
    resolve(true)
  }
  
  @objc(dropCall:rejecter:)
  func dropCall(resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
    CallManager.shareInstance().dropCall()
    resolve(true)
  }

  @objc(toggleMute:rejecter:)
  func toggleMute(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    CallManager.shareInstance().toggleMute()
    if let call = CallManager.shareInstance().getAvailableCall() {
      resolve(call.muted)
    }
    sendMuteStatus()
  }
  
  @objc(toggleSpeaker:rejecter:)
  func toggleSpeaker(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    CallManager.shareInstance().toogleSpeaker()
    resolve(CallManager.shareInstance().isSpeaker)
  }
  
  
  @objc(toggleHold:rejecter:)
  func toggleHold(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    let result = CallManager.shareInstance().toggleHold()
    if let call = CallManager.shareInstance().getAvailableCall() {
      resolve(call.onHold)
    }
    sendHoldStatus()
  }
  
  @objc(sendDTMF:resolver:rejecter:)
  func sendDTMF(data: Any, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    guard let dataOmi = data as? [String: Any],
          let character = dataOmi["character"] as? String else {
      reject("INVALID_DATA", "Expected a dictionary with a 'character' key.", nil)
      return
    }
    
    CallManager.shareInstance().sendDTMF(character: character)
    resolve(true)
  }
  
  
  @objc(switchOmiCamera:rejecter:)
  func switchOmiCamera(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    CallManager.shareInstance().switchCamera()
    resolve(true)
  }
  
  @objc(toggleOmiVideo:rejecter:)
  func toggleOmiVideo(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    CallManager.shareInstance().toggleCamera()
    resolve(true)
  }
  
  
  @objc(logout:rejecter:)
  func logout(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    CallManager.shareInstance().logout()
    resolve(true)
  }
  
  
  @objc(registerVideoEvent:rejecter:)
  func registerVideoEvent(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    CallManager.shareInstance().registerVideoEvent()
    resolve(true)
  }
  
  @objc(removeVideoEvent:rejecter:)
  func removeVideoEvent(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    CallManager.shareInstance().removeVideoEvent()
    resolve(true)
  }
  
  @objc(getCurrentUser:rejecter:)
  func getCurrentUser(resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
    CallManager.shareInstance().getCurrentUser { user in
      resolve(user)
    }
  }
  
  @objc(getGuestUser:rejecter:)
  func getGuestUser(resolve: @escaping RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) -> Void {
    CallManager.shareInstance().getGuestUser { user in
      resolve(user)
    }
  }
  
  @objc(getUserInfor:resolver:rejecter:)
  func getUserInfor(data: Any, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    guard let phone = data as? String else {
      reject("INVALID_DATA", "Expected a phone number as a string.", nil)
      return
    }
    
    CallManager.shareInstance().getUserInfo(phone: phone) { userInfo in
      if userInfo.isEmpty {
        reject("USER_NOT_FOUND", "User not found for phone number: \(phone)", nil)
      } else {
        resolve(userInfo)
      }
    }
  }
  
  // MARK: - Audio Methods
  @objc(getAudio:rejecter:)
  func getAudio(resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let audios = CallManager.shareInstance().getAudioOutputs()
    resolve(audios)
  }
  
  @objc(setAudio:resolver:rejecter:)
  func setAudio(data: Any, resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    guard let dataOmi = data as? [String: Any],
          let portType = dataOmi["portType"] as? String else {
      reject("INVALID_DATA", "Expected a dictionary with port type.", nil)
      return
    }
    
    CallManager.shareInstance().setAudioOutputs(portType: portType)
    resolve(true)
  }
  
  
  @objc(getCurrentAudio:rejecter:)
  func getCurrentAudio(resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let currentAudio = CallManager.shareInstance().getCurrentAudio()
    resolve(currentAudio)
  }
  
  func sendMuteStatus() {
    if let call = CallManager.shareInstance().getAvailableCall() {
      sendEvent(withName: MUTED, body: call.muted)
    }
  }

  func sendHoldStatus() {
    if let call = CallManager.shareInstance().getAvailableCall() {
      sendEvent(withName: HOLD, body: call.onHold)
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
  
  
  @objc(transferCall:resolver:rejecter:)
  func transferCall(data: Any, resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    guard let dataOmi = data as? [String: Any],
          let phoneNumber = dataOmi["phoneNumber"] as? String else {
      reject("INVALID_DATA", "Expected a dictionary with phone number.", nil)
      return
    }
    
    CallManager.shareInstance().transferCall(phoneNumber)
    resolve(true)
  }
  
  
  @objc(rejectCall:rejecter:)
  func rejectCall(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
      do {
          let result = try CallManager.shareInstance().rejectCall()
          resolve(result) // Trả về kết quả thành công cho React Native
      } catch let error as NSError {
          reject("REJECT_CALL_ERROR", "Failed to reject call", error) // Trả về lỗi nếu xảy ra
      }
  }
  
  
  
  public override func supportedEvents() -> [String]! {
    return [
      CALL_STATE_CHANGED,
      MUTED,
      HOLD,
      SPEAKER,
      REMOTE_VIDEO_READY,
      CLICK_MISSED_CALL,
      SWITCHBOARD_ANSWER,
      CALL_QUALITY,
      AUDIO_CHANGE,
    ]
  }
}
