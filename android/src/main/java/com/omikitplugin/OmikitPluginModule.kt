package com.omikitplugin

import android.Manifest
import android.content.Context
import android.hardware.camera2.CameraManager
import android.os.Build
import android.os.Handler
import android.util.Log
import androidx.core.app.ActivityCompat
import com.facebook.react.ReactActivity
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.RCTNativeAppEventEmitter
import com.omikitplugin.constants.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import vn.vihat.omicall.omisdk.OmiAccountListener
import vn.vihat.omicall.omisdk.OmiClient
import vn.vihat.omicall.omisdk.OmiListener
import vn.vihat.omicall.omisdk.utils.OmiSDKUtils


class OmikitPluginModule(reactContext: ReactApplicationContext?) :
  ReactContextBaseJavaModule(reactContext) {
  private val mainScope = CoroutineScope(Dispatchers.Main)

  override fun getName(): String {
    return NAME
  }

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
      Handler().postDelayed({
        Log.d("OmikitReactNative", "onCallEstablished")
        val map: WritableMap = WritableNativeMap()
        map.putString("callerNumber", phoneNumber)
        map.putBoolean("isVideo", isVideo ?: true)
        sendEvent(CALL_ESTABLISHED, map)
      }, 500)
    }

    override fun onConnectionTimeout() {
//      sendEvent("onConnectionTimeout", null)
    }

    override fun onHold(isHold: Boolean) {
//      val map: WritableMap = WritableNativeMap()
//      map.putBoolean("isHold", isHold)
//      sendEvent(HOLD, map)
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

  private val accountListener = object : OmiAccountListener {
    override fun onAccountStatus(online: Boolean) {
      Log.d("aaa", "Account status $online")
//            initResult?.success(online)
//            initResult = null
    }
  }

  override fun initialize() {
    super.initialize()
  }

  @ReactMethod
  fun startServices(promise: Promise) {
    OmiClient(context = reactApplicationContext!!)
    OmiClient.instance.setListener(callListener)
    OmiClient.instance.addAccountListener(accountListener)
    val needSetupVideo = OmiClient.instance.needSetupCamera()
    if (needSetupVideo) {
      setCamera()
    }
    promise.resolve(true)
  }

  @ReactMethod
  fun configPushNotification(data: ReadableMap, promise: Promise) {
    currentActivity?.runOnUiThread {
      val prefix = data.getString("prefix")
      val declineTitle = data.getString("declineTitle")
      val acceptTitle = data.getString("acceptTitle")
      val acceptBackgroundColor = data.getString("acceptBackgroundColor")
      val declineBackgroundColor = data.getString("declineBackgroundColor")
      val incomingBackgroundColor = data.getString("incomingBackgroundColor")
      val incomingAcceptButtonImage = data.getString("incomingAcceptButtonImage")
      val incomingDeclineButtonImage = data.getString("incomingDeclineButtonImage")
      val backImage = data.getString("backImage")
      val userImage = data.getString("userImage")
      OmiClient.instance.configPushNotification(
        prefix = prefix ?: "Cuộc gọi tới từ: ",
        declineTitle = declineTitle ?: "Từ chối",
        acceptTitle = acceptTitle ?: "Chấp nhận",
        acceptBackgroundColor = acceptBackgroundColor ?: "#FF3700B3",
        declineBackgroundColor = declineBackgroundColor ?: "#FF000000",
        incomingBackgroundColor = incomingBackgroundColor ?: "#FFFFFFFF",
        incomingAcceptButtonImage = incomingAcceptButtonImage ?: "join_call",
        incomingDeclineButtonImage = incomingDeclineButtonImage ?: "hangup",
        backImage = backImage ?: "ic_back",
        userImage = userImage ?: "calling_face",
      )
      promise.resolve(true)
    }
  }

  @ReactMethod
  fun initCallWithUserPassword(data: ReadableMap, promise: Promise) {
    currentActivity?.runOnUiThread {
      val userName = data.getString("userName")
      val password = data.getString("password")
      val realm = data.getString("realm")
      val host = data.getString("host")
      val isVideo = data.getBoolean("isVideo")
      if (userName != null && password != null && realm != null && host != null) {
        OmiClient.register(
          userName,
          password,
          isVideo,
          realm,
          host,
        )
      }
      requestPermission(isVideo)
      if (isVideo) {
        setCamera()
      }
      promise.resolve(true)
    }
  }

  @ReactMethod
  fun initCallWithApiKey(data: ReadableMap, promise: Promise) {
    mainScope.launch {
      var loginResult = false
      val usrName = data.getString("fullName")
      val usrUuid = data.getString("usrUuid")
      val apiKey = data.getString("apiKey")
      val isVideo = data.getBoolean("isVideo")
      withContext(Dispatchers.Default) {
        try {
          if (usrName != null && usrUuid != null && apiKey != null) {
            loginResult = OmiClient.registerWithApiKey(
              apiKey = apiKey,
              userName = usrName,
              uuid = usrUuid,
              isVideo,
            )
          }
        } catch (_ : Throwable) {

        }
      }
      requestPermission(isVideo)
      if (isVideo) {
        setCamera()
      }
      promise.resolve(loginResult)
    }
  }


  @ReactMethod
  fun getInitialCall(promise: Promise) {
    currentActivity?.runOnUiThread {
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun updateToken(data: ReadableMap, promise: Promise) {
    mainScope.launch {
      val deviceTokenAndroid = data.getString("fcmToken") as String
      withContext(Dispatchers.Default) {
        try {
          OmiClient.instance.updatePushToken(
            "",
            deviceTokenAndroid,
          )
        } catch (_ : Throwable) {

        }
      }
      promise.resolve(true)
    }
  }

  @ReactMethod
  fun startCall(data: ReadableMap, promise: Promise) {
    currentActivity?.runOnUiThread {
      val phoneNumber = data.getString("phoneNumber") as String
      val isVideo = data.getBoolean("isVideo")
      val result = OmiClient.instance.startCall(phoneNumber, isVideo)
      promise.resolve(result)
    }
  }

  @ReactMethod
  fun startCallWithUuid(data: ReadableMap, promise: Promise) {
    mainScope.launch {
      var callResult = false
      withContext(Dispatchers.Default) {
        try {
          val uuid = data.getString("usrUuid") as String
          val isVideo = data.getBoolean("isVideo")
          callResult = OmiClient.instance.startCallWithUuid(uuid = uuid, isVideo = isVideo)
        } catch (_ : Throwable) {

        }
      }
      promise.resolve(callResult)
    }
  }

  @ReactMethod
  fun joinCall(promise: Promise) {
    currentActivity?.runOnUiThread {
      OmiClient.instance.pickUp()
      promise.resolve(true)
    }
  }

  @ReactMethod
  fun endCall(promise: Promise) {
    currentActivity?.runOnUiThread {
      OmiClient.instance.hangUp()
      promise.resolve(true)
    }
  }

  @ReactMethod
  fun toggleMute(promise: Promise) {
    mainScope.launch {
      var newStatus : Boolean? = null
      withContext(Dispatchers.Default) {
        try {
          newStatus = OmiClient.instance.toggleMute()
        } catch (_ : Throwable) {

        }
      }
      promise.resolve(newStatus)
      sendEvent(MUTED, newStatus)
    }
  }

  @ReactMethod
  fun toggleSpeaker(promise: Promise) {
    currentActivity?.runOnUiThread {
      val newStatus = OmiClient.instance.toggleSpeaker()
      promise.resolve(newStatus)
      sendEvent(SPEAKER, newStatus)
    }
  }

  @ReactMethod
  fun sendDTMF(data: ReadableMap, promise: Promise) {
    currentActivity?.runOnUiThread {
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
  }

  @ReactMethod
  fun switchOmiCamera(promise: Promise) {
    currentActivity?.runOnUiThread {
      OmiClient.instance.switchCamera()
      promise.resolve(true)
    }
  }

  @ReactMethod
  fun toggleOmiVideo(promise: Promise) {
    currentActivity?.runOnUiThread {
      OmiClient.instance.toggleCamera()
      promise.resolve(true)
    }
  }

  @ReactMethod
  fun omiInputs(promise: Promise) {
    currentActivity?.runOnUiThread {
      val inputs = OmiClient.instance.getAudioInputs()
      val allAudios = inputs.map {
        mapOf(
          "name" to it.first,
          "id" to it.second,
        )
      }.toTypedArray()
      promise.resolve(allAudios)
    }
  }

  @ReactMethod
  fun omiOutputs(promise: Promise) {
    currentActivity?.runOnUiThread {
      val inputs = OmiClient.instance.getAudioOutputs()
      val allAudios = inputs.map {
        mapOf(
          "name" to it.first,
          "id" to it.second,
        )
      }.toTypedArray()
      promise.resolve(allAudios)
    }
  }

  @ReactMethod
  fun logout(promise: Promise) {
    mainScope.launch {
      withContext(Dispatchers.Default) {
        try {
          OmiClient.instance.logout()
        } catch (_ : Throwable) {

        }
      }
      promise.resolve(true)
    }
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
    currentActivity!!.runOnUiThread {
      reactApplicationContext.getJSModule(RCTNativeAppEventEmitter::class.java)
        .emit(eventName, params)
    }
  }

  private fun requestPermission(isVideo : Boolean) {
    var permissions = arrayOf(
      Manifest.permission.USE_SIP,
      Manifest.permission.CALL_PHONE,
      Manifest.permission.MODIFY_AUDIO_SETTINGS,
      Manifest.permission.RECORD_AUDIO,
    )
    if (isVideo) {
      permissions = permissions.plus(Manifest.permission.CAMERA)
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      permissions = permissions.plus(Manifest.permission.POST_NOTIFICATIONS)
    }
    ActivityCompat.requestPermissions(
      reactApplicationContext.currentActivity!!,
      permissions,
      0,
    )
  }

  private fun setCamera() {
    val cm =
      reactApplicationContext!!.getSystemService(Context.CAMERA_SERVICE) as CameraManager
    OmiClient.instance.setCameraManager(cm)
  }
}
