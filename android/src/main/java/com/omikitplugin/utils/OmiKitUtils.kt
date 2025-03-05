package com.omikitplugin.utils

import android.content.Context
import com.omikitplugin.constants.CURRENT_STATUS
import com.omikitplugin.constants.RECEIVE_TIME

class OmiKitUtils {
  fun setStatusPendingCall(
    context: Context,
    isAccepted: Boolean,
  ) {
    val sharedPreferences = context.getSharedPreferences("incomingcall", Context.MODE_PRIVATE)
    val editor = sharedPreferences.edit()
    val status = if (isAccepted) 5 else 2
    editor.putInt(
      CURRENT_STATUS, status
    )
    editor.putLong(
      RECEIVE_TIME, System.currentTimeMillis()
    )
    editor.apply()
  }

  fun clearStatusPendingCall(context: Context) {
    val sharedPreferences = context.getSharedPreferences("incomingcall", Context.MODE_PRIVATE)
    val editor = sharedPreferences.edit()
    editor.clear()
    editor.apply()
  }

  fun getStatusPendingCall(context: Context): Int {
    val sharedPreferences = context.getSharedPreferences("incomingcall", Context.MODE_PRIVATE)
    val receiveTime = sharedPreferences.getLong(RECEIVE_TIME, 0)
    if (receiveTime != 0L && System.currentTimeMillis() - receiveTime > 29000) {
      clearStatusPendingCall(context)
    }
    val status = sharedPreferences.getInt(CURRENT_STATUS, 0)
    clearStatusPendingCall(context)
    return status
  }

  fun checkTypeNumber(phoneNumber: String?): String {
      if (phoneNumber.isNullOrBlank()) return "" // 

      return when {
          phoneNumber.length < 8 -> "internal"
          phoneNumber.any { it.isLetter() } && phoneNumber.any { it.isDigit() } -> "zalo"
          else -> "phone"
      }
  }

}
