package com.omikitplugin.state

enum class CallState(_value: Int) {
    unknown(0),
    calling(1),
    incoming(2),
    early(3),
    connecting(4),
    confirmed(5),
    disconnected(6);

  val value = _value
}
