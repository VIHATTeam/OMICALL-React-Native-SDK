package com.omikitplugin

import android.Manifest
import android.content.Context
import android.hardware.camera2.CameraManager
import android.os.Build
import android.util.Log
import androidx.core.app.ActivityCompat
import com.facebook.react.ReactActivity
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.RCTNativeAppEventEmitter
import com.omikitplugin.constants.*
import vn.vihat.omicall.omisdk.OmiClient
import vn.vihat.omicall.omisdk.OmiListener
import vn.vihat.omicall.omisdk.utils.OmiSDKUtils


class OmikitPluginModule(reactContext: ReactApplicationContext?) :
  ReactContextBaseJavaModule(reactContext) {


  private var icSpeaker = false
  private var isMute = false

  private val callListener = object : OmiListener {

    override fun incomingReceived(callerId: Int, phoneNumber: String?, isVideo: Boolean?) {
      val map: WritableMap = WritableNativeMap()
      map.putBoolean("isVideo", isVideo ?: true)
      map.putString("callerNumber", phoneNumber)
      sendEvent(INCOMING_RECEIVED, map)
      Log.d("omikit", "incomingReceived: ")
    }

    override fun onCallEnd() {
      sendEvent(CALL_END, null)
    }

    override fun onCallEstablished(
      callerId: Int,
      phoneNumber: String?,
      isVideo: Boolean?,
      startTime: Long,
    ) {
      val map: WritableMap = WritableNativeMap()
      val sipNumber = OmiClient.instance.callUUID
      map.putString("callerNumber", sipNumber)
      map.putBoolean("isVideo", isVideo ?: true)
      sendEvent(CALL_ESTABLISHED, map)
    }

    override fun onConnectionTimeout() {
//      sendEvent("onConnectionTimeout", null)
    }

    override fun onHold(isHold: Boolean) {
      val map: WritableMap = WritableNativeMap()
      map.putBoolean("isHold", isHold)
      sendEvent(HOLD, map)
    }

    override fun onMuted(isMuted: Boolean) {
//      val map: WritableMap = WritableNativeMap()
//      map.putBoolean("isMuted", isMuted)
//      sendEvent(MUTED, map)
    }

    override fun onOutgoingStarted(callerId: Int, phoneNumber: String?, isVideo: Boolean?) {

    }

    override fun onRinging() {
//      sendEvent("onRinging", null)
    }

    override fun onVideoSize(width: Int, height: Int) {

    }
  }

  override fun getName(): String {
    return NAME
  }

  override fun initialize() {
    super.initialize()
    OmiClient(reactApplicationContext!!)
    OmiClient.instance.setListener(callListener)
  }

  @ReactMethod
  fun initCall(data: ReadableMap, promise: Promise) {
    currentActivity?.runOnUiThread {
      val userName = data.getString("userName")
      val password = data.getString("password")
      val realm = data.getString("realm")
      val host = data.getString("host")
      val isVideo = data.getBoolean("isVideo")
      if (userName != null && password != null && realm != null && host != null) {
        OmiClient.register(
          reactApplicationContext!!,
          userName,
          password,
          isVideo,
          realm,
          host = host,
          customUI = true,
          isTcp = true
        )
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        ActivityCompat.requestPermissions(
          currentActivity!!,
          arrayOf(
            Manifest.permission.USE_SIP,
            Manifest.permission.CALL_PHONE,
            Manifest.permission.CAMERA,
            Manifest.permission.MODIFY_AUDIO_SETTINGS,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.POST_NOTIFICATIONS,
          ),
          0,
        )
      } else {
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
      if (isVideo) {
        val cm = currentActivity!!.getSystemService(Context.CAMERA_SERVICE) as CameraManager
        OmiClient.instance.setCameraManager(cm)
      }
      promise.resolve(true)
    }
  }

  @ReactMethod
  fun getInitialCall(promise: Promise) {
    currentActivity?.runOnUiThread {
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun joinCall(promise: Promise) {
    OmiClient.instance.pickUp(true)
    promise.resolve(true)
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
        appId,
      )
      promise.resolve(true)
    }
  }

  @ReactMethod
  fun startCall(data: ReadableMap, promise: Promise) {
    val phoneNumber = data.getString("phoneNumber") as String
    val isVideo = data.getBoolean("isVideo")
    OmiClient.instance.startCall(phoneNumber, isVideo)
    promise.resolve(true)
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
    isMute = !isMute
    sendEvent(MUTED, isMute)
  }

  @ReactMethod
  fun toggleSpeak(promise: Promise) {
    icSpeaker = !icSpeaker
    OmiClient.instance.toggleSpeaker(icSpeaker)
    promise.resolve(true)
    sendEvent(SPEAKER, icSpeaker)
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

  private fun sendEvent(eventName: String?, params: Any?) {
    currentActivity?.runOnUiThread {
      reactApplicationContext.getJSModule(RCTNativeAppEventEmitter::class.java)
        .emit(eventName, params)
    }
  }
}
