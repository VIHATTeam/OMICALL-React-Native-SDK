package com.omikitplugin

import android.Manifest
import androidx.core.app.ActivityCompat
import com.facebook.react.ReactActivity
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.RCTNativeAppEventEmitter
import vn.vihat.omicall.omisdk.OmiClient
import vn.vihat.omicall.omisdk.OmiListener
import vn.vihat.omicall.omisdk.OmiSDKUtils


class OmikitPluginModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), OmiListener {

  override fun getName(): String {
    return NAME
  }


  @ReactMethod
  fun initCall(data: ReadableMap, promise: Promise) {
    val userName = data.getString("userName") as String
    val password = data.getString("password") as String
    val realm = data.getString("realm") as String
    OmiClient.register(reactApplicationContext!!, userName, password, realm)
    ActivityCompat.requestPermissions(
      currentActivity!!,
      arrayOf(
        Manifest.permission.USE_SIP,
        Manifest.permission.CALL_PHONE,
        Manifest.permission.CAMERA,
        Manifest.permission.MODIFY_AUDIO_SETTINGS,
        Manifest.permission.RECORD_AUDIO,
      ),
      0,
    )
    OmiClient.instance.setListener(this)
    promise.resolve(true)
  }

  @ReactMethod
  fun updateToken(data: ReadableMap, promise: Promise) {
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


  @ReactMethod
  fun startCall(data: ReadableMap, promise: Promise) {
    val phoneNumber = data.getString("phoneNumber") as String
    val isVideo = data.getBoolean("isVideo")
    if (!isVideo) {
      OmiClient.instance.startCall(phoneNumber)
      promise.resolve(true)
    }
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
      OmiSDKUtils.handlePermissionRequest(requestCode, permissions, grantResults, act)
    }
  }

  override fun incomingReceived(callerId: Int, phoneNumber: String?) {
    sendEvent("incomingReceived", mapOf(
      "callerId" to callerId,
      "phoneNumber" to phoneNumber,
    ))
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

  }

  override fun onMuted(isMuted: Boolean) {
    sendEvent("onMuted", mapOf(
      "isMuted" to isMuted,
    ))
  }

  override fun onRinging() {
    sendEvent("onRinging", null)
  }

  private fun sendEvent(eventName: String?, params: Any?) {
    reactApplicationContext.getJSModule(RCTNativeAppEventEmitter::class.java)
      .emit(eventName, params)
  }
}
