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
import java.util.Timer
import java.util.TimerTask

/**
 * OmiSDK Registration Status Mapping
 */
object OmiRegistrationStatus {
    private val statusMap = mapOf(
        // Success
        200 to ("ERROR_SUCCESS" to "Registration successful"),
        
        // Parameter validation errors (4xx)
        400 to ("ERROR_MISSING_PARAMETERS" to "Missing required parameters. Please check your configuration."),
        401 to ("ERROR_INVALID_CREDENTIALS" to "Invalid credentials. Please check username/password."),
        
        // Permission errors (45x) - Android specific
        450 to ("ERROR_MISSING_RECORD_AUDIO" to "RECORD_AUDIO permission required for Android 14+"),
        451 to ("ERROR_MISSING_FOREGROUND_SERVICE" to "FOREGROUND_SERVICE permission required"),
        452 to ("ERROR_MISSING_POST_NOTIFICATIONS" to "POST_NOTIFICATIONS permission required for Android 13+"),
        
        // Service errors (5xx)
        500 to ("ERROR_SERVICE_START_FAILED" to "Failed to start SIP service"),
        501 to ("ERROR_SERVICE_NOT_AVAILABLE" to "SIP service not available"),
        502 to ("ERROR_SERVICE_DEGRADED" to "Service degraded - may miss calls when app killed"),
        
        // Network errors (6xx)
        600 to ("ERROR_NETWORK_UNAVAILABLE" to "Network unavailable"),
        601 to ("ERROR_CONNECTION_TIMEOUT" to "Connection timeout"),
        
        // Legacy compatibility
        403 to ("ERROR_FORBIDDEN" to "Access denied. Check realm/domain permissions."),
        404 to ("ERROR_REALM_NOT_FOUND" to "Realm not found. Check configuration."),
        408 to ("ERROR_TIMEOUT" to "Connection timeout"),
        503 to ("ERROR_SERVICE_UNAVAILABLE" to "Service temporarily unavailable"),
        
        // Unknown
        999 to ("ERROR_UNKNOWN" to "Unknown error occurred")
    )
    
    fun getError(code: Int): Pair<String, String> {
        return statusMap[code] ?: ("ERROR_REGISTRATION_FAILED" to "Registration failed (Status: $code)")
    }
}

/**
 * Helper functions for parameter validation
 */
object ValidationHelper {
    fun validateRequired(params: Map<String, String?>, promise: Promise): Boolean {
        params.forEach { (key, value) ->
            if (value.isNullOrEmpty()) {
                val errorCode = "ERROR_MISSING_${key.uppercase()}"
                val message = "$key is required for OMICALL initialization. Please provide a valid $key."
                promise.reject(errorCode, message)
                return false
            }
        }
        return true
    }
}

