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
import kotlin.concurrent.thread
import androidx.annotation.RequiresApi
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.ReactActivity
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.RCTNativeAppEventEmitter
import com.omikitplugin.constants.*
import com.omikitplugin.state.CallState
import com.omikitplugin.utils.OmiKitUtils
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.coroutines.delay
import vn.vihat.omicall.omisdk.OmiAccountListener
import vn.vihat.omicall.omisdk.OmiClient
import vn.vihat.omicall.omisdk.OmiListener
import vn.vihat.omicall.omisdk.service.NotificationService
import vn.vihat.omicall.omisdk.service.NotificationService.Companion.uuid
import vn.vihat.omicall.omisdk.utils.OmiSDKUtils
import vn.vihat.omicall.omisdk.utils.OmiStartCallStatus
import vn.vihat.omicall.omisdk.utils.SipServiceConstants
import vn.vihat.omicall.omisdk.utils.Utils


class OmikitPluginModule(reactContext: ReactApplicationContext?) :
  ReactContextBaseJavaModule(reactContext), ActivityEventListener, OmiListener {
  private val mainScope = CoroutineScope(Dispatchers.Main)
  private var isIncoming: Boolean = false
  private var isAnserCall: Boolean = false

  override fun getName(): String {
    return NAME
  }


    private val handler = Handler(Looper.getMainLooper())

  override fun incomingReceived(callerId: Int?, phoneNumber: String?, isVideo: Boolean?) {
    isIncoming = true;
    Log.d("OMISDK", "=>> START INCOMING CALL REVICED => ")

    val typeNumber = OmiKitUtils().checkTypeNumber(phoneNumber ?: "")

    val map: WritableMap = WritableNativeMap().apply {
        putBoolean("isVideo", isVideo ?: true)
        putBoolean("incoming", isIncoming)
        putString("callerNumber", phoneNumber ?: "")
        putString("_id", "")
        putInt("status", CallState.incoming.value)
        putString("typeNumber", typeNumber)
    }

    sendEvent(CALL_STATE_CHANGED, map)
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

          val typeNumber = OmiKitUtils().checkTypeNumber(phoneNumber ?: "")

          val map: WritableMap = WritableNativeMap().apply {
              putString("callerNumber", phoneNumber ?: "")
              putBoolean("isVideo", isVideo ?: true)
              putBoolean("incoming", isIncoming) // 🔹 Kiểm tra lỗi chính tả biến này
              putString("transactionId", transactionId ?: "")
              putInt("status", CallState.confirmed.value)
              putString("typeNumber", typeNumber)
          }

          sendEvent(CALL_STATE_CHANGED, map)
      }, 200)
  }

  override fun onCallEnd(callInfo: MutableMap<String, Any?>, statusCode: Int) {
      Log.d("OMISDK RN", "=>> onCallEnd 0000 => $callInfo")

      // Kiểm tra kiểu dữ liệu trước khi ép kiểu để tránh lỗi
      val call = callInfo ?: mutableMapOf()

      val timeStartToAnswer = (call["time_start_to_answer"] as? Long) ?: 0L
      val timeEnd = (call["time_end"] as? Long) ?: 0L
      val phoneNumber = (call["destination_number"] as? String) ?: (call["source_number"] as? String) ?: ""
      val typeNumber = OmiKitUtils().checkTypeNumber(phoneNumber)

      val map: WritableMap = WritableNativeMap().apply {
          putString("direction", call["direction"] as? String ?: "")
          putString("transactionId", call["transaction_id"] as? String ?: "")
          putString("sourceNumber", call["source_number"] as? String ?: "")
          putString("destinationNumber", call["destination_number"] as? String ?: "")
          putDouble("timeStartToAnswer", timeStartToAnswer.toDouble())
          putDouble("timeEnd", timeEnd.toDouble())
          putString("sipUser", call["sip_user"] as? String ?: "")
          putInt("codeEndCall", statusCode)
          putString("disposition", call["disposition"] as? String ?: "")
          putInt("status", CallState.disconnected.value)
          putString("typeNumber", typeNumber)
      }

      Log.d("OMISDK RN", "=>> onCallEnd  => $map")
      sendEvent(CALL_STATE_CHANGED, map)
  }

  override fun onConnecting() {
      Log.d("OMISDK", "=>> ON CONNECTING CALL => ")

      val map: WritableMap = WritableNativeMap().apply {
          putString("callerNumber", "")
          putBoolean("isVideo", NotificationService.isVideo)
          putBoolean("incoming", isIncoming ?: false)
          putString("transactionId", "")
          putString("_id", "")
          putInt("status", CallState.connecting.value)
          putString("typeNumber", "")
      }

      sendEvent(CALL_STATE_CHANGED, map)
  }

  override fun onDescriptionError() {
  }

  override fun onFcmReceived(uuid: String, userName: String, avatar: String) {
  }

  override fun onRinging(callerId: Int, transactionId: String?) {
      val callDirection = OmiClient.callDirection
      val prePhoneNumber = OmiClient.prePhoneNumber ?: ""
      val typeNumber = OmiKitUtils().checkTypeNumber(prePhoneNumber)

      val map: WritableMap = WritableNativeMap().apply {
          putString("callerNumber", if (callDirection == "inbound") prePhoneNumber else "")
          putBoolean("isVideo", NotificationService.isVideo)
          putString("transactionId", transactionId ?: "")
          putInt("status", if (callDirection == "inbound") CallState.incoming.value else CallState.early.value)
          putBoolean("incoming", callDirection == "inbound")
          putString("typeNumber", typeNumber)
      }

      Log.d("OMISDK", if (callDirection == "inbound") "=>> ON INCOMING CALL => " else "=>> ON RINGING CALL => ")
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
    sendEvent(HOLD, isHold)
  }

  override fun onMuted(isMuted: Boolean) {
    sendEvent(MUTED, isMuted)
  }

  override fun onOutgoingStarted(callerId: Int, phoneNumber: String?, isVideo: Boolean?) {
      Log.d("OMISDK", "=>> ON OUTGOING STARTED CALL => ")

      val typeNumber = OmiKitUtils().checkTypeNumber(phoneNumber ?: "")

      val map: WritableMap = WritableNativeMap().apply {
          putString("callerNumber", phoneNumber ?: "")
          putBoolean("isVideo", NotificationService.isVideo)
          putString("transactionId", "")
          putInt("status", CallState.calling.value)
          putString("_id", "")
          putBoolean("incoming", isIncoming) // 🔹 Kiểm tra lỗi chính tả của biến này
          putString("typeNumber", typeNumber)
      }

      sendEvent(CALL_STATE_CHANGED, map)
  }

  override fun onSwitchBoardAnswer(sip: String) {
    val map: WritableMap = WritableNativeMap()
    map.putString("sip", sip)
    sendEvent(SWITCHBOARD_ANSWER, map)
  }

  override fun onRegisterCompleted(statusCode: Int) {
    Log.d("OMISDK", "=> ON REGISTER COMPLETED => status code: $statusCode")

    if (statusCode != 200) {
      val normalizedStatusCode = if (statusCode == 403) 853 else statusCode
      val typeNumber = ""

      val mapObject = WritableNativeMap().apply {
          putBoolean("isVideo", false)
          putBoolean("incoming", true)
          putString("callerNumber", "")
          putString("_id", "")
          putInt("status", 6)
          putInt("code_end_call", normalizedStatusCode)
          putInt("codeEndCall", normalizedStatusCode)
          putString("typeNumber", typeNumber)
      }
      sendEvent(CALL_STATE_CHANGED, mapObject)
    }
  }

  override fun onRequestPermission(permissions: Array<String>) {

    val map = WritableNativeMap().apply {
      putArray("permissions", WritableNativeArray().apply {
        permissions.forEach {
          pushString(it)
        }
      })
    }
    Log.d("OMISDK", "=>> onRequestPermission => $map")
    sendEvent(REQUEST_PERMISSION, map)

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
      // 0 -> "INVALID_UUID"
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
      400 -> "ALREADY_IN_CALL"
      401 -> "INVALID_UUID"
      402 -> "INVALID_PHONE_NUMBER"
      403 -> "CAN_NOT_CALL_YOURSELF"
      404 -> "SWITCHBOARD_NOT_CONNECTED"
      405 -> "PERMISSION_DENIED"
      406 -> "PERMISSION_DENIED"
      407 -> "SWITCHBOARD_REGISTERING"
      else -> "HAVE_ANOTHER_CALL"
    }
  }

  override fun initialize() {
    super.initialize()
    reactApplicationContext!!.addActivityEventListener(this)
    Handler(Looper.getMainLooper()).post {
      OmiClient.getInstance(reactApplicationContext!!).addCallStateListener(this)
      OmiClient.getInstance(reactApplicationContext!!).setDebug(false)
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
    val intent = Intent(
      Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
      Uri.parse("package:" + reactApplicationContext.packageName)
    )
    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
    reactApplicationContext.startActivity(intent)
    promise.resolve(true)
  }

  @ReactMethod
  fun configPushNotification(data: ReadableMap, promise: Promise) {
    currentActivity?.runOnUiThread {
      val notificationIcon = data.getString("notificationIcon") ?: ""
      val prefix = data?.getString("prefix") ?: ""
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
      val appRepresentName = data?.getString("representName") ?: ""


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
        inboundChannelId = "${channelId}-inbound",
        inboundChannelName = "Cuộc gọi đến",
        missedChannelId = "${channelId}-missed",
        missedChannelName = "Cuộc gọi nhỡ",
        displayNameType = userNameKey ?: "full_name",
        notificationMissedCallPrefix = prefixMissedCallMessage ?: "Cuộc gọi nhỡ từ",
        representName = appRepresentName ?: ""
      )
      promise.resolve(true)
    }
  }

  @ReactMethod
  fun initCallWithUserPassword(data: ReadableMap, promise: Promise) {
    mainScope.launch {
      var loginResult = false
      val userName = data.getString("userName")
      val password = data.getString("password")
      val realm = data.getString("realm")
      val host = data.getString("host") ?: "vh.omicrm.com"
      val isVideo = data.getBoolean("isVideo")
      val firebaseToken = data.getString("fcmToken")
      val projectId = data.getString("projectId") ?: ""

      withContext(Dispatchers.Default) {
        try {
          if (userName != null && password != null && realm != null && firebaseToken != null) {
            loginResult =
              OmiClient.register(
                userName,
                password,
                realm,
                isVideo ?: true,
                firebaseToken,
                host,
                projectId
              )
            promise.resolve(loginResult)
          }
        } catch (_: Throwable) {
          promise.resolve(loginResult)
        }
      }
      promise.resolve(loginResult)
    }
  }

  @ReactMethod
  fun initCallWithApiKey(data: ReadableMap, promise: Promise) {
    mainScope.launch {
      var loginResult = false
      val usrName = data.getString("fullName")
      val usrUuid = data.getString("usrUuid")
      val apiKey = data.getString("apiKey")
      val isVideo = data.getBoolean("isVideo") ?: false
      val phone = data.getString("phone")
      val firebaseToken = data.getString("fcmToken") as String
      val projectId = data.getString("projectId") ?: ""

      requestPermission(isVideo)
      withContext(Dispatchers.Default) {
        try {
          if (usrName != null && usrUuid != null && apiKey != null && firebaseToken != null) {
            loginResult = OmiClient.registerWithApiKey(
              apiKey = apiKey,
              userName = usrName,
              uuid = usrUuid,
              phone = phone ?: "",
              isVideo = isVideo,
              firebaseToken,
              projectId
            )
            promise.resolve(true)
          }
        } catch (_: Throwable) {
          promise.resolve(loginResult)
        }
      }
    }
  }

  @ReactMethod
  fun getInitialCall(counter: Int = 1, promise: Promise) {
      val context = reactApplicationContext ?: run {
          Log.e("getInitialCall", "❌ React context is null")
          promise.resolve(false)
          return
      }

      val call = Utils.getActiveCall(context)
      Log.d("getInitialCall RN", "📞 Active call: $call")

      if (call == null) {
          if (counter <= 0) {
              promise.resolve(false)
          } else {
              mainScope.launch {
                  Log.d("getInitialCall RN", "🔄 Retrying in 2s... (Attempts left: $counter)")
                  delay(1000) // Chờ 2 giây
                  getInitialCall(counter - 1, promise) // Gọi lại hàm đệ quy
              }
          }
          return
      }

      val phoneNumber = call.remoteNumber as? String ?: ""
      if (phoneNumber.isEmpty()) {
          promise.resolve(false)
          return
      }

      val typeNumber = OmiKitUtils().checkTypeNumber(phoneNumber ?: "")

      val map: WritableMap = WritableNativeMap().apply {
          putString("callerNumber", phoneNumber)
          putBoolean("incoming", call.direction == "inbound")
          putInt("_id", call.id)
          putInt("status", call.state)
          putBoolean("muted", false)
          putBoolean("isVideo", call.isVideo ?: false)
          putString("typeNumber", typeNumber)
      }

      val statusPendingCall = OmiKitUtils().getStatusPendingCall(context)
      if (call.state == 3 && statusPendingCall != 0) {
          call.state = statusPendingCall
      }

      promise.resolve(map)

      if (statusPendingCall == 2 && call.state != 5) {
          Log.d("getInitialCall RN", "🚀 Incoming Receive Triggered ($statusPendingCall)")


          val eventMap: WritableMap = WritableNativeMap().apply {
              putBoolean("isVideo", call.isVideo ?: false)
              putBoolean("incoming", true)
              putString("callerNumber", phoneNumber)
              putString("_id", "")
              putInt("status", 2)
              putString("typeNumber", typeNumber)
          }
          sendEvent(CALL_STATE_CHANGED, eventMap)
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
        val isVideo = data.getBoolean("isVideo") ?: false;
        val startCallResult =
          OmiClient.getInstance(reactApplicationContext!!).startCall(phoneNumber, isVideo)
        Log.d("OMISDK", "=>> startCallResult START CALL  =>  $startCallResult")
        var statusCalltemp = startCallResult.value as Int;
        if (startCallResult.value == 200 || startCallResult.value == 407) {
          statusCalltemp = 8
        }
        map.putInt("status", statusCalltemp)
        map.putString("_id", "")
        map.putString("message", messageCall(startCallResult.value) as String)
        promise.resolve(map)
      }
    } else {
      map.putInt("status", 4)
      map.putString("_id", "")
      map.putString("message", messageCall(406) as String)
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
            callResult = OmiClient.getInstance(reactApplicationContext!!)
              .startCallWithUuid(uuid = uuid, isVideo = isVideo)
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
      val appContext = reactApplicationContext.applicationContext
      val activity = currentActivity

      if (appContext == null) {
          promise.reject("E_NULL_CONTEXT", "Application context is null")
          return
      }

      if (activity == null) {
          promise.reject("E_NULL_ACTIVITY", "Current activity is null")
          return
      }

      activity.runOnUiThread {
          try {
              OmiClient.getInstance(appContext).pickUp()
              promise.resolve(true)
          } catch (e: Exception) {
              promise.reject("E_JOIN_CALL_FAILED", "Failed to join call", e)
          }
      }
  }

  @ReactMethod
  fun endCall(promise: Promise) {
    if (isIncoming && !isAnserCall) {
      OmiClient.getInstance(reactApplicationContext!!).decline()
    } else {
      OmiClient.getInstance(reactApplicationContext!!).hangUp()
    }
    promise.resolve(true)

  }

  @ReactMethod
  fun rejectCall(promise: Promise) {
    if (isIncoming && !isAnserCall) {
      OmiClient.getInstance(reactApplicationContext!!).decline()
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
  fun toggleHold(promise: Promise) {
    mainScope.launch {
      try {
        // Gọi hàm toggleHold() và kiểm tra kết quả
        val result = withContext(Dispatchers.IO) {
          OmiClient.getInstance(reactApplicationContext!!).toggleHold()
        }

        // Kiểm tra nếu toggleHold trả về Unit
        if (result == Unit) {
          promise.resolve(null) // Trả về null nếu kết quả là Unit
        } else {
          promise.resolve(result)
        }
      } catch (e: Exception) {
        promise.reject("TOGGLE_HOLD_EXCEPTION", "Exception occurred: ${e.message}", e)
      }
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
        OmiClient.getInstance(reactApplicationContext!!).sendDtmf(characterCode.toString())
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

        map.putString("fullName", call["full_name"] as String?)
        map.putString("avatarUrl", call["avatar_url"] as String?)

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

        map.putString("fullName", call["full_name"] as String?)
        map.putString("avatarUrl", call["avatar_url"] as String?)

        promise.resolve(map)
      } else {
        promise.resolve(null);
      }
    }
  }

  @ReactMethod
  fun getUserInfo(phone: String, promise: Promise) {
    mainScope.launch {
      var callResult: Any? = null
      withContext(Dispatchers.Default) {
        try {
          callResult = OmiClient.getInstance(reactApplicationContext!!).getUserInfo(phone)
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

        map.putString("fullName", call["full_name"] as String?)
        map.putString("avatarUrl", call["avatar_url"] as String?)
        promise.resolve(map)
      } else {
        promise.resolve(null)
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
      if (reactApplicationContext != null) {
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

    fun onResume(act: ReactActivity) {
      act.let { context ->
        Log.d("OMISDK_REACT", "=>> onResume => ")
        OmiClient.getInstance(context, true)
        OmiClient.isAppReady = true;
      }
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

    fun onGetIntentFromNotification(
      context: ReactApplicationContext,
      intent: Intent,
      act: ReactActivity
    ) {
      act.runOnUiThread {
        val isIncoming = intent.getBooleanExtra(SipServiceConstants.ACTION_IS_INCOMING_CALL, false)
        if (!isIncoming) return@runOnUiThread
        val isReopenCall = intent.getBooleanExtra(
          SipServiceConstants.ACTION_REOPEN_CALL, false
        )
        val isAcceptedCall = intent.getBooleanExtra(
          SipServiceConstants.ACTION_ACCEPT_INCOMING_CALL, false
        )
        if (isReopenCall) {
          val activeCall = Utils.getActiveCall(context)
          OmikitPluginModule(context).onCallEstablished(
            activeCall?.id ?: 0,
            activeCall?.remoteNumber,
            activeCall?.isVideo,
            activeCall?.startTime ?: 0,
            activeCall?.uuid
          )
        } else {
          if (isAcceptedCall) {
            OmiClient.getInstance(context).pickUp()
          }
          OmiKitUtils().setStatusPendingCall(context, isAcceptedCall)
        }

      }
    }
  }

    fun sendEvent(eventName: String?, params: Any?) {
      if (eventName == null) {
        Log.e("OmikitPlugin", "❌ eventName is null or empty. Không thể gửi event.")
        return
      }
      if (currentActivity != null) {
        currentActivity!!.runOnUiThread {
          reactApplicationContext.getJSModule(RCTNativeAppEventEmitter::class.java)
            .emit(eventName, params)
             Log.d("OmikitPlugin", "✅ Event $eventName đã được gửi thành công!")
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

  //  private fun getPending(): {
//    val pendingCall = OmiKitUtils().getPendingCall(reactApplicationContext)
//    OmiKitUtils().clearPendingCall(reactApplicationContext)
//    val isPending =
//      pendingCall[PREFS_IS_PENDING] as Boolean
//    val receiveTime = pendingCall[RECEIVE_TIME] as Long
//
//    if ( isPending && System.currentTimeMillis() - receiveTime < 25000) {
//      val callId = pendingCall[PREFS_CALL_ID] as Int
//      val phoneNumber = pendingCall[PREFS_PHONE_NUMBER] as String
//      val isVideo = pendingCall[PREFS_IS_VIDEO] as Boolean
//      val startTime = pendingCall[PREFS_START_TIME] as Long
//      val uuid = pendingCall[PREFS_UUID] as String
//      val isReopen = pendingCall[PREFS_IS_REOPEN] as Boolean
//      val isAccepted = pendingCall[PREFS_IS_ACCEPTED] as Boolean
//
//      if (isReopen) {
//        onCallEstablished(
//          callId, phoneNumber, isVideo, startTime,
//          uuid
//        )
//      } else if (isAccepted) {
//        OmiClient.getInstance(reactApplicationContext!!).pickUp()
//        onCallEstablished(
//          callId, phoneNumber, isVideo, startTime,
//          uuid
//        )
//      } else {
//        incomingReceived(callId, phoneNumber, isVideo)
//      }
//    }
//  }
  override fun onActivityResult(p0: Activity?, p1: Int, p2: Int, p3: Intent?) {
  }

  override fun onNewIntent(p0: Intent?) {
    if (p0 != null && p0.hasExtra(SipServiceConstants.PARAM_IS_MISSED_CALL)) {
      //do your Stuff

      if (p0.getBooleanExtra(SipServiceConstants.PARAM_IS_MISSED_CALL, false)) {
        val map: WritableMap = WritableNativeMap()
        map.putString("callerNumber", p0.getStringExtra(SipServiceConstants.PARAM_NUMBER) ?: "")
        map.putBoolean("isVideo", p0.getBooleanExtra(SipServiceConstants.PARAM_IS_VIDEO, false))
        sendEvent(CLICK_MISSED_CALL, map)
      }
    }
  }
}
