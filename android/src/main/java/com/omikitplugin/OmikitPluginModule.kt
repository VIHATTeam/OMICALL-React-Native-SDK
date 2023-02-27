package com.omikitplugin

import android.Manifest
import androidx.core.app.ActivityCompat
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import vn.vihat.omicall.omisdk.OmiClient
import vn.vihat.omicall.omisdk.OmiListener

class OmikitPluginModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), OmiListener {

  override fun getName(): String {
    return NAME
  }

//   Example method
//   See https://reactnative.dev/docs/native-modules-android
    @ReactMethod
  fun multiply(a: Double, b: Double, promise: Promise) {
     promise.resolve(a * b)
  }

  @ReactMethod
  fun initCall(data: Dynamic, promise: Promise) {
    if (data is HashMap<*, *>) {
      val userName = data["userName"] as String
      val password = data["password"] as String
      val realm = data["realm"] as String
      OmiClient.register(reactApplicationContext!!, userName, password, realm)
      OmiClient.instance.setListener(this)
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
    }
    promise.resolve(true)
  }

  @ReactMethod
  fun updateToken(data: HashMap<String, Any>, promise: Promise) {
    val deviceTokenAndroid = data["fcmToken"] as String
    val appId = data["appId"] as String
    val deviceId = data["deviceId"] as String
    OmiClient.instance.updatePushToken(
      "",
      deviceTokenAndroid,
      deviceId,
      appId
    )
    promise.resolve(true)
  }

  companion object {
    const val NAME = "OmikitPlugin"
  }

  override fun incomingReceived(callerId: Int, phoneNumber: String?) {

  }

  override fun onCallEnd() {

  }

  override fun onCallEstablished() {

  }

  override fun onConnectionTimeout() {

  }

  override fun onHold(isHold: Boolean) {

  }

  override fun onMuted(isMuted: Boolean) {

  }

  override fun onRinging() {

  }
}
