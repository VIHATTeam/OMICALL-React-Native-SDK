import Foundation
import AVFoundation
import SwiftUI
import OmiKit
import Combine

public class OmiUtils {

    static private var instance: OmiUtils? = nil // Instance

    static func shareInstance() -> OmiUtils {
        if (instance == nil) {
           instance = OmiUtils()
        }
        return instance!
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
            case 10:
                return "EXTENSION_NUMBER_IS_OFF"
            default:
                return "START_CALL_SUCCESS"
        }
    }
  
  
  /// Chuyển đổi Dictionary thành JSON String
    static func convertDictionaryToJson(dictionary: [String: Any]) -> String? {
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: dictionary, options: [])
            return String(data: jsonData, encoding: .utf8)
        } catch {
            print("⚠️ Lỗi khi chuyển đổi dictionary sang JSON: \(error.localizedDescription)")
            return nil
        }
    }
  
  /// Trả về thông điệp lỗi tương ứng với mã lỗi của cuộc gọi
    static func messageCall(type: Int) -> String {
        switch type {
        case 0: return "INVALID_UUID"
        case 1: return "INVALID_PHONE_NUMBER"
        case 2: return "SAME_PHONE_NUMBER_WITH_PHONE_REGISTER"
        case 3: return "MAX_RETRY"
        case 4: return "PERMISSION_DENIED"
        case 5: return "COULD_NOT_FIND_END_POINT"
        case 6: return "REGISTER_ACCOUNT_FAIL"
        case 7: return "START_CALL_FAIL"
        case 9: return "HAVE_ANOTHER_CALL"
        case 10: return "EXTENSION_NUMBER_IS_OFF"
        default: return "START_CALL_SUCCESS"
        }
    }

    /// trả về mã lỗi chi tiết
    static func messageCallDetail(type: Int) -> String {
        switch type {
        case 0: return "UUID đang trống hoặc không chính xác"
        case 1: return "SIP_USER đang trống hoặc không chính xác"
        case 2: return "Bạn đang gọi chính mình"
        case 3: return "Vượt quá số lần gọi, vui lòng thử lại sau 2s"
        case 4: return "Bạn chưa cấp quyền"
        case 5: return "Vui lòng log in vào OMI"
        case 6: return "Đăng nhập vào OMI thất bại, thông tin đăng nhập không chính xác"
        case 7: return "Khởi tạo cuộc gọi không thành công"
        case 9: return "Có một cuộc gọi khác chưa kết thúc"
        case 10: return "Số nội bộ đã tắt"
        default: return "Khởi tạo cuộc gọi thành công"
        }
    }

    static func checkTypeNumber(phoneNumber: String) -> String {
        var result = "phone"

        if phoneNumber.count < 8 {
            result = "internal"
        } else if phoneNumber.rangeOfCharacter(from: CharacterSet.letters) != nil &&
                    phoneNumber.rangeOfCharacter(from: CharacterSet.decimalDigits) != nil {
            result = "zalo"
        }

        return result
    }

}
