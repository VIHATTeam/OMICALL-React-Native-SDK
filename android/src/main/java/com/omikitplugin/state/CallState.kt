package com.omikitplugin.state

enum class CallState(_value: Int) {
  calling(0),
  early(1),
  connecting(2),
  confirmed(3),
  incoming(4),
  disconnected(5);

  val value = _value
}
