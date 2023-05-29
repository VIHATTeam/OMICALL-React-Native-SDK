//
//  CallState.swift
//  omicall_flutter_plugin
//
//  Created by PRO 2019 16' on 25/05/2023.
//

import Foundation
enum CallState: Int {
    case calling = 0
    case early
    case connecting
    case confirmed
    case incoming
    case disconnected
}
