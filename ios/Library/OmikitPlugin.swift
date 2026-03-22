import Foundation
import React
import OmiKit

#if RCT_NEW_ARCH_ENABLED
import React_Codegen
#endif

@objc(OmikitPlugin)
public class OmikitPlugin: RCTEventEmitter {

  @objc public static var instance : OmikitPlugin!

  public override init() {
    super.init()
    OmikitPlugin.instance = self
  }

  // TurboModule conformance
  #if RCT_NEW_ARCH_ENABLED
  @objc public static func moduleName() -> String {
    return "OmikitPlugin"
  }
  #endif

  @objc public override static func moduleName() -> String! {
    return "OmikitPlugin"
  }

  // Export constants for event names
  @objc public override func constantsToExport() -> [AnyHashable : Any]! {
    return [
      "CALL_STATE_CHANGED": CALL_STATE_CHANGED,
      "MUTED": MUTED,
      "HOLD": HOLD,
      "SPEAKER": SPEAKER,
      "REMOTE_VIDEO_READY": REMOTE_VIDEO_READY,
      "CLICK_MISSED_CALL": CLICK_MISSED_CALL,
      "SWITCHBOARD_ANSWER": SWITCHBOARD_ANSWER,
      "CALL_QUALITY": CALL_QUALITY,
      "AUDIO_CHANGE": AUDIO_CHANGE,
      "REQUEST_PERMISSION": REQUEST_PERMISSION
    ]
  }
  
  
  // MARK: - Service Methods
  @objc(startServices:rejecter:)
  func startServices(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // Ensure instance is set for callbacks
    if OmikitPlugin.instance == nil {
      OmikitPlugin.instance = self
    }

    DispatchQueue.main.async {
      CallManager.shareInstance().registerNotificationCenter(showMissedCall: true)
      resolve(true)
    }
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
  
  
  @objc(getInitialCall:resolver:rejecter:)
  func getInitialCall(_ data: Any, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
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
  
  
  // Configure camera view style (iOS Fabric mode — native window rendering)
  // target: "local" or "remote"
  @objc(setCameraConfig:resolver:rejecter:)
  func setCameraConfig(_ data: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let target = data["target"] as? String ?? "local"

    DispatchQueue.main.async {
      let callManager = CallManager.shareInstance()
      let view: UIView?
      if target == "remote" {
        view = callManager.remoteContainerView
      } else {
        view = callManager.localContainerView
      }

      guard let targetView = view else {
        resolve(false)
        return
      }

      // Frame: x, y, width, height
      if let x = data["x"] as? CGFloat,
         let y = data["y"] as? CGFloat,
         let width = data["width"] as? CGFloat,
         let height = data["height"] as? CGFloat {
        targetView.frame = CGRect(x: x, y: y, width: width, height: height)
      }

      // Border radius
      if let borderRadius = data["borderRadius"] as? CGFloat {
        targetView.layer.cornerRadius = borderRadius
        targetView.clipsToBounds = true
      }

      // Border width + color
      if let borderWidth = data["borderWidth"] as? CGFloat {
        targetView.layer.borderWidth = borderWidth
      }
      if let borderColor = data["borderColor"] as? String {
        targetView.layer.borderColor = Self.parseColor(borderColor).cgColor
      }

      // Background color
      if let bgColor = data["backgroundColor"] as? String {
        targetView.backgroundColor = Self.parseColor(bgColor)
      }

      // Opacity
      if let opacity = data["opacity"] as? CGFloat {
        targetView.alpha = opacity
      }

      // Hidden
      if let hidden = data["hidden"] as? Bool {
        targetView.isHidden = hidden
      }

      // Scale mode (contentMode for video sublayers)
      // "fill" = aspect fill, "fit" = aspect fit, "stretch" = scale to fill
      if let scaleMode = data["scaleMode"] as? String {
        let mode: UIView.ContentMode
        switch scaleMode {
        case "fit":
          mode = .scaleAspectFit
        case "stretch":
          mode = .scaleToFill
        default: // "fill"
          mode = .scaleAspectFill
        }
        targetView.contentMode = mode
        // Apply to all sublayers/subviews (Metal/GL rendering layers)
        for subview in targetView.subviews {
          subview.contentMode = mode
        }
      }

      resolve(true)
    }
  }

  // Parse hex color string (#RRGGBB or #RRGGBBAA) to UIColor
  private static func parseColor(_ hex: String) -> UIColor {
    var hexStr = hex.trimmingCharacters(in: .whitespacesAndNewlines)
    if hexStr.hasPrefix("#") { hexStr.removeFirst() }
    var rgbValue: UInt64 = 0
    Scanner(string: hexStr).scanHexInt64(&rgbValue)
    if hexStr.count == 8 {
      return UIColor(
        red: CGFloat((rgbValue >> 24) & 0xFF) / 255.0,
        green: CGFloat((rgbValue >> 16) & 0xFF) / 255.0,
        blue: CGFloat((rgbValue >> 8) & 0xFF) / 255.0,
        alpha: CGFloat(rgbValue & 0xFF) / 255.0
      )
    }
    return UIColor(
      red: CGFloat((rgbValue >> 16) & 0xFF) / 255.0,
      green: CGFloat((rgbValue >> 8) & 0xFF) / 255.0,
      blue: CGFloat(rgbValue & 0xFF) / 255.0,
      alpha: 1.0
    )
  }

  // Create video containers and add to window — called from JS when video call screen mounts.
  // On Fabric, RCTViewManager.view() is NOT called, so we create containers here.
  // Remote covers top portion of screen, local is PiP. User can adjust via setCameraConfig().
  @objc(setupVideoContainers:rejecter:)
  func setupVideoContainers(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    NSLog("📹 [OmikitPlugin] setupVideoContainers: CALLED from JS")
    DispatchQueue.main.async {
      NSLog("📹 [OmikitPlugin] setupVideoContainers: on main thread")
      let manager = CallManager.shareInstance()

      guard let window = UIApplication.shared.windows.first(where: { $0.isKeyWindow }) else {
        resolve(false)
        return
      }

      // Create remote container
      if manager.remoteContainerView == nil {
        let remote = UIView()
        remote.backgroundColor = .black
        remote.clipsToBounds = true
        manager.remoteContainerView = remote
      }
      // Create local container
      if manager.localContainerView == nil {
        let local = UIView()
        local.backgroundColor = UIColor(red: 0.118, green: 0.192, blue: 0.314, alpha: 1.0)
        local.clipsToBounds = true
        local.layer.cornerRadius = 12
        manager.localContainerView = local
      }

      guard let remote = manager.remoteContainerView,
            let local = manager.localContainerView else {
        resolve(false)
        return
      }

      // Add to window if not already
      if remote.superview == nil {
        let controlsHeight: CGFloat = 200
        remote.frame = CGRect(x: 0, y: 0, width: window.bounds.width, height: window.bounds.height - controlsHeight)
        remote.autoresizingMask = [.flexibleWidth, .flexibleBottomMargin]
        remote.isUserInteractionEnabled = false
        window.addSubview(remote)
        NSLog("📹 [OmikitPlugin] setupVideoContainers: added remote to window")
      }
      if local.superview == nil {
        let pipW: CGFloat = 120
        let pipH: CGFloat = 160
        local.frame = CGRect(x: window.bounds.width - pipW - 16, y: 56, width: pipW, height: pipH)
        local.autoresizingMask = [.flexibleLeftMargin, .flexibleBottomMargin]
        local.isUserInteractionEnabled = false
        window.addSubview(local)
        NSLog("📹 [OmikitPlugin] setupVideoContainers: added local to window")
      }

      // Trigger SDK video setup
      manager.setupVideo()
      resolve(true)
    }
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

  /// Find a UIView by nativeID in the view hierarchy
  private func findViewByNativeID(_ nativeID: String, in root: UIView?) -> UIView? {
    guard let root = root else { return nil }
    if root.accessibilityIdentifier == nativeID {
      return root
    }
    for subview in root.subviews {
      if let found = findViewByNativeID(nativeID, in: subview) {
        return found
      }
    }
    return nil
  }

  @objc(attachRemoteView:resolver:rejecter:)
  func attachRemoteView(_ nativeID: String, resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      let manager = CallManager.shareInstance()
      guard let window = UIApplication.shared.windows.first(where: { $0.isKeyWindow }),
            let targetView = self.findViewByNativeID(nativeID, in: window) else {
        NSLog("📹 [OmikitPlugin] attachRemoteView: view with nativeID=\(nativeID) not found")
        resolve(false)
        return
      }
      let container = manager.remoteContainerView ?? {
        let v = UIView()
        v.backgroundColor = .black
        v.clipsToBounds = true
        manager.remoteContainerView = v
        return v
      }()
      container.removeFromSuperview()
      container.frame = targetView.bounds
      container.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      targetView.addSubview(container)
      NSLog("📹 [OmikitPlugin] Attached remote container to view nativeID=\(nativeID)")
      manager.setupVideo()
      resolve(true)
    }
  }

  @objc(attachLocalView:resolver:rejecter:)
  func attachLocalView(_ nativeID: String, resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      let manager = CallManager.shareInstance()
      guard let window = UIApplication.shared.windows.first(where: { $0.isKeyWindow }),
            let targetView = self.findViewByNativeID(nativeID, in: window) else {
        NSLog("📹 [OmikitPlugin] attachLocalView: view with nativeID=\(nativeID) not found")
        resolve(false)
        return
      }
      let container = manager.localContainerView ?? {
        let v = UIView()
        v.backgroundColor = UIColor(red: 0.118, green: 0.192, blue: 0.314, alpha: 1.0)
        v.clipsToBounds = true
        v.layer.cornerRadius = 12
        manager.localContainerView = v
        return v
      }()
      container.removeFromSuperview()
      container.frame = targetView.bounds
      container.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      targetView.addSubview(container)
      NSLog("📹 [OmikitPlugin] Attached local container to view nativeID=\(nativeID)")
      manager.setupVideo()
      resolve(true)
    }
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
  
  @objc(getUserInfo:resolver:rejecter:)
  func getUserInfo(data: Any, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    // Support both {phone: "xxx"} object and direct string
    let phone: String
    if let dict = data as? [String: Any], let p = dict["phone"] as? String {
      phone = p
    } else if let p = data as? String {
      phone = p
    } else {
      reject("INVALID_DATA", "Expected a dictionary with phone key or a phone number string.", nil)
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

  // MARK: - Getter Functions
  @objc(getProjectId:rejecter:)
  func getProjectId(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    resolve(OmiClient.getProjectId())
  }

  @objc(getSipInfo:rejecter:)
  func getSipInfo(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    resolve(OmiClient.getSipInfo())
  }

  @objc(getDeviceId:rejecter:)
  func getDeviceId(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    resolve(OmiClient.getDeviceId())
  }

  @objc(getFcmToken:rejecter:)
  func getFcmToken(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    resolve(OmiClient.getFcmToken())
  }

  @objc(getAppId:rejecter:)
  func getAppId(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    resolve(OmiClient.getAppId())
  }

  @objc(getVoipToken:rejecter:)
  func getVoipToken(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) -> Void {
    resolve(OmiClient.getVoipToken())
  }

  // MARK: - Audio Methods
  @objc(getAudio:rejecter:)
  func getAudio(resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let audios = CallManager.shareInstance().getAudioOutputs()
    resolve(audios)
  }
  
  @objc(setAudio:resolver:rejecter:)
  func setAudio(data: Any, resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    guard let dataOmi = data as? [String: Any] else {
      reject("INVALID_DATA", "Expected a dictionary with port type.", nil)
      return
    }
    // Support both number and string for portType
    let portType: String
    if let pt = dataOmi["portType"] as? String {
      portType = pt
    } else if let pt = dataOmi["portType"] as? NSNumber {
      portType = pt.stringValue
    } else {
      reject("INVALID_DATA", "portType must be a number or string.", nil)
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
      REQUEST_PERMISSION
    ]
  }

  // MARK: - Stub Methods for TurboModule Compatibility
  // These methods are Android-only but required by Codegen spec

  @objc(onHold:resolver:rejecter:)
  func onHold(data: Any, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    // iOS uses toggleHold instead
    resolve(true)
  }

  @objc(hideSystemNotificationSafely:rejecter:)
  func hideSystemNotificationSafely(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    // Android-only feature
    resolve(true)
  }

  @objc(hideSystemNotificationOnly:rejecter:)
  func hideSystemNotificationOnly(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    // Android-only feature
    resolve(true)
  }

  @objc(hideSystemNotificationAndUnregister:resolver:rejecter:)
  func hideSystemNotificationAndUnregister(data: Any, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    // Android-only feature
    resolve(true)
  }

  @objc(checkAndRequestPermissions:resolver:rejecter:)
  func checkAndRequestPermissions(data: Any, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    // Android-only feature, iOS handles permissions differently
    resolve(true)
  }

  @objc(checkPermissionStatus:rejecter:)
  func checkPermissionStatus(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    // Android-only feature
    resolve(nil)
  }

  @objc(requestPermissionsByCodes:resolver:rejecter:)
  func requestPermissionsByCodes(data: Any, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    // Android-only feature
    resolve(true)
  }

  @objc(systemAlertWindow:rejecter:)
  func systemAlertWindow(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    // Android-only feature
    resolve(true)
  }

  @objc(requestSystemAlertWindowPermission:rejecter:)
  func requestSystemAlertWindowPermission(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    // Android-only feature
    resolve(true)
  }

  @objc(openSystemAlertSetting:rejecter:)
  func openSystemAlertSetting(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    // Android-only feature
    resolve(nil)
  }

  @objc(checkCredentials:resolver:rejecter:)
  func checkCredentials(data: Any, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    // Stub for iOS - not implemented yet
    resolve([
      "success": true,
      "statusCode": 200,
      "message": "iOS stub"
    ])
  }

  @objc(registerWithOptions:resolver:rejecter:)
  func registerWithOptions(data: Any, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    // Stub for iOS - not implemented yet
    resolve([
      "success": true,
      "statusCode": 200,
      "message": "iOS stub"
    ])
  }

  @objc(getKeepAliveStatus:rejecter:)
  func getKeepAliveStatus(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    // Android-only feature
    resolve([
      "isActive": false,
      "platform": "ios"
    ])
  }

  @objc(triggerKeepAlivePing:rejecter:)
  func triggerKeepAlivePing(resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    // Android-only feature
    resolve(true)
  }
}
