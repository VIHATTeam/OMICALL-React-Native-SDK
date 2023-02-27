
import Foundation

extension String {
    
    func fromBase64() -> String {
        guard let data = Foundation.Data(base64Encoded: self) else {
            return ""
        }
        
        return String(data: data, encoding: .utf8)!
    }
    
    func toBase64() -> String {
        return Foundation.Data(self.utf8).base64EncodedString()
    }

}
