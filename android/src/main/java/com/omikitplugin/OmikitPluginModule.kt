package com.omikitplugin

import android.Manifest
import androidx.core.app.ActivityCompat
import com.facebook.react.ReactActivity
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.RCTNativeAppEventEmitter
import vn.vihat.omicall.omisdk.OmiClient
import vn.vihat.omicall.omisdk.OmiListener
import vn.vihat.omicall.omisdk.OmiSDKUtils


class OmikitPluginModule(reactContext: ReactApplicationContext?) :
  ReactContextBaseJavaModule(reactContext), OmiListener {

  override fun getName(): String {
    return NAME
  }

  @ReactMethod
  fun initCall(data: ReadableMap, promise: Promise) {
    currentActivity?.runOnUiThread {
      val userName = data.getString("userName") as String
      val password = data.getString("password") as String
      val realm = data.getString("realm") as String
      OmiClient.register(reactApplicationContext, userName, password, realm)
      ActivityCompat.requestPermissions(
        currentActivity!!,
        arrayOf(
          Manifest.permission.USE_SIP,
          Manifest.permission.CALL_PHONE,
          Manifest.permission.POST_NOTIFICATIONS,
          Manifest.permission.CAMERA,
          Manifest.permission.MODIFY_AUDIO_SETTINGS,
          Manifest.permission.RECORD_AUDIO,
        ),
        0,
      )
      OmiClient.instance.setListener(this)
      promise.resolve(true)
    }
  }

  @ReactMethod
  fun updateToken(data: ReadableMap, promise: Promise) {
    currentActivity?.runOnUiThread {
      val deviceTokenAndroid = data.getString("fcmToken") as String
      val appId = data.getString("appId") as String
      val deviceId = data.getString("deviceId") as String
      OmiClient.instance.updatePushToken(
        "",
        deviceTokenAndroid,
        deviceId,
        appId
      )
      promise.resolve(true)
    }
  }


  @ReactMethod
  fun startCall(data: ReadableMap, promise: Promise) {
    val phoneNumber = data.getString("phoneNumber") as String
    val isVideo = data.getBoolean("isVideo")
    if (!isVideo) {
      OmiClient.instance.startCall(phoneNumber)
      promise.resolve(true)
    }
  }

  @ReactMethod
  fun endCall(promise: Promise) {
    OmiClient.instance.hangUp()
    promise.resolve(true)
  }

  @ReactMethod
  fun toggleMute(promise: Promise) {
    OmiClient.instance.toggleMute()
    promise.resolve(true)
  }

  @ReactMethod
  fun toggleSpeak(data: ReadableMap, promise: Promise) {
    val useSpeaker = data.getBoolean("useSpeaker")
    OmiClient.instance.toggleSpeaker(useSpeaker)
    promise.resolve(true)
  }

  @ReactMethod
  fun decline(promise: Promise) {
    OmiClient.instance.decline()
    promise.resolve(true)
  }

  @ReactMethod
  fun hangup(data: ReadableMap, promise: Promise) {
    val callId = data.getInt("callId")
    OmiClient.instance.hangUp(callId)
    promise.resolve(true)
  }


  @ReactMethod
  fun onCallStart(data: ReadableMap, promise: Promise) {
    val callId = data.getInt("callId")
    OmiClient.instance.onCallStarted(callId)
    promise.resolve(true)
  }

  @ReactMethod
  fun onHold(data: ReadableMap, promise: Promise) {
    val isHold = data.getBoolean("isHold")
    OmiClient.instance.onHold(isHold)
    promise.resolve(true)
  }

  @ReactMethod
  fun onMute(data: ReadableMap, promise: Promise) {
    val isMute = data.getBoolean("isMute")
    OmiClient.instance.onMuted(isMute)
    promise.resolve(true)
  }

  @ReactMethod
  fun sendDTMF(data: ReadableMap, promise: Promise) {
    val character = data.getString("character")
    var characterCode: Int? = character?.toIntOrNull()
    if (character == "*") {
      characterCode = 10
    }
    if (character == "#") {
      characterCode = 11
    }
    if (characterCode != null) {
      OmiClient.instance.sendDtmf(characterCode)
    }
    promise.resolve(true)
  }

  companion object {
    const val NAME = "OmikitPlugin"
    fun onDestroy() {
      OmiClient.instance.disconnect()
    }

    fun onRequestPermissionsResult(
      requestCode: Int,
      permissions: Array<out String>,
      grantResults: IntArray,
      act: ReactActivity,
    ) {
      act.runOnUiThread {
        OmiSDKUtils.handlePermissionRequest(requestCode, permissions, grantResults, act)
      }
    }
  }

  override fun incomingReceived(callerId: Int, phoneNumber: String?) {
    val map: WritableMap = WritableNativeMap()
    map.putInt("callerId", callerId)
    sendEvent("phoneNumber", phoneNumber)
  }

  override fun onCallEnd() {
    sendEvent("onCallEnd", false)
  }

  override fun onCallEstablished() {
    sendEvent("onCallEstablished", null)
  }

  override fun onConnectionTimeout() {
    sendEvent("onConnectionTimeout", null)
  }

  override fun onHold(isHold: Boolean) {
    sendEvent("onHold", null)
  }

  override fun onMuted(isMuted: Boolean) {
    val map: WritableMap = WritableNativeMap()
    map.putBoolean("isMuted", isMuted)
    sendEvent("onMuted", map)
  }

  override fun onRinging() {
    sendEvent("onRinging", null)
  }

  private fun sendEvent(eventName: String?, params: Any?) {
    currentActivity?.runOnUiThread {
      reactApplicationContext.getJSModule(RCTNativeAppEventEmitter::class.java)
        .emit(eventName, params)
    }
  }
}
