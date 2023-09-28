//
//  CallState.swift
//  omicall_flutter_plugin
//
//  Created by PRO 2019 16' on 25/05/2023.
//

import Foundation

enum CallStateStatus: Int {
    case null = 0
    case calling = 1
    case incoming = 2
    case early = 3
    case connecting = 4
    case confirmed = 5
    case disconnected = 6
    case hold = 7
}

enum CallState: Int {
    case calling = 0
    case early
    case connecting
    case confirmed
    case incoming
    case disconnected
    case hold
}
