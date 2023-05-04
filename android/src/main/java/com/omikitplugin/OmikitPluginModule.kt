package com.omikitplugin

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.hardware.camera2.CameraManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
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
import vn.vihat.omicall.omisdk.utils.SipServiceConstants


class OmikitPluginModule(reactContext: ReactApplicationContext?) :
  ReactContextBaseJavaModule(reactContext), ActivityEventListener {
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

    override fun onCallEnd(callInfo: Any?) {
      if (callInfo is Map<*, *>) {
        val call = callInfo as Map<*, *>
        val map: WritableMap = WritableNativeMap()
        val timeStartToAnswer = call["time_start_to_answer"] as Long?
        val timeEnd = call["time_end"] as Long
        map.putString("transaction_id", call["transaction_id"] as String?)
        map.putString("direction", call["direction"] as String)
        map.putString("source_number", call["source_number"] as String)
        map.putString("destination_number", call["destination_number"] as String)
        map.putDouble("time_start_to_answer", (timeStartToAnswer ?: 0).toDouble())
        map.putDouble("time_end", timeEnd.toDouble())
        map.putString("sip_user", call["sip_user"] as String)
        map.putString("disposition", call["disposition"] as String)
        sendEvent(CALL_END, map)
      } else {
        sendEvent(CALL_END, null)
      }
    }

    override fun onCallEstablished(
      callerId: Int,
      phoneNumber: String?,
      isVideo: Boolean?,
      startTime: Long,
      transactionId: String?,
    ) {
      OmiClient.instance.changeLocalCameraOrientation(0)
      Handler(Looper.getMainLooper()).postDelayed({
        Log.d("OmikitReactNative", "onCallEstablished")
        val map: WritableMap = WritableNativeMap()
        map.putString("callerNumber", phoneNumber)
        map.putBoolean("isVideo", isVideo ?: true)
        map.putString("transactionId", transactionId)
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
    reactApplicationContext!!.addActivityEventListener(this)
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
      val notificationIcon = data.getString("notificationIcon")
      val prefix = data.getString("prefix")
      val declineTitle = data.getString("declineTitle")
      val acceptTitle = data.getString("acceptTitle")
      val acceptBackgroundColor = data.getString("acceptBackgroundColor")
      val declineBackgroundColor = data.getString("declineBackgroundColor")
      val incomingBackgroundColor = data.getString("incomingBackgroundColor")
      val incomingAcceptButtonImage = data.getString("incomingAcceptButtonImage")
      val incomingDeclineButtonImage = data.getString("incomingDeclineButtonImage")
      val prefixMissedCallMessage = data.getString("prefixMissedCallMessage")
      val missedCallTitle = data.getString("missedCallTitle")
      val backImage = data.getString("backImage")
      val userImage = data.getString("userImage")
      OmiClient.instance.configPushNotification(
        notificationIcon = notificationIcon ?: "",
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
        prefixMissedCallMessage = prefixMissedCallMessage ?: "Cuộc gọi nhỡ từ",
        missedCallTitle = prefixMissedCallMessage ?: "Cuộc gọi nhỡ"
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
        } catch (_: Throwable) {

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
        } catch (_: Throwable) {

        }
      }
      promise.resolve(true)
    }
  }

  @ReactMethod
  fun startCall(data: ReadableMap, promise: Promise) {
    val audio: Int =
      ContextCompat.checkSelfPermission(
        reactApplicationContext!!,
        Manifest.permission.RECORD_AUDIO
      )
    if (audio == PackageManager.PERMISSION_GRANTED) {
      currentActivity?.runOnUiThread {
        val phoneNumber = data.getString("phoneNumber") as String
        val isVideo = data.getBoolean("isVideo")
        OmiClient.instance.startCall(phoneNumber, isVideo)
        promise.resolve(true)
      }
    } else {
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun startCallWithUuid(data: ReadableMap, promise: Promise) {
    val audio: Int =
      ContextCompat.checkSelfPermission(
        reactApplicationContext!!,
        Manifest.permission.RECORD_AUDIO
      )
    if (audio == PackageManager.PERMISSION_GRANTED) {
      mainScope.launch {
        var callResult = false
        withContext(Dispatchers.Default) {
          try {
            val uuid = data.getString("usrUuid") as String
            val isVideo = data.getBoolean("isVideo")
            callResult = OmiClient.instance.startCallWithUuid(uuid = uuid, isVideo = isVideo)
          } catch (_: Throwable) {

          }
        }
        promise.resolve(callResult)
      }
    } else {
      promise.resolve(false)
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
      val callInfo = OmiClient.instance.hangUp()
      if (callInfo is Map<*, *>) {
        val call = callInfo as Map<*, *>
        val map: WritableMap = WritableNativeMap()
        val timeStartToAnswer = call["time_start_to_answer"] as Long?
        val timeEnd = call["time_end"] as Long
        map.putString("transaction_id", call["transaction_id"] as String?)
        map.putString("direction", call["direction"] as String)
        map.putString("source_number", call["source_number"] as String)
        map.putString("destination_number", call["destination_number"] as String)
        map.putDouble("time_start_to_answer", (timeStartToAnswer ?: 0).toDouble())
        map.putDouble("time_end", timeEnd.toDouble())
        map.putString("sip_user", call["sip_user"] as String)
        map.putString("disposition", call["disposition"] as String)
        sendEvent(CALL_END, map)
      } else {
        promise.resolve(null)
      }
    }
  }

  @ReactMethod
  fun toggleMute(promise: Promise) {
    mainScope.launch {
      var newStatus: Boolean? = null
      withContext(Dispatchers.Default) {
        try {
          newStatus = OmiClient.instance.toggleMute()
        } catch (_: Throwable) {

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
        } catch (_: Throwable) {

        }
      }
      promise.resolve(true)
    }
  }

  @ReactMethod
  fun getCurrentUser(promise: Promise) {
    mainScope.launch {
      var callResult: Any? = null
      withContext(Dispatchers.Default) {
        try {
          callResult = OmiClient.instance.getCurrentUser()
        } catch (_: Throwable) {

        }
      }
      if (callResult != null && callResult is Map<*, *>) {
        val call = callResult as Map<*, *>
        val map: WritableMap = WritableNativeMap()
        map.putString("extension", call["extension"] as String?)
        map.putString("uuid", call["uuid"] as String?)
        map.putString("full_name", call["full_name"] as String?)
        map.putString("avatar_url", call["avatar_url"] as String?)
        promise.resolve(map)
      } else {
        promise.resolve(null);
      }
    }
  }

  @ReactMethod
  fun getGuestUser(promise: Promise) {
    mainScope.launch {
      var callResult: Any? = null
      withContext(Dispatchers.Default) {
        try {
          callResult = OmiClient.instance.getIncomingCallUser()
        } catch (_: Throwable) {

        }
      }
      if (callResult != null && callResult is Map<*, *>) {
        val call = callResult as Map<*, *>
        val map: WritableMap = WritableNativeMap()
        map.putString("extension", call["extension"] as String?)
        map.putString("uuid", call["uuid"] as String?)
        map.putString("full_name", call["full_name"] as String?)
        map.putString("avatar_url", call["avatar_url"] as String?)
        promise.resolve(map)
      } else {
        promise.resolve(null);
      }
    }
  }

  @ReactMethod
  fun getUserInfo(phone: Any, promise: Promise) {
    mainScope.launch {
      var callResult: Any? = null
      withContext(Dispatchers.Default) {
        try {
          callResult = OmiClient.instance.getUserInfo(phone as String)
        } catch (_: Throwable) {
        }
      }
      if (callResult != null && callResult is Map<*, *>) {
        val call = callResult as Map<*, *>
        val map: WritableMap = WritableNativeMap()
        map.putString("extension", call["extension"] as String?)
        map.putString("uuid", call["uuid"] as String?)
        map.putString("full_name", call["full_name"] as String?)
        map.putString("avatar_url", call["avatar_url"] as String?)
        promise.resolve(map)
      } else {
        promise.resolve(null);
      }
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

  private fun requestPermission(isVideo: Boolean) {
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

  override fun onActivityResult(p0: Activity?, p1: Int, p2: Int, p3: Intent?) {

  }

  override fun onNewIntent(p0: Intent?) {
    if (p0 != null && p0.hasExtra(SipServiceConstants.PARAM_NUMBER)) {
      //do your Stuff
      val map: WritableMap = WritableNativeMap()
      map.putString("callerNumber", p0.getStringExtra(SipServiceConstants.PARAM_NUMBER) ?: "")
      map.putBoolean("isVideo", p0.getBooleanExtra(SipServiceConstants.PARAM_IS_VIDEO, false))
      sendEvent(CLICK_MISSED_CALL, map)
    }
  }
}
