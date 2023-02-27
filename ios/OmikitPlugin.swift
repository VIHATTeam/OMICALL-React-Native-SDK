import Foundation

@objc(OmikitPlugin)
class OmikitPlugin: NSObject {
    @objc(initCall:withResolver:withRejecter:)
    func initCall(data: Any, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        if let dataOmi = data as? [String: Any] {
            CallManager.shareInstance().initEndpoint(params: dataOmi)
            resolve(true)
        }
    }
    @objc(updateToken:withResolver:withRejecter:)
    func updateToken(data: Any, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        if let dataOmi = data as? [String: Any] {
            CallManager.shareInstance().updateToken(params: dataOmi)
            resolve(true)
        }
    }
}
