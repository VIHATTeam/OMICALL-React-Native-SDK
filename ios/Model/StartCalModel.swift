
import Foundation
import SwiftUI

class StartCalModel {
    var status: Int = 0
    var callInfo: OmiCallModel?
    var message: String?

    init(status: Int, callInfo: OmiCallModel, message:String) {
        self.status =  status
        self.callInfo = callInfo
        self.message = message
    }


}
