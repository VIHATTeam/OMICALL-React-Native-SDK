import Foundation
import OmiKit

struct OmiCallModel: Hashable {
    var callId: Int
    var incoming: Bool = false
    var callState: Int = 0
    var callerNumber: String
    var isVideo: Bool = false
    var omiId: String
    var uuid: String
    var callerName: String
    var muted: Bool = false
    var speaker: Bool = false
    var onHold: Bool = false
    var numberToCall: String
    var connected: Bool
    var totalMBsUsed: Double = 0.0
    var mos: Double = 0.0
    var latency: Double = 0.0
    var jitter: Double = 0.0
    var ppl: Double = 0.0

    init(omiCall: OmiCallModel){
        self.callId = omiCall.callId
        self.incoming = omiCall.incoming
        self.callState = omiCall.callState
        self.callerNumber = omiCall.callerNumber
        self.isVideo = omiCall.isVideo
        self.omiId = omiCall.omiId
        self.uuid = omiCall.uuid
        self.callerName = omiCall.callerName
        self.muted = omiCall.muted
        self.speaker = omiCall.speaker
        self.onHold = omiCall.onHold
        self.numberToCall = omiCall.numberToCall
        self.connected = omiCall.connected
        self.totalMBsUsed = omiCall.totalMBsUsed
        self.mos = omiCall.mos
        self.latency = omiCall.latency
        self.jitter = omiCall.jitter
        self.ppl = omiCall.ppl
    }

    init(omiCall: OMICall){
        self.callId = omiCall.callId
        self.incoming = omiCall.isIncoming
        self.callState =  omiCall.callState.rawValue ?? 0
        self.callerNumber = omiCall.callerNumber ?? ""
        self.isVideo = omiCall.isVideo
        self.omiId = omiCall.omiId ?? ""
        self.uuid = omiCall.uuid.uuidString
        self.callerName = omiCall.callerName ?? ""
        self.muted = omiCall.muted
        self.speaker = omiCall.speaker
        self.onHold = omiCall.onHold
        self.numberToCall = omiCall.numberToCall
        self.connected = omiCall.connected
        self.totalMBsUsed = Double(omiCall.totalMBsUsed)
        self.mos = Double(omiCall.mos)
        self.latency = Double(omiCall.latency)
        self.jitter = Double(omiCall.jitter)
        self.ppl = Double(omiCall.ppl)
    }

}
