import Foundation
import AVFoundation
import SwiftUI
import OmiKit

public class OmiUtils {

    static private var instance: OmiUtils? = nil // Instance

    static func shareInstance() -> OmiUtils {
        if (instance == nil) {
           instance = OmiUtils()
        }
        return instance!
    }

    func convertDictionaryToJson(dictionary: [String: Any]) -> String? {
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: dictionary, options: [])
            if let jsonString = String(data: jsonData, encoding: .utf8) {
                return jsonString
            }
        } catch {
            print("Error converting dictionary to JSON: \(error)")
        }
        return nil
    }

    func messageCall(type: Int) -> String {
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
}