class OmikitPluginModule(reactContext: ReactApplicationContext?) :
  ReactContextBaseJavaModule(reactContext), ActivityEventListener, OmiListener {
  private val mainScope = CoroutineScope(Dispatchers.Main)
  private var isIncoming: Boolean = false
  private var isAnswerCall: Boolean = false
  private var permissionPromise: Promise? = null

  override fun getName(): String {
    return NAME
  }


    private val handler = Handler(Looper.getMainLooper())

  override fun incomingReceived(callerId: Int?, phoneNumber: String?, isVideo: Boolean?) {
    Log.d("OMISDK", "=>> incomingReceived CALLED - BEFORE: isIncoming: $isIncoming, isAnswerCall: $isAnswerCall")
    isIncoming = true;
    isAnswerCall = false; // Reset answer state for new incoming call
    Log.d("OMISDK", "=>> incomingReceived AFTER SET - isIncoming: $isIncoming, isAnswerCall: $isAnswerCall, phoneNumber: $phoneNumber")

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
      isAnswerCall = true
      Log.d("OMISDK", "=>> ON CALL ESTABLISHED => ")

      Handler(Looper.getMainLooper()).postDelayed({
          Log.d("OmikitReactNative", "onCallEstablished")

          val typeNumber = OmiKitUtils().checkTypeNumber(phoneNumber ?: "")

          // ✅ Sử dụng safe WritableMap creation
          val eventData = mapOf(
              "callerNumber" to (phoneNumber ?: ""),
              "isVideo" to (isVideo ?: true),
              "incoming" to isIncoming,
              "transactionId" to (transactionId ?: ""),
              "status" to CallState.confirmed.value,
              "typeNumber" to typeNumber
          )
          
          val map = createSafeWritableMap(eventData)
          sendEvent(CALL_STATE_CHANGED, map)
      }, 200)
  }

  override fun onCallEnd(callInfo: MutableMap<String, Any?>, statusCode: Int) {
      Log.d("OMISDK RN", "=>> onCallEnd CALLED - BEFORE RESET: isIncoming: $isIncoming, isAnswerCall: $isAnswerCall")
      Log.d("OMISDK RN", "=>> onCallEnd callInfo => $callInfo")

      // Reset call state variables
      isIncoming = false
      isAnswerCall = false
      Log.d("OMISDK", "=>> onCallEnd AFTER RESET - isIncoming: $isIncoming, isAnswerCall: $isAnswerCall")

      // Kiểm tra kiểu dữ liệu trước khi ép kiểu để tránh lỗi
      val call = callInfo ?: mutableMapOf()

      val timeStartToAnswer = (call["time_start_to_answer"] as? Long) ?: 0L
      val timeEnd = (call["time_end"] as? Long) ?: 0L
      val phoneNumber = (call["destination_number"] as? String) ?: (call["source_number"] as? String) ?: ""
      val typeNumber = OmiKitUtils().checkTypeNumber(phoneNumber)

      // ✅ Sử dụng safe WritableMap creation
      val eventData = mapOf(
          "direction" to (call["direction"] as? String ?: ""),
          "transactionId" to (call["transaction_id"] as? String ?: ""),
          "sourceNumber" to (call["source_number"] as? String ?: ""),
          "destinationNumber" to (call["destination_number"] as? String ?: ""),
          "timeStartToAnswer" to timeStartToAnswer.toDouble(),
          "timeEnd" to timeEnd.toDouble(),
          "sipUser" to (call["sip_user"] as? String ?: ""),
          "codeEndCall" to statusCode,
          "disposition" to (call["disposition"] as? String ?: ""),
          "status" to CallState.disconnected.value,
          "typeNumber" to typeNumber
      )
      
      val map = createSafeWritableMap(eventData)

      Log.d("OMISDK RN", "=>> onCallEnd  => ")
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

      Log.d("OMISDK", "=>> onRinging CALLED - BEFORE: isIncoming: $isIncoming, isAnswerCall: $isAnswerCall, callDirection: $callDirection")

      if (callDirection == "inbound") {
        isIncoming = true;
        Log.d("OMISDK", "=>> onRinging SET isIncoming = true for inbound call")
      } else if (callDirection == "outbound") {
        isIncoming = false;
        Log.d("OMISDK", "=>> onRinging SET isIncoming = false for outbound call")
      }

      Log.d("OMISDK", "=>> onRinging AFTER: isIncoming: $isIncoming, isAnswerCall: $isAnswerCall")

      // ✅ Sử dụng safe WritableMap creation
      val eventData = mapOf(
          "callerNumber" to if (callDirection == "inbound") prePhoneNumber else "",
          "isVideo" to NotificationService.isVideo,
          "transactionId" to (transactionId ?: ""),
          "status" to if (callDirection == "inbound") CallState.incoming.value else CallState.early.value,
          "incoming" to (callDirection == "inbound"),
          "typeNumber" to typeNumber
      )
      
      val map = createSafeWritableMap(eventData)

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
      Log.d("OMISDK", "=>> onOutgoingStarted CALLED - BEFORE: isIncoming: $isIncoming, isAnswerCall: $isAnswerCall")
      
      // For outgoing calls, set states appropriately
      isIncoming = false;
      isAnswerCall = false;
      Log.d("OMISDK", "=>> onOutgoingStarted AFTER SET - isIncoming: $isIncoming, isAnswerCall: $isAnswerCall")

      val typeNumber = OmiKitUtils().checkTypeNumber(phoneNumber ?: "")

      val map: WritableMap = WritableNativeMap().apply {
          putString("callerNumber", phoneNumber ?: "")
          putBoolean("isVideo", NotificationService.isVideo)
          putString("transactionId", "")
          putInt("status", CallState.calling.value)
          putString("_id", "")
          putBoolean("incoming", isIncoming)
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
      
      // ✅ Add listener cho AUTO-UNREGISTER status
      OmiClient.getInstance(reactApplicationContext!!).addCallStateListener(autoUnregisterListener)
      
      OmiClient.getInstance(reactApplicationContext!!).setDebug(false)
    }
  }


  @ReactMethod
  fun startServices(promise: Promise) {
    try {
      // ✅ Prepare audio system trước khi start services
      prepareAudioSystem()
      
      OmiClient.getInstance(reactApplicationContext!!).addAccountListener(accountListener)
      
      // ✅ Start services - không cần prevent auto-unregister với Silent API
      OmiClient.getInstance(reactApplicationContext!!).setDebug(false)
      promise.resolve(true)
    } catch (e: Exception) {
      Log.e("OmikitPlugin", "❌ Error in startServices: ${e.message}", e)
      promise.resolve(false)
    }
  }

  // ✅ Helper function để sử dụng API mới (DEPRECATED - sử dụng Silent API thay thế)
  private fun preventAutoUnregisterCrash(reason: String) {
    try {
      Log.w("OmikitPlugin", "⚠️ DEPRECATED: preventAutoUnregisterCrash() - Use Silent Registration API instead")
      OmiClient.getInstance(reactApplicationContext!!).preventAutoUnregister(reason)
    } catch (e: Exception) {
      Log.e("OmikitPlugin", "❌ Failed to prevent AUTO-UNREGISTER: ${e.message}", e)
    }
  }

  // ✅ Method để check status AUTO-UNREGISTER (DEPRECATED)
  @ReactMethod
  fun getAutoUnregisterStatus(promise: Promise) {
    Log.w("OmikitPlugin", "⚠️ DEPRECATED: getAutoUnregisterStatus() - Use Silent Registration API instead")
    try {
      OmiClient.getInstance(reactApplicationContext!!).getAutoUnregisterStatus { isScheduled, timeUntilExecution ->
        try {
          val status = mapOf(
            "isScheduled" to isScheduled,
            "timeUntilExecution" to timeUntilExecution,
            "timestamp" to System.currentTimeMillis()
          )
          promise.resolve(Arguments.makeNativeMap(status))
        } catch (e: Exception) {
          Log.e("OmikitPlugin", "❌ Error in getAutoUnregisterStatus callback: ${e.message}", e)
          promise.resolve(null)
        }
      }
    } catch (e: Exception) {
      Log.e("OmikitPlugin", "❌ Error calling getAutoUnregisterStatus: ${e.message}", e)
      promise.resolve(null)
    }
  }

  // ✅ Method để manually prevent AUTO-UNREGISTER (DEPRECATED)
  @ReactMethod
  fun preventAutoUnregister(reason: String, promise: Promise) {
    Log.w("OmikitPlugin", "⚠️ DEPRECATED: preventAutoUnregister() - Use Silent Registration API instead")
    try {
      preventAutoUnregisterCrash(reason)
      promise.resolve(true)
    } catch (e: Exception) {
      Log.e("OmikitPlugin", "❌ Manual prevent failed: ${e.message}", e)
      promise.resolve(false)
    }
  }

  // ✅ Convenience methods cho các scenario phổ biến (DEPRECATED)
  @ReactMethod
  fun prepareForIncomingCall(promise: Promise) {
    Log.w("OmikitPlugin", "⚠️ DEPRECATED: prepareForIncomingCall() - Use Silent Registration API instead")
    try {
      OmiClient.getInstance(reactApplicationContext!!).prepareForIncomingCall()
      promise.resolve(true)
    } catch (e: Exception) {
      Log.e("OmikitPlugin", "❌ Prepare for incoming call failed: ${e.message}", e)
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun prepareForOutgoingCall(promise: Promise) {
    Log.w("OmikitPlugin", "⚠️ DEPRECATED: prepareForOutgoingCall() - Use Silent Registration API instead")
    try {
      OmiClient.getInstance(reactApplicationContext!!).prepareForOutgoingCall()
      promise.resolve(true)
    } catch (e: Exception) {
      Log.e("OmikitPlugin", "❌ Prepare for outgoing call failed: ${e.message}", e)
      promise.resolve(false)
    }
  }

  private fun prepareAudioSystem() {
    try {
      // ✅ Check network connectivity first
      if (!isNetworkAvailable()) {
        return
      }
      
      // Release any existing audio focus
      val audioManager = reactApplicationContext?.getSystemService(android.content.Context.AUDIO_SERVICE) as? android.media.AudioManager
      audioManager?.let {
        // Reset audio mode
        it.mode = android.media.AudioManager.MODE_NORMAL
      }
      
      // Small delay để audio system ổn định
      Thread.sleep(200)
      
    } catch (e: Exception) {
      Log.w("OmikitPlugin", "⚠️ Audio preparation warning: ${e.message}")
    }
  }

  @Suppress("MissingPermission")
  private fun isNetworkAvailable(): Boolean {
    return try {
      val connectivityManager = reactApplicationContext?.getSystemService(android.content.Context.CONNECTIVITY_SERVICE) as? android.net.ConnectivityManager
      val activeNetwork = connectivityManager?.activeNetworkInfo
      val isConnected = activeNetwork?.isConnectedOrConnecting == true
      isConnected
    } catch (e: Exception) {
      Log.w("OmikitPlugin", "⚠️ Network check failed: ${e.message}")
      true // Assume network is available if check fails
    }
  }

  // ✅ Safe wrapper cho OMISIP calls để tránh SIGSEGV
  private fun <T> safePjsipCall(operation: String, block: () -> T): T? {
    return try {
      val result = block()
      result
    } catch (e: Exception) {
      Log.e("OmikitPlugin", "❌ Safe OMISIP call failed: $operation - ${e.message}", e)
      null
    }
  }

  // ✅ Helper function để tạo WritableMap an toàn
  private fun createSafeWritableMap(data: Map<String, Any?>): WritableMap {
    val map = WritableNativeMap()
    try {
      data.forEach { (key, value) ->
        when (value) {
          is String -> map.putString(key, value)
          is Int -> map.putInt(key, value)
          is Double -> map.putDouble(key, value)
          is Boolean -> map.putBoolean(key, value)
          is Long -> map.putDouble(key, value.toDouble())
          null -> map.putNull(key)
          else -> map.putString(key, value.toString())
        }
      }
    } catch (e: Exception) {
      Log.e("OmikitPlugin", "❌ Error creating WritableMap: ${e.message}", e)
    }
    return map
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
    try {
        val context = reactApplicationContext ?: run {
            promise.reject("E_NULL_CONTEXT", "React context is null")
            return
        }

        currentActivity?.runOnUiThread {
            try {
                // Extract parameters from data with proper defaults
                val notificationIcon = data.getString("notificationIcon") ?: "ic_notification"
                val incomingBackgroundColor = data.getString("incomingBackgroundColor") ?: "#FFFFFF"
                val incomingAcceptButtonImage = data.getString("incomingAcceptButtonImage") ?: "ic_accept"
                val incomingDeclineButtonImage = data.getString("incomingDeclineButtonImage") ?: "ic_decline"
                val prefixMissedCallMessage = data.getString("prefixMissedCallMessage") ?: "Cuộc gọi nhỡ từ"
                val backImage = data.getString("backImage") ?: "ic_back"
                val userImage = data.getString("userImage") ?: "ic_user"
                val userNameKey = data.getString("userNameKey") ?: "full_name"
                val channelId = data.getString("channelId") ?: "omicall_channel"
                val missedCallTitle = data.getString("missedCallTitle") ?: "Cuộc gọi nhỡ"
                val audioNotificationDescription = data.getString("audioNotificationDescription") ?: "Cuộc gọi audio"
                val videoNotificationDescription = data.getString("videoNotificationDescription") ?: "Cuộc gọi video"
                val representName = data.getString("representName") ?: ""
                val isUserBusy = data.getBoolean("isUserBusy")

                // Configure push notification with extracted parameters
                OmiClient.getInstance(context).configPushNotification(
                    showMissedCall = true,
                    notificationIcon = notificationIcon,
                    notificationAvatar = userImage,
                    fullScreenAvatar = userImage,
                    internalCallText = "Gọi nội bộ",
                    videoCallText = videoNotificationDescription,
                    inboundCallText = audioNotificationDescription,
                    unknownContactText = "Cuộc gọi không xác định",
                    showUUID = false,
                    inboundChannelId = "${channelId}-inbound",
                    inboundChannelName = "Cuộc gọi đến",
                    missedChannelId = "${channelId}-missed",
                    missedChannelName = missedCallTitle,
                    displayNameType = userNameKey,
                    notificationMissedCallPrefix = prefixMissedCallMessage,
                    representName = representName
                )

                // Configure decline call behavior
                OmiClient.getInstance(context).configureDeclineCallBehavior(isUserBusy)

                Log.d("OmikitPlugin", "✅ Push notification configured successfully")
                promise.resolve(true)
            } catch (e: Exception) {
                Log.e("OmikitPlugin", "❌ Error configuring push notification: ${e.message}", e)
                promise.reject("E_CONFIG_FAILED", "Failed to configure push notification", e)
            }
        } ?: run {
            Log.e("OmikitPlugin", "❌ Current activity is null")
            promise.reject("E_NULL_ACTIVITY", "Current activity is null")
        }
    } catch (e: Exception) {
        Log.e("OmikitPlugin", "❌ Error in configPushNotification: ${e.message}", e)
        promise.reject("E_UNKNOWN", "Unknown error occurred", e)
    }
  }

  @ReactMethod
  fun initCallWithUserPassword(data: ReadableMap, promise: Promise) {
    mainScope.launch {
      val userName = data.getString("userName")
      val password = data.getString("password")
      val realm = data.getString("realm")
      val host = data.getString("host") ?: "vh.omicrm.com"
      val isVideo = data.getBoolean("isVideo")
      val firebaseToken = data.getString("fcmToken")
      val projectId = data.getString("projectId") ?: ""

      // Validate required parameters
      if (!ValidationHelper.validateRequired(mapOf(
          "userName" to userName,
          "password" to password, 
          "realm" to realm,
          "fcmToken" to firebaseToken
        ), promise)) return@launch

      withContext(Dispatchers.Default) {
        try {
          // ✅ Cleanup trước khi register
          try {
            OmiClient.getInstance(reactApplicationContext!!).logout()
            delay(500) // Chờ cleanup hoàn tất
          } catch (e: Exception) {
            Log.w("OmikitPlugin", "⚠️ Cleanup warning (expected): ${e.message}")
          }
          
          // ✅ Sử dụng Silent Registration API mới từ OmiSDK 2.3.67
          Log.d("OmikitPlugin", "🔇 Using Silent Registration API for user: $userName")
          
          OmiClient.getInstance(reactApplicationContext!!).silentRegister(
            userName = userName ?: "",
            password = password ?: "",
            realm = realm ?: "",
            isVideo = isVideo ?: true,
            firebaseToken = firebaseToken ?: "",
            host = host,
            projectId = projectId
          ) { success, statusCode, message ->
            Log.d("OmikitPlugin", "🔇 Silent registration callback - success: $success, status: $statusCode, message: $message")
            if (success) {
              Log.d("OmikitPlugin", "✅ Silent registration successful - no notification, no auto-unregister")
              // ✅ Resolve promise với kết quả từ callback
              promise.resolve(success)
            } else {
              Log.e("OmikitPlugin", "❌ Silent registration failed: $message")
              if (statusCode == 200) {
                promise.resolve(true)
              } else {
                val (errorCode, errorMessage) = OmiRegistrationStatus.getError(statusCode)
                promise.reject(errorCode, "$errorMessage (Status: $statusCode)")
              }
            }
          }
          
        } catch (e: Exception) {
          Log.e("OmikitPlugin", "❌ Error during silent registration: ${e.message}", e)
          promise.reject("ERROR_INITIALIZATION_EXCEPTION", "OMICALL initialization failed due to an unexpected error: ${e.message}. Please check your network connection and configuration.", e)
        }
      }
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
          // Validate required parameters
          if (!ValidationHelper.validateRequired(mapOf(
              "fullName" to usrName,
              "usrUuid" to usrUuid,
              "apiKey" to apiKey,
              "fcmToken" to firebaseToken
            ), promise)) return@withContext

          loginResult = OmiClient.registerWithApiKey(
            apiKey = apiKey ?: "",
            userName = usrName ?: "",
            uuid = usrUuid ?: "",
            phone = phone ?: "",
            isVideo = isVideo,
            firebaseToken,
            projectId
          )
          
          // ✅ Sử dụng API mới để ngăn chặn AUTO-UNREGISTER sau khi register thành công
          if (loginResult) {
            Log.d("OmikitPlugin", "🛡️ Preventing AUTO-UNREGISTER after successful API key registration")
            preventAutoUnregisterCrash("Successful API key registration - userName: $usrName")
            promise.resolve(true)
          } else {
            Log.e("OmikitPlugin", "❌ API key registration failed")
            promise.reject("ERROR_API_KEY_REGISTRATION_FAILED", "OMICALL API key initialization failed. Please check your API key, UUID, and network connection.")
          }
        } catch (e: Exception) {
          Log.e("OmikitPlugin", "❌ Error during API key registration: ${e.message}", e)
          promise.reject("ERROR_API_KEY_INITIALIZATION_EXCEPTION", "OMICALL API key initialization failed due to an unexpected error: ${e.message}. Please check your configuration and network connection.", e)
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
    if (isIncoming && !isAnswerCall) {
      OmiClient.getInstance(reactApplicationContext!!).decline()
    } else {
      OmiClient.getInstance(reactApplicationContext!!).hangUp()
    }
    promise.resolve(true)
  }

 @ReactMethod
  fun rejectCall(promise: Promise) {
      Log.d("OMISDK", "➡️ rejectCall called - isIncoming: $isIncoming, isAnswerCall: $isAnswerCall")
      if (isIncoming) {
          Log.d("OMISDK", "📞 Incoming call")

          if (!isAnswerCall) {
              Log.d("OMISDK", "🚫 Declining call with declineWithCode(true)")
              OmiClient.getInstance(reactApplicationContext!!).declineWithCode(true) // 486 Busy Here
          } else {
              Log.d("OMISDK", "📴 Call already answered, hanging up")
              OmiClient.getInstance(reactApplicationContext!!).hangUp()
          }

          promise.resolve(true)
      } else {
          Log.d("OMISDK", "📤 Not incoming call, skipping reject")
          promise.resolve(false)
      }
  }

  @ReactMethod
  fun dropCall(promise: Promise) {
    if (isIncoming && !isAnswerCall) {
      OmiClient.getInstance(reactApplicationContext!!).declineWithCode(false) // 603
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
          // ✅ Gọi trực tiếp getCurrentUser() trong coroutine context
          callResult = OmiClient.getInstance(reactApplicationContext!!).getCurrentUser()
        } catch (e: Throwable) {
          Log.e("OmikitPlugin", "❌ getCurrentUser error: ${e.message}", e)
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
    const val REQUEST_PERMISSIONS_CODE = 1001
    const val REQUEST_OVERLAY_PERMISSION_CODE = 1002

    fun onDestroy() {
      try {
        // Cleanup OmiClient resources safely
      } catch (e: Exception) {
        Log.e("OmikitPlugin", "❌ Error during cleanup: ${e.message}", e)
      }
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
        // Handle our custom permission request
        if (requestCode == REQUEST_PERMISSIONS_CODE) {
          handlePermissionResults(permissions, grantResults, act)
        }
        
        // Also handle SDK permission request
        OmiSDKUtils.handlePermissionRequest(requestCode, permissions, grantResults, act)
      }
    }
    
    private fun handlePermissionResults(
      permissions: Array<out String>,
      grantResults: IntArray,
      act: ReactActivity
    ) {
      try {
        val deniedPermissions = mutableListOf<String>()
        val grantedPermissions = mutableListOf<String>()
        
        for (i in permissions.indices) {
          if (grantResults[i] == PackageManager.PERMISSION_GRANTED) {
            grantedPermissions.add(permissions[i])
          } else {
            deniedPermissions.add(permissions[i])
          }
        }
        
        Log.d("OmikitPlugin", "✅ Granted: ${grantedPermissions.joinToString()}")
        if (deniedPermissions.isNotEmpty()) {
          Log.w("OmikitPlugin", "❌ Denied: ${deniedPermissions.joinToString()}")
        }
        
        // Check if we have essential permissions for VoIP
        val hasRecordAudio = grantedPermissions.contains(Manifest.permission.RECORD_AUDIO)
        val hasCallPhone = grantedPermissions.contains(Manifest.permission.CALL_PHONE)
        val hasModifyAudio = grantedPermissions.contains(Manifest.permission.MODIFY_AUDIO_SETTINGS)
        
        val canProceed = hasRecordAudio && hasCallPhone && hasModifyAudio
        
        if (canProceed) {
          Log.d("OmikitPlugin", "🎉 Essential VoIP permissions granted!")
        } else {
          Log.e("OmikitPlugin", "⚠️ Missing essential VoIP permissions - app may not work properly")
        }
        
      } catch (e: Exception) {
        Log.e("OmikitPlugin", "❌ Error handling permission results: ${e.message}", e)
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

  // ✅ Di chuyển sendEvent vào trong class để có thể access reactApplicationContext
  private fun sendEvent(eventName: String?, params: Any?) {
    if (eventName == null) {
      Log.e("OmikitPlugin", "❌ eventName is null or empty. Không thể gửi event.")
      return
    }
    
    try {
      // ✅ Kiểm tra reactApplicationContext
      if (reactApplicationContext == null) {
        Log.e("OmikitPlugin", "❌ reactApplicationContext is null")
        return
      }
      
      if (!reactApplicationContext.hasActiveReactInstance()) {
        Log.w("OmikitPlugin", "⚠️ ReactApplicationContext không có active React instance")
        return
      }
      
      // ✅ Sử dụng RCTDeviceEventEmitter cho Android (tương thích với DeviceEventEmitter)
      try {
        reactApplicationContext
          .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
          .emit(eventName, params)
      } catch (e1: Exception) {
        // ✅ Fallback to RCTNativeAppEventEmitter
        try {
          reactApplicationContext
            .getJSModule(com.facebook.react.modules.core.RCTNativeAppEventEmitter::class.java)
            .emit(eventName, params)
        } catch (e2: Exception) {
          Log.e("OmikitPlugin", "❌ Both event emitters failed: RCTDevice: ${e1.message}, RCTNativeApp: ${e2.message}")
        }
      }
      
    } catch (e: Exception) {
      Log.e("OmikitPlugin", "❌ Error sending event $eventName: ${e.message}", e)
    }
  }

  // ✅ Thêm method để React Native biết các event được hỗ trợ
  override fun getConstants(): MutableMap<String, Any> {
    return hashMapOf(
      "CALL_STATE_CHANGED" to CALL_STATE_CHANGED,
      "MUTED" to MUTED,
      "HOLD" to HOLD,
      "SPEAKER" to SPEAKER,
      "CALL_QUALITY" to CALL_QUALITY,
      "AUDIO_CHANGE" to AUDIO_CHANGE,
      "SWITCHBOARD_ANSWER" to SWITCHBOARD_ANSWER,
      "REQUEST_PERMISSION" to REQUEST_PERMISSION,
      "CLICK_MISSED_CALL" to CLICK_MISSED_CALL,
      "AUTO_UNREGISTER_STATUS" to "AUTO_UNREGISTER_STATUS"
    )
  }

  @ReactMethod
  fun checkAndRequestPermissions(isVideo: Boolean, promise: Promise) {
    try {
      val missingPermissions = getMissingPermissions(isVideo)
      
      if (missingPermissions.isEmpty()) {
        Log.d("OmikitPlugin", "✅ All permissions already granted")
        promise.resolve(true)
        return
      }
      
      Log.d("OmikitPlugin", "📋 Missing permissions: ${missingPermissions.joinToString()}")
      
      // Store promise for callback
      permissionPromise = promise
      
      ActivityCompat.requestPermissions(
        reactApplicationContext.currentActivity!!,
        missingPermissions.toTypedArray(),
        REQUEST_PERMISSIONS_CODE,
      )
    } catch (e: Exception) {
      Log.e("OmikitPlugin", "❌ Error checking permissions: ${e.message}", e)
      promise.resolve(false)
    }
  }

  private fun getMissingPermissions(isVideo: Boolean): List<String> {
    val allPermissions = mutableListOf<String>()
    
    // Basic permissions for VoIP
    allPermissions.addAll(arrayOf(
      Manifest.permission.USE_SIP,
      Manifest.permission.CALL_PHONE,
      Manifest.permission.MODIFY_AUDIO_SETTINGS,
      Manifest.permission.RECORD_AUDIO,
    ))
    
    // Video call permissions
    if (isVideo) {
      allPermissions.add(Manifest.permission.CAMERA)
    }
    
    // Android 13+ notifications
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      allPermissions.add(Manifest.permission.POST_NOTIFICATIONS)
    }
    
    // Android 14+ foreground service permissions  
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      allPermissions.addAll(arrayOf(
        Manifest.permission.FOREGROUND_SERVICE_MICROPHONE,
        Manifest.permission.FOREGROUND_SERVICE_PHONE_CALL
      ))
    }
    
    return allPermissions.filter { permission ->
      ContextCompat.checkSelfPermission(reactApplicationContext, permission) != PackageManager.PERMISSION_GRANTED
    }
  }

  @ReactMethod
  fun checkPermissionStatus(promise: Promise) {
    try {
      val permissionStatus = mutableMapOf<String, Any>()
      
      // Essential permissions
      val essentialPermissions = arrayOf(
        Manifest.permission.RECORD_AUDIO,
        Manifest.permission.CALL_PHONE,
        Manifest.permission.MODIFY_AUDIO_SETTINGS,
        Manifest.permission.USE_SIP
      )
      
      // Check essential permissions
      val missingEssential = mutableListOf<String>()
      val grantedEssential = mutableListOf<String>()
      
      essentialPermissions.forEach { permission ->
        if (ContextCompat.checkSelfPermission(reactApplicationContext, permission) == PackageManager.PERMISSION_GRANTED) {
          grantedEssential.add(permission)
        } else {
          missingEssential.add(permission)
        }
      }
      
      // Check Android 14+ foreground service permissions
      val foregroundServiceStatus = mutableMapOf<String, Boolean>()
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        foregroundServiceStatus["FOREGROUND_SERVICE_MICROPHONE"] = ContextCompat.checkSelfPermission(
          reactApplicationContext, 
          Manifest.permission.FOREGROUND_SERVICE_MICROPHONE
        ) == PackageManager.PERMISSION_GRANTED
        
        foregroundServiceStatus["FOREGROUND_SERVICE_PHONE_CALL"] = ContextCompat.checkSelfPermission(
          reactApplicationContext, 
          Manifest.permission.FOREGROUND_SERVICE_PHONE_CALL
        ) == PackageManager.PERMISSION_GRANTED
      }
      
      // Check system alert window permission
      val canDrawOverlays = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        Settings.canDrawOverlays(reactApplicationContext)
      } else {
        true
      }
      
      permissionStatus["essentialGranted"] = grantedEssential
      permissionStatus["essentialMissing"] = missingEssential
      permissionStatus["canMakeVoipCalls"] = missingEssential.isEmpty()
      permissionStatus["foregroundServicePermissions"] = foregroundServiceStatus
      permissionStatus["canDrawOverlays"] = canDrawOverlays
      permissionStatus["androidVersion"] = Build.VERSION.SDK_INT
      permissionStatus["targetSdk"] = reactApplicationContext.applicationInfo.targetSdkVersion
      
      val map = Arguments.makeNativeMap(permissionStatus)
      promise.resolve(map)
      
    } catch (e: Exception) {
      Log.e("OmikitPlugin", "❌ Error checking permission status: ${e.message}", e)
      promise.resolve(null)
    }
  }

  @ReactMethod
  fun requestSystemAlertWindowPermission(promise: Promise) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      if (!Settings.canDrawOverlays(reactApplicationContext)) {
        permissionPromise = promise
        val intent = Intent(
          Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
          Uri.parse("package:${reactApplicationContext.packageName}")
        )
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
        reactApplicationContext.currentActivity?.startActivityForResult(intent, REQUEST_OVERLAY_PERMISSION_CODE)
      } else {
        promise.resolve(true)
      }
    } else {
      promise.resolve(true)
    }
  }

  /**
   * Request specific permissions for error codes 450, 451, 452
   * Shows permission request popup for customers
   * @param codes - Array of permission codes to request (450, 451, 452)
   * @param promise - Promise to resolve with request result
   */
  @ReactMethod
  fun requestPermissionsByCodes(codes: ReadableArray, promise: Promise) {
    try {
      val permissionCodes = codes.toArrayList().map { it.toString().toInt() }
      val permissionsToRequest = mutableListOf<String>()
      
      for (code in permissionCodes) {
        when (code) {
          450 -> { // RECORD_AUDIO permission
            if (ContextCompat.checkSelfPermission(reactApplicationContext, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
              permissionsToRequest.add(Manifest.permission.RECORD_AUDIO)
            }
          }
          451 -> { // FOREGROUND_SERVICE permissions  
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
              if (ContextCompat.checkSelfPermission(reactApplicationContext, Manifest.permission.FOREGROUND_SERVICE_MICROPHONE) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.FOREGROUND_SERVICE_MICROPHONE)
              }
              if (ContextCompat.checkSelfPermission(reactApplicationContext, Manifest.permission.FOREGROUND_SERVICE_PHONE_CALL) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.FOREGROUND_SERVICE_PHONE_CALL)
              }
            }
          }
          452 -> { // POST_NOTIFICATIONS permission
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
              if (ContextCompat.checkSelfPermission(reactApplicationContext, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.POST_NOTIFICATIONS)
              }
            }
          }
        }
      }
      
      if (permissionsToRequest.isEmpty()) {
        promise.resolve(true)
        return
      }
      
      // Store promise for callback
      permissionPromise = promise
      
      Log.d("OmikitPlugin", "🔐 Requesting permissions for codes ${permissionCodes.joinToString()}: ${permissionsToRequest.joinToString()}")
      
      ActivityCompat.requestPermissions(
        reactApplicationContext.currentActivity!!,
        permissionsToRequest.toTypedArray(),
        REQUEST_PERMISSIONS_CODE
      )
      
    } catch (e: Exception) {
      Log.e("OmikitPlugin", "❌ Error requesting permissions by codes: ${e.message}", e)
      promise.reject("ERROR_PERMISSION_REQUEST", "Failed to request permissions: ${e.message}")
    }
  }

  private fun requestPermission(isVideo: Boolean) {
    val missingPermissions = getMissingPermissions(isVideo)
    
    if (missingPermissions.isEmpty()) {
      Log.d("OmikitPlugin", "✅ All permissions already granted")
      return
    }
    
    Log.d("OmikitPlugin", "📋 Requesting missing permissions for Android ${Build.VERSION.SDK_INT}: ${missingPermissions.joinToString()}")
    
    ActivityCompat.requestPermissions(
      reactApplicationContext.currentActivity!!,
      missingPermissions.toTypedArray(),
      REQUEST_PERMISSIONS_CODE,
    )
  }

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

  override fun onCatalystInstanceDestroy() {
    super.onCatalystInstanceDestroy()
    try {
      // ✅ Cleanup resources
    } catch (e: Exception) {
      Log.e("OmikitPlugin", "❌ Error during module cleanup: ${e.message}", e)
    }
  }

  // ✅ Thêm listener cho AUTO-UNREGISTER status
  private val autoUnregisterListener = object : OmiListener {
    override fun onAutoUnregisterStatus(isScheduled: Boolean, timeUntilExecution: Long) {
      // ✅ Ngăn chặn nếu sắp thực hiện (< 3 giây)
      if (isScheduled && timeUntilExecution > 0 && timeUntilExecution < 3000) {
        Log.w("OmikitPlugin", "🚨 AUTO-UNREGISTER sắp thực hiện trong ${timeUntilExecution}ms - ngăn chặn khẩn cấp!")
        preventAutoUnregisterCrash("Emergency prevention from listener - ${timeUntilExecution}ms remaining")
      }
      
      // ✅ Gửi event cho React Native
      try {
        val statusData = mapOf(
          "isScheduled" to isScheduled,
          "timeUntilExecution" to timeUntilExecution,
          "timestamp" to System.currentTimeMillis()
        )
        val map = createSafeWritableMap(statusData)
        sendEvent("AUTO_UNREGISTER_STATUS", map)
      } catch (e: Exception) {
        Log.e("OmikitPlugin", "❌ Error sending AUTO_UNREGISTER_STATUS event: ${e.message}", e)
      }
    }
    
    // ✅ Implement các method khác của OmiListener (delegate to main listener)
    override fun incomingReceived(callerId: Int?, phoneNumber: String?, isVideo: Boolean?) {
      this@OmikitPluginModule.incomingReceived(callerId, phoneNumber, isVideo)
    }
    
    override fun onCallEstablished(callerId: Int, phoneNumber: String?, isVideo: Boolean?, startTime: Long, transactionId: String?) {
      this@OmikitPluginModule.onCallEstablished(callerId, phoneNumber, isVideo, startTime, transactionId)
    }
    
    override fun onCallEnd(callInfo: MutableMap<String, Any?>, statusCode: Int) {
      this@OmikitPluginModule.onCallEnd(callInfo, statusCode)
    }
    
    override fun onConnecting() {
      this@OmikitPluginModule.onConnecting()
    }
    
    override fun onDescriptionError() {
      this@OmikitPluginModule.onDescriptionError()
    }
    
    override fun onFcmReceived(uuid: String, userName: String, avatar: String) {
      this@OmikitPluginModule.onFcmReceived(uuid, userName, avatar)
    }
    
    override fun onRinging(callerId: Int, transactionId: String?) {
      this@OmikitPluginModule.onRinging(callerId, transactionId)
    }
    
    override fun networkHealth(stat: Map<String, *>, quality: Int) {
      this@OmikitPluginModule.networkHealth(stat, quality)
    }
    
    override fun onAudioChanged(audioInfo: Map<String, Any>) {
      this@OmikitPluginModule.onAudioChanged(audioInfo)
    }
    
    override fun onHold(isHold: Boolean) {
      this@OmikitPluginModule.onHold(isHold)
    }
    
    override fun onMuted(isMuted: Boolean) {
      this@OmikitPluginModule.onMuted(isMuted)
    }
    
    override fun onOutgoingStarted(callerId: Int, phoneNumber: String?, isVideo: Boolean?) {
      this@OmikitPluginModule.onOutgoingStarted(callerId, phoneNumber, isVideo)
    }
    
    override fun onSwitchBoardAnswer(sip: String) {
      this@OmikitPluginModule.onSwitchBoardAnswer(sip)
    }
    
    override fun onRegisterCompleted(statusCode: Int) {
      this@OmikitPluginModule.onRegisterCompleted(statusCode)
    }
    
    override fun onRequestPermission(permissions: Array<String>) {
      this@OmikitPluginModule.onRequestPermission(permissions)
    }
    
    override fun onVideoSize(width: Int, height: Int) {
      this@OmikitPluginModule.onVideoSize(width, height)
    }
  }

  // ✅ Helper function để hide notification một cách an toàn
  @ReactMethod
  fun hideSystemNotificationSafely(promise: Promise) {
    try {
      // ✅ Delay 2 giây để đảm bảo registration hoàn tất
      Handler(Looper.getMainLooper()).postDelayed({
        try {
          // ✅ Gọi function hide notification với error handling
          OmiClient.getInstance(reactApplicationContext!!).hideSystemNotificationAndUnregister("Registration check completed")
          Log.d("OmikitPlugin", "✅ Successfully hidden system notification and unregistered")
          promise.resolve(true)
        } catch (e: Exception) {
          Log.e("OmikitPlugin", "❌ Failed to hide system notification: ${e.message}", e)
          promise.resolve(false)
        }
      }, 2000) // Delay 2 giây
    } catch (e: Exception) {
      Log.e("OmikitPlugin", "❌ Error in hideSystemNotificationSafely: ${e.message}", e)
      promise.resolve(false)
    }
  }

  // ✅ Function để chỉ ẩn notification mà không unregister
  @ReactMethod
  fun hideSystemNotificationOnly(promise: Promise) {
    try {
      OmiClient.getInstance(reactApplicationContext!!).hideSystemNotification()
      Log.d("OmikitPlugin", "✅ Successfully hidden system notification (keeping registration)")
      promise.resolve(true)
    } catch (e: Exception) {
      Log.e("OmikitPlugin", "❌ Failed to hide system notification only: ${e.message}", e)
      promise.resolve(false)
    }
  }

  // ✅ Function để ẩn notification và unregister với custom reason
  @ReactMethod
  fun hideSystemNotificationAndUnregister(reason: String, promise: Promise) {
    try {
      OmiClient.getInstance(reactApplicationContext!!).hideSystemNotificationAndUnregister(reason)
      Log.d("OmikitPlugin", "✅ Successfully hidden notification and unregistered: $reason")
      promise.resolve(true)
    } catch (e: Exception) {
      Log.e("OmikitPlugin", "❌ Failed to hide notification and unregister: ${e.message}", e)
      promise.resolve(false)
    }
  }

  // ✅ Function để chỉ kiểm tra credentials và tự động disconnect
  @ReactMethod
  fun checkCredentials(data: ReadableMap, promise: Promise) {
    mainScope.launch {
      val userName = data.getString("userName")
      val password = data.getString("password")
      val realm = data.getString("realm")
      val host = data.getString("host") ?: "vh.omicrm.com"
      val firebaseToken = data.getString("fcmToken")
      val projectId = data.getString("projectId") ?: ""

      // Validate required parameters
      if (userName.isNullOrEmpty() || password.isNullOrEmpty() || realm.isNullOrEmpty() || firebaseToken.isNullOrEmpty()) {
        Log.e("OmikitPlugin", "❌ Missing required parameters for credential check")
        promise.resolve(mapOf("success" to false, "message" to "Missing required parameters"))
        return@launch
      }

      withContext(Dispatchers.Default) {
        try {
          Log.d("OmikitPlugin", "🔍 Checking credentials for user: $userName")
          
          OmiClient.getInstance(reactApplicationContext!!).checkCredentials(
            userName = userName ?: "",
            password = password ?: "",
            realm = realm ?: "",
            firebaseToken = firebaseToken ?: "",
            host = host,
            projectId = projectId
          ) { success, statusCode, message ->
            Log.d("OmikitPlugin", "🔍 Credential check callback - success: $success, status: $statusCode, message: $message")
            
            val result = mapOf(
              "success" to success,
              "statusCode" to statusCode,
              "message" to (message ?: "")
            )
            
            promise.resolve(Arguments.makeNativeMap(result))
          }
          
        } catch (e: Exception) {
          Log.e("OmikitPlugin", "❌ Error during credential check: ${e.message}", e)
          val errorResult = mapOf(
            "success" to false,
            "message" to e.message
          )
          promise.resolve(Arguments.makeNativeMap(errorResult))
        }
      }
    }
  }

  // ✅ Function để register với full control options
  @ReactMethod
  fun registerWithOptions(data: ReadableMap, promise: Promise) {
    mainScope.launch {
      val userName = data.getString("userName")
      val password = data.getString("password")
      val realm = data.getString("realm")
      val host = data.getString("host") ?: "vh.omicrm.com"
      val isVideo = data.getBoolean("isVideo")
      val firebaseToken = data.getString("fcmToken")
      val projectId = data.getString("projectId") ?: ""
      val showNotification = data.getBoolean("showNotification") ?: true
      val enableAutoUnregister = data.getBoolean("enableAutoUnregister") ?: true

      // Validate required parameters
      if (userName.isNullOrEmpty() || password.isNullOrEmpty() || realm.isNullOrEmpty() || firebaseToken.isNullOrEmpty()) {
        Log.e("OmikitPlugin", "❌ Missing required parameters for registration with options")
        promise.resolve(mapOf("success" to false, "message" to "Missing required parameters"))
        return@launch
      }

      withContext(Dispatchers.Default) {
        try {
          Log.d("OmikitPlugin", "⚙️ Registering with options for user: $userName - showNotification: $showNotification, enableAutoUnregister: $enableAutoUnregister")
          
          OmiClient.getInstance(reactApplicationContext!!).registerWithOptions(
            userName = userName ?: "",
            password = password ?: "",
            realm = realm ?: "",
            isVideo = isVideo ?: true,
            firebaseToken = firebaseToken ?: "",
            host = host ,
            projectId = projectId,
            showNotification = showNotification,
            enableAutoUnregister = enableAutoUnregister
          ) { success, statusCode, message ->
            Log.d("OmikitPlugin", "⚙️ Registration with options callback - success: $success, status: $statusCode, message: $message")
            
            val result = mapOf(
              "success" to success,
              "statusCode" to statusCode,
              "message" to (message ?: "")
            )
            
            promise.resolve(Arguments.makeNativeMap(result))
          }
          
        } catch (e: Exception) {
          Log.e("OmikitPlugin", "❌ Error during registration with options: ${e.message}", e)
          val errorResult = mapOf(
            "success" to false,
            "message" to e.message
          )
          promise.resolve(Arguments.makeNativeMap(errorResult))
        }
      }
    }
  }
}
