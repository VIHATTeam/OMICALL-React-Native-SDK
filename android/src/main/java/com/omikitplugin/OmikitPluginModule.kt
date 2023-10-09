package com.omikitplugin

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.ReactActivity
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.RCTNativeAppEventEmitter
import com.omikitplugin.constants.*
import com.omikitplugin.state.CallState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import vn.vihat.omicall.omisdk.OmiAccountListener
import vn.vihat.omicall.omisdk.OmiClient
import vn.vihat.omicall.omisdk.OmiListener
import vn.vihat.omicall.omisdk.service.NotificationService
import vn.vihat.omicall.omisdk.utils.OmiSDKUtils
import vn.vihat.omicall.omisdk.utils.OmiStartCallStatus
import vn.vihat.omicall.omisdk.utils.SipServiceConstants


class OmikitPluginModule(reactContext: ReactApplicationContext?) :
  ReactContextBaseJavaModule(reactContext), ActivityEventListener, OmiListener {
  private val mainScope = CoroutineScope(Dispatchers.Main)
  private var isIncomming: Boolean = false
  private var callerNumberTemp: String = ""
  private var isAnserCall: Boolean = false


  override fun getName(): String {
    return NAME
  }

  override fun incomingReceived(callerId: Int?, phoneNumber: String?, isVideo: Boolean?) {
    isIncomming = true;
       Log.d("OMISDK", "=>> START IN COMMING CALL REVICED => ")
    val map: WritableMap = WritableNativeMap()
    map.putBoolean("isVideo", isVideo ?: true)
    map.putBoolean("incoming", isIncomming)
    map.putString("callerNumber", phoneNumber)
    map.putString("_id", "")
    map.putInt("status", CallState.incoming.value)
    sendEvent(CALL_STATE_CHANGED, map)
    Log.d("omikit", "incomingReceived: ")
  }

  override fun onCallEstablished(
    callerId: Int,
    phoneNumber: String?,
    isVideo: Boolean?,
    startTime: Long,
    transactionId: String?,
  ) {
    isAnserCall = true
    Log.d("OMISDK", "=>> ON CALL ESTABLISHED => ")
    Handler(Looper.getMainLooper()).postDelayed({
      Log.d("OmikitReactNative", "onCallEstablished")
      val map: WritableMap = WritableNativeMap()
      map.putString("callerNumber", phoneNumber)
      map.putBoolean("isVideo", isVideo ?: true)
      map.putBoolean("incoming", isIncomming)
      map.putString("transactionId", transactionId)
      map.putInt("status", CallState.confirmed.value)
      sendEvent(CALL_STATE_CHANGED, map)
    }, 200)
  }

  override fun onCallEnd(callInfo: MutableMap<String, Any?>, statusCode: Int) {
      Log.d("OMISDK", "=>> ON CALL END => ")
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
    map.putInt("status", CallState.disconnected.value)
    sendEvent(CALL_STATE_CHANGED, map)
  }

  override fun onConnecting() {
    Log.d("OMISDK", "=>> ON CONNECTING CALL => ")
    val map: WritableMap = WritableNativeMap()
    map.putString("callerNumber", "")
    map.putBoolean("isVideo", NotificationService.isVideo)
    map.putBoolean("incoming", isIncomming)
    map.putString("transactionId", "")
    map.putString("_id", "")
    map.putInt("status", CallState.connecting.value)
    sendEvent(CALL_STATE_CHANGED, map)
  }

  override fun onRinging(callerId: Int, transactionId: String?) {
    var callDirection  = OmiClient.callDirection
    val map: WritableMap = WritableNativeMap()

    if(callDirection == "inbound") {
       Log.d("OMISDK", "=>> ON IN COMMING CALL => ")
      map.putString("callerNumber", OmiClient.prePhoneNumber)
      map.putBoolean("isVideo", NotificationService.isVideo)
      map.putBoolean("incoming", true)
      map.putString("transactionId", transactionId ?: "")
      map.putInt("status", CallState.incoming.value)
    } else {
      map.putString("callerNumber", "")
      map.putBoolean("isVideo", NotificationService.isVideo)
      map.putString("transactionId", transactionId ?: "")
      map.putInt("status", CallState.early.value)
      map.putBoolean("incoming", false)
      Log.d("OMISDK", "=>> ON RINGING CALL => ")
    }
    sendEvent(CALL_STATE_CHANGED, map)
  }


  override fun networkHealth(stat: Map<String, *>, quality: Int) {
    val map: WritableMap = WritableNativeMap()
    map.putInt("quality", quality)
    sendEvent(CALL_QUALITY, map)
  }

  override fun onAudioChanged(audioInfo: Map<String, Any>) {
    val audio: WritableMap = WritableNativeMap()
    audio.putString("name", audioInfo["name"] as String)
    audio.putInt("type", audioInfo["type"] as Int)
    val map: WritableMap = WritableNativeMap()
    val writeList = WritableNativeArray()
    writeList.pushMap(audio)
    map.putArray("data", writeList)
    sendEvent(AUDIO_CHANGE, map)
  }


  override fun onHold(isHold: Boolean) {
  }

  override fun onMuted(isMuted: Boolean) {
  }

  override fun onOutgoingStarted(callerId: Int, phoneNumber: String?, isVideo: Boolean?) {
    Log.d("OMISDK", "=>> ON OUT GOING STARTED CALL => ")
    val map: WritableMap = WritableNativeMap()
    map.putString("callerNumber", "")
    map.putBoolean("isVideo", NotificationService.isVideo)
    map.putString("transactionId", "")
    map.putInt("status", CallState.calling.value)
    map.putString("_id", "")
    map.putBoolean("incoming",isIncomming)
    sendEvent(CALL_STATE_CHANGED, map)
  }

  override fun onSwitchBoardAnswer(sip: String) {
    val map: WritableMap = WritableNativeMap()
    map.putString("sip", sip)
    sendEvent(SWITCHBOARD_ANSWER, map)
  }

  override fun onVideoSize(width: Int, height: Int) {

  }

  private val accountListener = object : OmiAccountListener {
    override fun onAccountStatus(online: Boolean) {
      Log.d("aaa", "Account status $online")
    }
  }

  private fun messageCall(type: Int): String {
    return when (type) {
      // 401 -> "INVALID_UUID"
      // 1 -> "INVALID_PHONE_NUMBER"
      // 2 -> "SAME_PHONE_NUMBER_WITH_PHONE_REGISTER"
      // 3 -> "MAX_RETRY"
      // 405 -> "PERMISSION_DENIED"
      // 406 -> "PERMISSION_DENIED"
      // 5 -> "COULD_NOT_FIND_END_POINT"
      // 6 -> "REGISTER_ACCOUNT_FAIL"
      // 7 -> "START_CALL_FAIL"
      // 8 -> "START_CALL_SUCCESS"
      // 9 -> "HAVE_ANOTHER_CALL"
      200 -> "START_CALL_SUCCESS"
      400 -> "AL"
      401 -> "INVALID_UUID"
      402 -> "INVALID_PHONE_NUMBER"
      403 -> "CAN_NOT_CALL_YOURSELF"
      404 -> "SWITCHBOARD_NOT_CONNECTED"
      405 -> "PERMISSION_DENIED"
      406 -> "PERMISSION_DENIED"
      else -> "HAVE_ANOTHER_CALL"
    }
  }

  override fun initialize() {
    super.initialize()
    reactApplicationContext!!.addActivityEventListener(this)
    Handler(Looper.getMainLooper()).post {
       OmiClient(context = reactApplicationContext!!)
       OmiClient.getInstance(reactApplicationContext!!).addCallStateListener(this)
          OmiClient.getInstance(reactApplicationContext!!)
            OmiClient.isAppReady = true;
            OmiClient.getInstance(reactApplicationContext!!).addCallStateListener(this)
    }
  }

  @ReactMethod
  fun startServices(promise: Promise) {
    OmiClient.getInstance(reactApplicationContext!!).addAccountListener(accountListener)
    promise.resolve(true)
  }

  @RequiresApi(Build.VERSION_CODES.M)
  @ReactMethod
  fun systemAlertWindow(promise: Promise) {
      val result = Settings.canDrawOverlays(reactApplicationContext)
      promise.resolve(result)
  }

  @RequiresApi(Build.VERSION_CODES.M)
  @ReactMethod
  fun openSystemAlertSetting(promise: Promise) {
    val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
      Uri.parse("package:" + reactApplicationContext.packageName))
    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
    reactApplicationContext.startActivity(intent)
    promise.resolve(true)
  }

  @ReactMethod
  fun configPushNotification(data: ReadableMap, promise: Promise) {
    currentActivity?.runOnUiThread {
      val notificationIcon =  data.getString("notificationIcon") ?: ""
      val prefix = data?.getString("prefix")  ?: ""
      val incomingBackgroundColor = data?.getString("incomingBackgroundColor") ?: ""
      val incomingAcceptButtonImage = data?.getString("incomingAcceptButtonImage") ?: ""
      val incomingDeclineButtonImage = data?.getString("incomingDeclineButtonImage") ?: ""
      val prefixMissedCallMessage = data?.getString("prefixMissedCallMessage") ?: ""
      val backImage = data?.getString("backImage") ?: ""
      val userImage = data?.getString("userImage") ?: ""
      val userNameKey = data?.getString("userNameKey") ?: ""
      val channelId = data?.getString("channelId") ?: ""
      val missedCallTitle = data?.getString("missedCallTitle") ?: ""
      val audioNotificationDescription = data?.getString("audioNotificationDescription") ?: ""
      val videoNotificationDescription = data?.getString("videoNotificationDescription") ?: ""
      val displayNameType = data?.getString("displayNameType") ?: ""

      OmiClient.getInstance(reactApplicationContext!!).configPushNotification(
        showMissedCall = true,
        notificationIcon = notificationIcon ?: "ic_notification",
        notificationAvatar = userImage ?: "ic_inbound_avatar_notification",
        fullScreenAvatar = userImage ?: "ic_inbound_avatar_fullscreen",
        internalCallText = "Gọi nội bộ",
        videoCallText = "Gọi Video",
        inboundCallText = prefix,
        unknownContactText = "Cuộc gọi không xác định",
        showUUID = false,
        inboundChannelId =  "${channelId}-inbound",
        inboundChannelName = "Cuộc gọi đến",
        missedChannelId =  "${channelId}-missed",
        missedChannelName = "Cuộc gọi nhỡ",
        displayNameType = userNameKey ?: "full_name",
        notificationMissedCallPrefix = prefixMissedCallMessage ?: "Cuộc gọi nhỡ từ"
      )
      promise.resolve(true)
    }
  }

  @ReactMethod
  fun initCallWithUserPassword(data: ReadableMap, promise: Promise) {
      mainScope.launch {
        val userName = data.getString("userName")
            Log.d("dataOmi", "INIT_CALL_USER_PASSWORD  ==>> $data ")
        Log.d("dataOmi", "INIT_CALL_USER_PASSWORD  ==>> $userName ")
        val password = data.getString("password")
        val realm = data.getString("realm")
        val host = data.getString("host")
        val isVideo = data.getBoolean("isVideo")
          val firebaseToken = data.getString("fcmToken") as String
          Log.d("dataOmi", "INIT_CALL_USER_PASSWORD $userName -- $password --$realm --$isVideo -- $host ")
          withContext(Dispatchers.Default) {
              try {
              if (userName != null && password != null && realm != null && host != null) {
                  OmiClient.register(userName, password, realm ,  isVideo ?: true, firebaseToken, host)
                }
              } catch (_: Throwable) {
            }
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
      val phone = data.getString("phone")
      val firebaseToken = data.getString("fcmToken") as String
      withContext(Dispatchers.Default) {
        try {
          if (usrName != null && usrUuid != null && apiKey != null) {
            loginResult = OmiClient.registerWithApiKey(
              apiKey = apiKey,
              userName = usrName,
              uuid = usrUuid,
              phone = phone ?: "",
              isVideo = isVideo,
              firebaseToken
            )
          }
        } catch (_: Throwable) {

        }
      }
      requestPermission(isVideo)
      promise.resolve(loginResult)
    }
  }


  @ReactMethod
  fun getInitialCall(promise: Promise) {
    currentActivity?.runOnUiThread {
      val call = OmiClient.getInstance(reactApplicationContext!!).getCurrentCallInfo()
      if (call != null) {
        val map: WritableMap = WritableNativeMap()
        map.putString("callerNumber", call["callerNumber"] as String)
        map.putInt("status", call["status"] as Int)
        map.putBoolean("muted", call["muted"] as Boolean)
        map.putBoolean("isVideo", call["isVideo"] as Boolean)
        promise.resolve(map)
      } else {
        promise.resolve(false)
      }
    }
  }

  @ReactMethod
  fun updateToken(data: ReadableMap, promise: Promise) {
    mainScope.launch {
      val deviceTokenAndroid = data.getString("fcmToken") as String
      withContext(Dispatchers.Default) {
        try {
          OmiClient.getInstance(reactApplicationContext!!).updatePushToken(
            deviceTokenAndroid
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
    val map: WritableMap = WritableNativeMap()
    if (audio == PackageManager.PERMISSION_GRANTED) {
      currentActivity?.runOnUiThread {
        val phoneNumber = data.getString("phoneNumber") as String
        val isVideo = data.getBoolean("isVideo")
        val startCallResult =   OmiClient.getInstance(reactApplicationContext!!).startCall(phoneNumber, isVideo)
        Log.d("dataOmi", "startCall  ==>> ${startCallResult} ")
        Log.d("dataOmi", "startCall2  ==>> ${startCallResult.value} ")
        var statusCalltemp =  startCallResult.value as Int;
        if(startCallResult.value == 200 ){
          statusCalltemp = 8
        }
         map.putString("status", statusCalltemp.toString())
         map.putString("_id", "")
          map.putString("message", messageCall(startCallResult.value) as String)
      Log.d("OMISDK", "=>> ON START CALL =>  $map")
        promise.resolve(map)
      }
    } else {
      map.putString("status","4")
      map.putString("_id", "")
      map.putString("message", messageCall(4) as String)
      Log.d("OMISDK", "=>> ON START CALL FAIL BECAUSE NEED PERMISSION =>  $map")
      promise.resolve(map)
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
        var callResult: OmiStartCallStatus? = null
        withContext(Dispatchers.Default) {
          try {
            val uuid = data.getString("usrUuid") as String
            val isVideo = data.getBoolean("isVideo")
            callResult = OmiClient.getInstance(reactApplicationContext!!).startCallWithUuid(uuid = uuid, isVideo = isVideo)
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
      if(reactApplicationContext != null) {
          OmiClient.getInstance(reactApplicationContext!!).pickUp()
          promise.resolve(true)
      }
    }
  }

  @ReactMethod
  fun endCall(promise: Promise) {
    if(isIncomming && !isAnserCall){
        OmiClient.getInstance(reactApplicationContext!!).decline()
    } else {
      OmiClient.getInstance(reactApplicationContext!!).hangUp()
    }
      promise.resolve(true)

  }

  @ReactMethod
  fun toggleMute(promise: Promise) {
    mainScope.launch {
      var newStatus: Boolean? = null
      withContext(Dispatchers.Default) {
        try {
          newStatus = OmiClient.getInstance(reactApplicationContext!!).toggleMute()
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
      val newStatus = OmiClient.getInstance(reactApplicationContext!!).toggleSpeaker()
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
        OmiClient.getInstance(reactApplicationContext!!).sendDtmf(characterCode)
      }
      promise.resolve(true)
    }
  }

  @ReactMethod
  fun switchOmiCamera(promise: Promise) {
    currentActivity?.runOnUiThread {
      OmiClient.getInstance(reactApplicationContext!!).switchCamera()
      promise.resolve(true)
    }
  }

  @ReactMethod
  fun toggleOmiVideo(promise: Promise) {
    currentActivity?.runOnUiThread {
      OmiClient.getInstance(reactApplicationContext!!).toggleCamera()
      promise.resolve(true)
    }
  }

  @ReactMethod
  fun logout(promise: Promise) {
    mainScope.launch {
      withContext(Dispatchers.Default) {
        try {
          OmiClient.getInstance(reactApplicationContext!!).logout()
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
          callResult = OmiClient.getInstance(reactApplicationContext!!).getCurrentUser()
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
          callResult = OmiClient.getInstance(reactApplicationContext!!).getIncomingCallUser()
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
          callResult = OmiClient.getInstance(reactApplicationContext!!).getUserInfo(phone as String)
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
  fun getAudio(promise: Promise) {
    val inputs = OmiClient.getInstance(reactApplicationContext!!).getAudioOutputs()
    val writeList = WritableNativeArray()
    inputs.forEach {
      val map = WritableNativeMap()
      map.putString("name", it["name"] as String)
      map.putInt("type", it["type"] as Int)
      writeList.pushMap(map)
    }
    promise.resolve(writeList)
  }

  @ReactMethod
  fun getCurrentAudio(promise: Promise) {
    val currentAudio = OmiClient.getInstance(reactApplicationContext!!).getCurrentAudio()
    val map: WritableMap = WritableNativeMap()
    map.putString("name", currentAudio["name"] as String)
    map.putInt("type", currentAudio["type"] as Int)
    val writeList = WritableNativeArray()
    writeList.pushMap(map)
    promise.resolve(writeList)
  }

  @ReactMethod
  fun setAudio(data: ReadableMap, promise: Promise) {
    val portType = data.getInt("portType")
    OmiClient.getInstance(reactApplicationContext!!).setAudio(portType)
    promise.resolve(true)
  }

  @ReactMethod
  fun transferCall(data: ReadableMap, promise: Promise) {
    currentActivity?.runOnUiThread {
      val phone = data.getString("phoneNumber")
       Log.d("phone", "phone transferCall  ==>> ${phone} ")
        if(reactApplicationContext != null) {
          Log.d("phone", "phone transferCall  reactApplicationContext ==>> ${phone} ")
            OmiClient.getInstance(reactApplicationContext!!).forwardCallTo(phone as String)
            promise.resolve(true)
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
    if (currentActivity != null) {
      currentActivity!!.runOnUiThread {
        reactApplicationContext.getJSModule(RCTNativeAppEventEmitter::class.java)
          .emit(eventName, params)
      }
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
