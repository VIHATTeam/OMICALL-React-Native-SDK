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
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
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
 * Helper functions for parameter validation and safe OmiClient access
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
    
    /**
     * Safe OmiClient access to prevent crashes during service shutdown
     */
    fun safeOmiClientAccess(context: ReactApplicationContext, action: (OmiClient) -> Unit): Boolean {
        return try {
            val omiClient = OmiClient.getInstance(context)
            if (omiClient != null) {
                action(omiClient)
                true
            } else {
                false
            }
        } catch (e: Exception) {
            Log.e("OMISDK", "Error accessing OmiClient: ${e.message}")
            false
        }
    }
}

class OmikitPluginModule(reactContext: ReactApplicationContext?) :
  ReactContextBaseJavaModule(reactContext), ActivityEventListener, OmiListener {
  private val mainScope = CoroutineScope(Dispatchers.Main)
  private var isIncoming: Boolean = false
  private var isAnswerCall: Boolean = false
  @Volatile private var permissionPromise: Promise? = null

  // Helper for bridgeless mode (Expo/RN 0.81+) where currentActivity
  // is not directly available as inherited property
  private val safeActivity: Activity?
    get() = reactApplicationContext?.currentActivity
  
  // Call state management to prevent concurrent calls
  private var isCallInProgress: Boolean = false
  private var lastCallTime: Long = 0
  private val callCooldownMs: Long = 2000 // 2 seconds cooldown between calls
  private val callStateLock = Any()
  
  // Mutex for thread-safe OmiClient operations
  private val omiClientMutex = Mutex()

  override fun getName(): String {
    return NAME
  }

  override fun getConstants(): MutableMap<String, Any> {
    return mutableMapOf(
      "CALL_STATE_CHANGED" to CALL_STATE_CHANGED,
      "MUTED" to MUTED,
      "HOLD" to HOLD,
      "SPEAKER" to SPEAKER,
      "REMOTE_VIDEO_READY" to REMOTE_VIDEO_READY,
      "CLICK_MISSED_CALL" to CLICK_MISSED_CALL,
      "SWITCHBOARD_ANSWER" to SWITCHBOARD_ANSWER,
      "CALL_QUALITY" to CALL_QUALITY,
      "AUDIO_CHANGE" to AUDIO_CHANGE,
      "REQUEST_PERMISSION" to REQUEST_PERMISSION
    )
  }

  /**
   * Check if we can start a new call (no concurrent calls, cooldown passed)
   */
  private fun canStartNewCall(): Boolean {
    synchronized(callStateLock) {
      val currentTime = System.currentTimeMillis()
      val timeSinceLastCall = currentTime - lastCallTime
      
      // Check if call is in progress or cooldown not passed
      if (isCallInProgress) {

        return false
      }
      
      if (timeSinceLastCall < callCooldownMs) {
        return false
      }
      
      return true
    }
  }
  
  /**
   * Mark call as started
   */
  private fun markCallStarted() {
    synchronized(callStateLock) {
      isCallInProgress = true
      lastCallTime = System.currentTimeMillis()
    }
  }
  
  /**
   * Mark call as ended
   */
  private fun markCallEnded() {
    synchronized(callStateLock) {
      isCallInProgress = false
    }
  }


    private val handler = Handler(Looper.getMainLooper())

  override fun incomingReceived(callerId: Int?, phoneNumber: String?, isVideo: Boolean?) {
    isIncoming = true;
    isAnswerCall = false; // Reset answer state for new incoming call
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

      Handler(Looper.getMainLooper()).postDelayed({
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
      // Reset call state variables
      isIncoming = false
      isAnswerCall = false
      // Clear call progress state when remote party ends call
      markCallEnded()
      // Kiểm tra kiểu dữ liệu trước khi ép kiểu để tránh lỗi
      val call = callInfo

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
      sendEvent(CALL_STATE_CHANGED, map)
  }

  override fun onConnecting() {
      val map: WritableMap = WritableNativeMap().apply {
          putString("callerNumber", "")
          putBoolean("isVideo", NotificationService.isVideo)
          putBoolean("incoming", isIncoming)
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

      if (callDirection == "inbound") {
        isIncoming = true;
      } else if (callDirection == "outbound") {
        isIncoming = false;
      }

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
      sendEvent(CALL_STATE_CHANGED, map)
  }


  override fun networkHealth(stat: Map<String, *>, quality: Int) {
    val map: WritableMap = WritableNativeMap()
    map.putInt("quality", quality)
    // Pass full diagnostics from stat map
    val statMap: WritableMap = WritableNativeMap()
    (stat["mos"] as? Number)?.let { statMap.putDouble("mos", it.toDouble()) }
    (stat["jitter"] as? Number)?.let { statMap.putDouble("jitter", it.toDouble()) }
    (stat["latency"] as? Number)?.let { statMap.putDouble("latency", it.toDouble()) }
    (stat["ppl"] as? Number)?.let { statMap.putDouble("packetLoss", it.toDouble()) }
    (stat["lcn"] as? Number)?.let { statMap.putInt("lcn", it.toInt()) }
    map.putMap("stat", statMap)
    sendEvent(CALL_QUALITY, map)
  }

  override fun onAudioChanged(audioInfo: Map<String, Any>) {
    val audio: WritableMap = WritableNativeMap()
    audio.putString("name", audioInfo["name"] as? String ?: "")
    audio.putInt("type", audioInfo["type"] as? Int ?: 0)
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
      // For outgoing calls, set states appropriately
      isIncoming = false;
      isAnswerCall = false;
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
    sendEvent(REQUEST_PERMISSION, map)

  }

  override fun onVideoSize(width: Int, height: Int) {
    // PJSIP reports actual remote video dimensions — update aspect ratio dynamically
    OmiRemoteCameraView.instance?.updateAspectRatio(width, height)
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

    moduleInstance = this
    reactApplicationContext!!.addActivityEventListener(this)
    Handler(Looper.getMainLooper()).post {
      // Use applicationContext — pjsip video subsystem needs it for CameraManager access
      val ctx = reactApplicationContext?.applicationContext ?: reactApplicationContext!!
      val client = OmiClient.getInstance(ctx)
      client.addCallStateListener(this)
      client.addCallStateListener(autoUnregisterListener)
      client.setDebug(false)
    }
  }


  @ReactMethod
  fun startServices(promise: Promise) {
    try {
      // ✅ Prepare audio system trước khi start services
      prepareAudioSystem()

      OmiClient.getInstance(reactApplicationContext!!).addAccountListener(accountListener)

      OmiClient.getInstance(reactApplicationContext!!).setDebug(false)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.resolve(false)
    }
  }

  // ✅ Helper function removed - deprecated in new SDK version
  // preventAutoUnregisterCrash is no longer supported

  // ✅ Method để check status AUTO-UNREGISTER (DEPRECATED)
  @ReactMethod
  fun getAutoUnregisterStatus(promise: Promise) {

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
          promise.resolve(null)
        }
      }
    } catch (e: Exception) {
      promise.resolve(null)
    }
  }

  // ✅ Method để manually prevent AUTO-UNREGISTER (DEPRECATED)
  @ReactMethod
  fun preventAutoUnregister(reason: String, promise: Promise) {

    // Function removed - no longer supported
    promise.resolve(false)
  }

  // ✅ Convenience methods cho các scenario phổ biến (DEPRECATED)
  @ReactMethod
  fun prepareForIncomingCall(promise: Promise) {
    try {
      OmiClient.getInstance(reactApplicationContext!!).prepareForIncomingCall()
      promise.resolve(true)
    } catch (e: Exception) {
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun prepareForOutgoingCall(promise: Promise) {
    try {
      OmiClient.getInstance(reactApplicationContext!!).prepareForOutgoingCall()
      promise.resolve(true)
    } catch (e: Exception) {
      promise.resolve(false)
    }
  }

  private fun prepareAudioSystem() {
    try {
      if (!isNetworkAvailable()) {
        return
      }

      // Release any existing audio focus
      val audioManager = reactApplicationContext?.getSystemService(android.content.Context.AUDIO_SERVICE) as? android.media.AudioManager
      audioManager?.let {
        it.mode = android.media.AudioManager.MODE_NORMAL
      }
    } catch (e: Exception) {
      Log.w("OmikitPlugin", "Audio preparation warning: ${e.message}")
    }
  }

  @Suppress("MissingPermission")
  private fun isNetworkAvailable(): Boolean {
    return try {
      val connectivityManager = reactApplicationContext?.getSystemService(android.content.Context.CONNECTIVITY_SERVICE) as? android.net.ConnectivityManager
        ?: return true
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        capabilities.hasCapability(android.net.NetworkCapabilities.NET_CAPABILITY_INTERNET)
      } else {
        @Suppress("DEPRECATION")
        connectivityManager.activeNetworkInfo?.isConnectedOrConnecting == true
      }
    } catch (e: Exception) {
      Log.w("OmikitPlugin", "Network check failed: ${e.message}")
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

  @ReactMethod
  fun systemAlertWindow(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      promise.resolve(true)
      return
    }
    val result = Settings.canDrawOverlays(reactApplicationContext)
    promise.resolve(result)
  }

  @ReactMethod
  fun openSystemAlertSetting(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      promise.resolve(true)
      return
    }
    val ctx = reactApplicationContext ?: run {
      promise.resolve(false)
      return
    }
    val intent = Intent(
      Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
      Uri.parse("package:" + ctx.packageName)
    )
    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
    ctx.startActivity(intent)
    promise.resolve(true)
  }

  @ReactMethod
  fun configPushNotification(data: ReadableMap, promise: Promise) {
    try {
        val context = reactApplicationContext ?: run {
            promise.reject("E_NULL_CONTEXT", "React context is null")
            return
        }

        safeActivity?.runOnUiThread {
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
                val isUserBusy = if (data.hasKey("isUserBusy")) data.getBoolean("isUserBusy") else false

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
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("E_CONFIG_FAILED", "Failed to configure push notification", e)
            }
        } ?: run {
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
      val host = data.getString("host").let { if (it.isNullOrEmpty()) "vh.omicrm.com" else it }
      val isVideo = if (data.hasKey("isVideo")) data.getBoolean("isVideo") else false
      val firebaseToken = data.getString("fcmToken")
      val projectId = data.getString("projectId") ?: ""
      val isSkipDevices = if (data.hasKey("isSkipDevices")) data.getBoolean("isSkipDevices") else false

      // Validate required parameters
      if (!ValidationHelper.validateRequired(mapOf(
          "userName" to userName,
          "password" to password,
          "realm" to realm,
          "fcmToken" to firebaseToken
        ), promise)) return@launch

      withContext(Dispatchers.Default) {
        try {
          // Cleanup before register using logout callback
          try {
            val logoutComplete = kotlinx.coroutines.CompletableDeferred<Unit>()
            OmiClient.getInstance(reactApplicationContext!!).logout {
              logoutComplete.complete(Unit)
            }
            // Wait for logout callback with timeout
            kotlinx.coroutines.withTimeoutOrNull(3000) { logoutComplete.await() }
          } catch (e: Exception) {
            Log.w("OmikitPlugin", "Cleanup warning (expected): ${e.message}")
          }

          OmiClient.getInstance(reactApplicationContext!!).silentRegister(
            userName = userName ?: "",
            password = password ?: "",
            realm = realm ?: "",
            isVideo = isVideo ?: true,
            firebaseToken = firebaseToken ?: "",
            host = host,
            projectId = projectId,
            isSkipDevices = isSkipDevices
          ) { success, statusCode, message ->
            if (success || statusCode == 200) {
              promise.resolve(true)
            } else {
              val (errorCode, errorMessage) = OmiRegistrationStatus.getError(statusCode)
              promise.reject(errorCode, "$errorMessage (Status: $statusCode)")
            }
          }
          
        } catch (e: Exception) {
          promise.reject("ERROR_INITIALIZATION_EXCEPTION", "OMICALL initialization failed due to an unexpected error: ${e.message}. Please check your network connection and configuration.", e)
        }
      }
    }
  }

  @ReactMethod
  fun initCallWithApiKey(data: ReadableMap, promise: Promise) {
    mainScope.launch {
      var loginResult = false
      val usrName = data.getString("fullName") ?: ""
      val usrUuid = data.getString("usrUuid")  ?: ""
      val apiKey = data.getString("apiKey") ?: ""
      val isVideo = if (data.hasKey("isVideo")) data.getBoolean("isVideo") else false
      val phone = data.getString("phone")
      val firebaseToken = data.getString("fcmToken") ?: ""
      val projectId = data.getString("projectId") ?: ""
      
      withContext(Dispatchers.Default) {
        try {
          // Validate required parameters
          if (!ValidationHelper.validateRequired(mapOf(
              "fullName" to usrName,
              "usrUuid" to usrUuid,
              "apiKey" to apiKey,
              "fcmToken" to firebaseToken
            ), promise)) {
            Log.e("OmikitPlugin", "❌ Validation failed")
            return@withContext
          }

          // Check RECORD_AUDIO permission for Android 14+
          val hasRecordAudio = ContextCompat.checkSelfPermission(
            reactApplicationContext, 
            Manifest.permission.RECORD_AUDIO
          ) == PackageManager.PERMISSION_GRANTED

          if (!hasRecordAudio) {
            promise.resolve(false)
            return@withContext
          }
          // Cleanup before register using logout callback
          try {
            omiClientMutex.withLock {
              val logoutComplete = kotlinx.coroutines.CompletableDeferred<Unit>()
              OmiClient.getInstance(reactApplicationContext!!).logout {
                logoutComplete.complete(Unit)
              }
              kotlinx.coroutines.withTimeoutOrNull(3000) { logoutComplete.await() }
            }
          } catch (e: Exception) {
            Log.w("OmikitPlugin", "Cleanup warning (expected): ${e.message}")
          }

          omiClientMutex.withLock {
            loginResult = OmiClient.registerWithApiKey(
              apiKey ?: "",
              usrName ?: "",
              usrUuid ?: "",
              phone ?: "",
              isVideo,
              firebaseToken,
              projectId
            )
          }
           promise.resolve(loginResult)
        } catch (e: Exception) {
          Log.e("OmikitPlugin", "❌ Error during API key registration: ${e.message}", e)
          promise.resolve(false)
        }
      }
    }
  }

  @ReactMethod
  fun getInitialCall(data: ReadableMap, promise: Promise) {
      // JS passes { counter: N } as ReadableMap — extract the counter value.
      // Default to 4 (Android) to allow retries while SIP registers.
      val counter = if (data.hasKey("counter")) data.getInt("counter") else 4
      getInitialCallWithCounter(counter, promise)
  }

  private fun getInitialCallWithCounter(counter: Int, promise: Promise) {
      val context = reactApplicationContext ?: run {
          promise.resolve(false)
          return
      }

      val call = Utils.getActiveCall(context)
      if (call == null) {
          if (counter <= 0) {
              promise.resolve(false)
          } else {
              mainScope.launch {
                  delay(1000) // Wait 1 second before retry
                  getInitialCallWithCounter(counter - 1, promise)
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
      val statusPendingCall = OmiKitUtils().getStatusPendingCall(context)

      // 🔥 CRITICAL FIX: Auto-answer if user already clicked pickup button
      // statusPendingCall: 0 = no action, 2 = incoming (opened notification), 5 = accepted (clicked pickup)
      val shouldAutoAnswer = call.direction == "inbound" &&
                             !call.isAccepted &&
                             call.state == 3 &&
                             statusPendingCall == 5 // 5 = User clicked pickup (CONFIRMED)

      if (shouldAutoAnswer) {
          try {
              OmiClient.getInstance(context).pickUp()
              // Status already cleared by getStatusPendingCall()
          } catch (e: Exception) {
              Log.e("getInitialCall RN", "❌ AUTO-ANSWER: Failed to answer call: ${e.message}", e)
          }
      }

      val map: WritableMap = WritableNativeMap().apply {
          putString("callerNumber", phoneNumber)
          putBoolean("incoming", call.direction == "inbound")
          putInt("_id", call.id)
          putInt("status", call.state)
          putBoolean("muted", false)
          putBoolean("isVideo", call.isVideo ?: false)
          putString("typeNumber", typeNumber)
          putBoolean("autoAnswered", shouldAutoAnswer) // Add flag for RN side
      }

      if (call.state == 3 && statusPendingCall != 0) {
          call.state = statusPendingCall
      }

      promise.resolve(map)

      if (statusPendingCall == 2 && call.state != 5) {
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
      val activity = safeActivity
      if (activity == null) {
        promise.reject("E_NO_ACTIVITY", "Current activity is null")
        return
      }
      activity.runOnUiThread {
        val phoneNumber = data.getString("phoneNumber")
        if (phoneNumber.isNullOrEmpty()) {
          promise.reject("E_INVALID_PHONE", "Phone number is required")
          return@runOnUiThread
        }
        val isVideo = if (data.hasKey("isVideo")) data.getBoolean("isVideo") else false

        val startCallResult =
          OmiClient.getInstance(reactApplicationContext!!).startCall(phoneNumber, isVideo)
        var statusCalltemp = startCallResult.value as Int
        if (startCallResult.value == 200 || startCallResult.value == 407) {
          statusCalltemp = 8
        }
        map.putInt("status", statusCalltemp)
        map.putString("_id", "")
        map.putString("message", messageCall(startCallResult.value))
        promise.resolve(map)
      }
    } else {
      map.putInt("status", 4)
      map.putString("_id", "")
      map.putString("message", messageCall(406))
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
    val map: WritableMap = WritableNativeMap()
    if (audio == PackageManager.PERMISSION_GRANTED) {
      mainScope.launch {
        val uuid = data.getString("usrUuid") ?: ""
        val isVideo = if (data.hasKey("isVideo")) data.getBoolean("isVideo") else false

        val startCallResult =
          OmiClient.getInstance(reactApplicationContext!!).startCallWithUuid(uuid, isVideo)
        var statusCalltemp = startCallResult.value as Int
        if (startCallResult.value == 200 || startCallResult.value == 407) {
          statusCalltemp = 8
        }
        map.putInt("status", statusCalltemp)
        map.putString("_id", "")
        map.putString("message", messageCall(startCallResult.value))
        promise.resolve(map)
      }
    } else {
      map.putInt("status", 4)
      map.putString("_id", "")
      map.putString("message", messageCall(406))
      promise.resolve(map)
    }
  }


  @ReactMethod
  fun joinCall(promise: Promise) {
      val appContext = reactApplicationContext.applicationContext
      val activity = safeActivity

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
    ValidationHelper.safeOmiClientAccess(reactApplicationContext!!) { omiClient ->
      if (isIncoming && !isAnswerCall) {
        omiClient.decline()
      } else {
        omiClient.hangUp()
      }
    }
    // Clear call state when ending call
    markCallEnded()
    promise.resolve(true)
  }

 @ReactMethod
  fun rejectCall(promise: Promise) {
      if (isIncoming) {
          ValidationHelper.safeOmiClientAccess(reactApplicationContext!!) { omiClient ->
              if (!isAnswerCall) {
                  omiClient.declineWithCode(true) // 486 Busy Here
              } else {
                  omiClient.hangUp()
              }
          }
          // Clear call state when rejecting call
          markCallEnded()
          promise.resolve(true)
      } else {
          promise.resolve(false)
      }
  }

  @ReactMethod
  fun dropCall(promise: Promise) {
    ValidationHelper.safeOmiClientAccess(reactApplicationContext!!) { omiClient ->
      if (isIncoming && !isAnswerCall) {
        omiClient.declineWithCode(false) // 603
      } else {
        omiClient.hangUp()
      }
    }
    // Clear call state when dropping call
    markCallEnded()
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
    val activity = safeActivity
    if (activity == null) { promise.resolve(null); return }
    activity.runOnUiThread {
      val newStatus = OmiClient.getInstance(reactApplicationContext!!).toggleSpeaker()
      promise.resolve(newStatus)
      sendEvent(SPEAKER, newStatus)
    }
  }

  @ReactMethod
  fun sendDTMF(data: ReadableMap, promise: Promise) {
    val activity = safeActivity
    if (activity == null) { promise.resolve(false); return }
    activity.runOnUiThread {
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
    val activity = safeActivity
    if (activity == null) { promise.resolve(false); return }
    activity.runOnUiThread {
      OmiClient.getInstance(reactApplicationContext!!).switchCamera()
      promise.resolve(true)
    }
  }

  @ReactMethod
  fun toggleOmiVideo(promise: Promise) {
    val activity = safeActivity
    if (activity == null) { promise.resolve(false); return }
    activity.runOnUiThread {
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
    Log.d("OmikitPlugin", "📍 getCurrentUser called")
    Log.d("OmikitPlugin", "📍 reactApplicationContext is null? ${reactApplicationContext == null}")
    mainScope.launch {
      var callResult: Any? = null
      withContext(Dispatchers.Default) {
        try {
          val omiClient = OmiClient.getInstance(reactApplicationContext!!)
          Log.d("OmikitPlugin", "📍 OmiClient instance: $omiClient")
          callResult = omiClient.getCurrentUser()
          Log.d("OmikitPlugin", "📍 getCurrentUser raw result: $callResult")
          Log.d("OmikitPlugin", "📍 result type: ${callResult?.javaClass?.name ?: "null"}")
          if (callResult is Map<*, *>) {
            Log.d("OmikitPlugin", "📍 result keys: ${(callResult as Map<*, *>).keys}")
            Log.d("OmikitPlugin", "📍 result values: ${(callResult as Map<*, *>).values}")
          }
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

        Log.d("OmikitPlugin", "✅ getCurrentUser resolved: extension=${call["extension"]}, uuid=${call["uuid"]}, full_name=${call["full_name"]}")
        promise.resolve(map)
      } else {
        Log.w("OmikitPlugin", "⚠️ getCurrentUser resolved NULL — callResult=$callResult, isMap=${callResult is Map<*, *>}")
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

  // MARK: - Getter Functions
  @ReactMethod
  fun getProjectId(promise: Promise) {
    try {
      val info = OmiClient.registrationInfo
      if (info?.projectId != null) {
        promise.resolve(info.projectId)
        return
      }
      // Fallback: get from Firebase project ID
      val firebaseProjectId = try {
        com.google.firebase.FirebaseApp.getInstance().options.projectId
      } catch (e: Exception) { null }
      promise.resolve(firebaseProjectId)
    } catch (e: Throwable) {
      promise.resolve(null)
    }
  }

  @ReactMethod
  fun getAppId(promise: Promise) {
    try {
      val info = OmiClient.registrationInfo
      if (info?.appId != null) {
        promise.resolve(info.appId)
        return
      }
      // Fallback: get package name of the host app
      promise.resolve(reactApplicationContext?.packageName)
    } catch (e: Throwable) {
      promise.resolve(null)
    }
  }

  @ReactMethod
  fun getDeviceId(promise: Promise) {
    try {
      val info = OmiClient.registrationInfo
      if (info?.deviceId != null) {
        promise.resolve(info.deviceId)
        return
      }
      // Fallback: get Android ID directly
      val androidId = try {
        Settings.Secure.getString(
          reactApplicationContext?.contentResolver,
          Settings.Secure.ANDROID_ID
        )
      } catch (e: Exception) { null }
      promise.resolve(androidId)
    } catch (e: Throwable) {
      promise.resolve(null)
    }
  }

  @ReactMethod
  fun getFcmToken(promise: Promise) {
    try {
      val info = OmiClient.registrationInfo
      if (info?.firebaseToken != null) {
        promise.resolve(info.firebaseToken)
        return
      }
      // Fallback: get FCM token directly from Firebase Messaging
      try {
        com.google.firebase.messaging.FirebaseMessaging.getInstance().token
          .addOnSuccessListener { token -> promise.resolve(token) }
          .addOnFailureListener { promise.resolve(null) }
      } catch (e: Exception) {
        promise.resolve(null)
      }
    } catch (e: Throwable) {
      promise.resolve(null)
    }
  }

  @ReactMethod
  fun getSipInfo(promise: Promise) {
    try {
      val sipUser = OmiClient.getInstance(reactApplicationContext!!).getSipUser()
      val sipRealm = OmiClient.getInstance(reactApplicationContext!!).getSipRealm()
      if (!sipUser.isNullOrEmpty() && !sipRealm.isNullOrEmpty()) {
        promise.resolve("$sipUser@$sipRealm")
      } else {
        promise.resolve(sipUser)
      }
    } catch (e: Throwable) {
      promise.resolve(null)
    }
  }

  @ReactMethod
  fun getVoipToken(promise: Promise) {
    // VoIP token is iOS only, Android returns null
    promise.resolve(null)
  }

  @ReactMethod
  fun getAudio(promise: Promise) {
    val inputs = OmiClient.getInstance(reactApplicationContext!!).getAudioOutputs()
    val writeList = WritableNativeArray()
    inputs.forEach {
      val map = WritableNativeMap()
      map.putString("name", it["name"] as? String ?: "")
      map.putInt("type", it["type"] as? Int ?: 0)
      writeList.pushMap(map)
    }
    promise.resolve(writeList)
  }

  @ReactMethod
  fun getCurrentAudio(promise: Promise) {
    val currentAudio = OmiClient.getInstance(reactApplicationContext!!).getCurrentAudio()
    val map: WritableMap = WritableNativeMap()
    map.putString("name", currentAudio["name"] as? String ?: "")
    map.putInt("type", currentAudio["type"] as? Int ?: 0)
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
    val activity = safeActivity
    if (activity == null) { promise.resolve(false); return }
    activity.runOnUiThread {
      val phone = data.getString("phoneNumber")
      if (phone.isNullOrEmpty()) {
        promise.reject("E_INVALID_PHONE", "Phone number is required for transfer")
        return@runOnUiThread
      }
      OmiClient.getInstance(reactApplicationContext!!).forwardCallTo(phone)
      promise.resolve(true)
    }
  }

  companion object {
    const val NAME = "OmikitPlugin"
    const val REQUEST_PERMISSIONS_CODE = 1001
    const val REQUEST_OVERLAY_PERMISSION_CODE = 1002

    // Singleton reference for companion methods to access module instance
    @Volatile var moduleInstance: OmikitPluginModule? = null

    fun onDestroy() {
      try {
        // Cleanup OmiClient resources safely
      } catch (e: Exception) {
        Log.e("OmikitPlugin", "❌ Error during cleanup: ${e.message}", e)
      }
    }

    fun onResume(act: ReactActivity) {
      act.let { context ->
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
        val grantedPermissions = mutableListOf<String>()

        for (i in permissions.indices) {
          if (grantResults[i] == PackageManager.PERMISSION_GRANTED) {
            grantedPermissions.add(permissions[i])
          }
        }

        // Check if we have essential permissions for VoIP
        val hasRecordAudio = grantedPermissions.contains(Manifest.permission.RECORD_AUDIO)
        val hasCallPhone = grantedPermissions.contains(Manifest.permission.CALL_PHONE)
        val hasModifyAudio = grantedPermissions.contains(Manifest.permission.MODIFY_AUDIO_SETTINGS)

        val canProceed = hasRecordAudio && hasCallPhone && hasModifyAudio

        // Resolve the stored permission promise
        moduleInstance?.permissionPromise?.resolve(canProceed)
        moduleInstance?.permissionPromise = null
      } catch (e: Exception) {
        Log.e("OmikitPlugin", "Error handling permission results: ${e.message}", e)
        moduleInstance?.permissionPromise?.resolve(false)
        moduleInstance?.permissionPromise = null
      }
    }

    /**
     * 🔥 CRITICAL FIX: Handle pickup intent EARLY (before React Native ready)
     * This method can be called from onCreate/onNewIntent when React context is not ready yet
     * It will save the pickup state to SharedPreferences for later processing in getInitialCall()
     */
    fun handlePickupIntentEarly(act: Activity, intent: Intent) {
      try {
        val isIncoming = intent.getBooleanExtra(SipServiceConstants.ACTION_IS_INCOMING_CALL, false)
        if (!isIncoming) {
          return
        }

        val isAcceptedCall = intent.getBooleanExtra(
          SipServiceConstants.ACTION_ACCEPT_INCOMING_CALL, false
        )


        // Save to SharedPreferences so getInitialCall() can detect it later
        // setStatusPendingCall(true) → saves status=5 (CONFIRMED)
        // setStatusPendingCall(false) → saves status=2 (INCOMING)
        OmiKitUtils().setStatusPendingCall(act, isAcceptedCall)

        if (isAcceptedCall) {
          // Try to answer immediately if possible (may fail if SDK not ready)
          try {
            OmiClient.getInstance(act, true)?.let { client ->
              client.pickUp()
            } ?: Log.w("PICKUP-FIX", "⚠️ OmiClient not ready, will auto-answer in getInitialCall()")
          } catch (e: Exception) {
            Log.w("PICKUP-FIX", "⚠️ Cannot answer immediately (SDK not ready): ${e.message}. Will auto-answer in getInitialCall()")
          }
        }
      } catch (e: Exception) {
        Log.e("PICKUP-FIX", "❌ Error in handlePickupIntentEarly: ${e.message}", e)
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
          // Use singleton module instance instead of creating a throwaway one
          moduleInstance?.onCallEstablished(
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
      return
    }
    
    try {
      // ✅ Kiểm tra reactApplicationContext
      if (reactApplicationContext == null) {
        return
      }
      
      if (!reactApplicationContext.hasActiveReactInstance()) {
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

  @ReactMethod
  fun checkAndRequestPermissions(isVideo: Boolean, promise: Promise) {
    try {
      val missingPermissions = getMissingPermissions(isVideo)
      
      if (missingPermissions.isEmpty()) {
        promise.resolve(true)
        return
      }
      
      // Store promise for callback
      permissionPromise = promise
      
      val activity = safeActivity ?: run {
        promise.resolve(false)
        return
      }
      ActivityCompat.requestPermissions(
        activity,
        missingPermissions.toTypedArray(),
        REQUEST_PERMISSIONS_CODE,
      )
    } catch (e: Exception) {
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
      
      val map: WritableMap = WritableNativeMap()
      map.putArray("essentialGranted", Arguments.fromList(grantedEssential.toList()))
      map.putArray("essentialMissing", Arguments.fromList(missingEssential.toList()))
      map.putBoolean("canMakeVoipCalls", missingEssential.isEmpty())
      val fgServiceMap: WritableMap = WritableNativeMap()
      foregroundServiceStatus.forEach { (k, v) -> fgServiceMap.putBoolean(k, v) }
      map.putMap("foregroundServicePermissions", fgServiceMap)
      map.putBoolean("canDrawOverlays", canDrawOverlays)
      map.putInt("androidVersion", Build.VERSION.SDK_INT)
      map.putInt("targetSdk", reactApplicationContext.applicationInfo.targetSdkVersion)
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
        safeActivity?.startActivityForResult(intent, REQUEST_OVERLAY_PERMISSION_CODE)
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
      
      val activity = safeActivity ?: run {
        promise.reject("E_NULL_ACTIVITY", "Current activity is null")
        return
      }
      ActivityCompat.requestPermissions(
        activity,
        permissionsToRequest.toTypedArray(),
        REQUEST_PERMISSIONS_CODE
      )
      
    } catch (e: Exception) {
      promise.reject("ERROR_PERMISSION_REQUEST", "Failed to request permissions: ${e.message}")
    }
  }

  private fun requestPermission(isVideo: Boolean) {
    val missingPermissions = getMissingPermissions(isVideo)

    if (missingPermissions.isEmpty()) {
      return
    }

    val activity = safeActivity ?: return
    ActivityCompat.requestPermissions(
      activity,
      missingPermissions.toTypedArray(),
      REQUEST_PERMISSIONS_CODE,
    )
  }

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode == REQUEST_OVERLAY_PERMISSION_CODE) {
      val granted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        Settings.canDrawOverlays(reactApplicationContext)
      } else {
        true
      }
      permissionPromise?.resolve(granted)
      permissionPromise = null
    }
  }

  override fun onNewIntent(intent: Intent) {
    if (intent.hasExtra(SipServiceConstants.PARAM_IS_MISSED_CALL)) {
      if (intent.getBooleanExtra(SipServiceConstants.PARAM_IS_MISSED_CALL, false)) {
        val map: WritableMap = WritableNativeMap()
        map.putString("callerNumber", intent.getStringExtra(SipServiceConstants.PARAM_NUMBER) ?: "")
        map.putBoolean("isVideo", intent.getBooleanExtra(SipServiceConstants.PARAM_IS_VIDEO, false))
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

  // Auto-unregister listener - only handles onAutoUnregisterStatus
  // Other callbacks are NO-OP to prevent double-firing events (Fix #1)
  private val autoUnregisterListener = object : OmiListener {
    override fun onAutoUnregisterStatus(isScheduled: Boolean, timeUntilExecution: Long) {
      try {
        val statusData = mapOf(
          "isScheduled" to isScheduled,
          "timeUntilExecution" to timeUntilExecution,
          "timestamp" to System.currentTimeMillis()
        )
        val map = createSafeWritableMap(statusData)
        sendEvent("AUTO_UNREGISTER_STATUS", map)
      } catch (e: Exception) {
        Log.e("OmikitPlugin", "Error sending AUTO_UNREGISTER_STATUS event: ${e.message}", e)
      }
    }

    // NO-OP: main module listener handles these - avoid double-firing
    override fun incomingReceived(callerId: Int?, phoneNumber: String?, isVideo: Boolean?) {}
    override fun onCallEstablished(callerId: Int, phoneNumber: String?, isVideo: Boolean?, startTime: Long, transactionId: String?) {}
    override fun onCallEnd(callInfo: MutableMap<String, Any?>, statusCode: Int) {}
    override fun onConnecting() {}
    override fun onDescriptionError() {}
    override fun onFcmReceived(uuid: String, userName: String, avatar: String) {}
    override fun onRinging(callerId: Int, transactionId: String?) {}
    override fun networkHealth(stat: Map<String, *>, quality: Int) {}
    override fun onAudioChanged(audioInfo: Map<String, Any>) {}
    override fun onHold(isHold: Boolean) {}
    override fun onMuted(isMuted: Boolean) {}
    override fun onOutgoingStarted(callerId: Int, phoneNumber: String?, isVideo: Boolean?) {}
    override fun onSwitchBoardAnswer(sip: String) {}
    override fun onRegisterCompleted(statusCode: Int) {}
    override fun onRequestPermission(permissions: Array<String>) {}
    override fun onVideoSize(width: Int, height: Int) {}
  }

  // ✅ Helper function để hide notification một cách an toàn
  @ReactMethod
  fun hideSystemNotificationSafely(promise: Promise) {
    try {
      val context = reactApplicationContext ?: run {
        promise.resolve(false)
        return
      }
      // Delay to ensure registration completes before hiding
      mainScope.launch {
        try {
          delay(2000)
          OmiClient.getInstance(context).hideSystemNotificationAndUnregister("Registration check completed")
          promise.resolve(true)
        } catch (e: Exception) {
          promise.resolve(false)
        }
      }
    } catch (e: Exception) {
      promise.resolve(false)
    }
  }

  // ✅ Function để chỉ ẩn notification mà không unregister
  @ReactMethod
  fun hideSystemNotificationOnly(promise: Promise) {
    try {
      OmiClient.getInstance(reactApplicationContext!!).hideSystemNotification()
      promise.resolve(true)
    } catch (e: Exception) {
      promise.resolve(false)
    }
  }

  // ✅ Function để ẩn notification và unregister với custom reason
  @ReactMethod
  fun hideSystemNotificationAndUnregister(reason: String, promise: Promise) {
    try {
      OmiClient.getInstance(reactApplicationContext!!).hideSystemNotificationAndUnregister(reason)
      promise.resolve(true)
    } catch (e: Exception) {
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
      val host = data.getString("host").let { if (it.isNullOrEmpty()) "vh.omicrm.com" else it }
      val firebaseToken = data.getString("fcmToken")
      val projectId = data.getString("projectId") ?: ""

      // Validate required parameters
      if (userName.isNullOrEmpty() || password.isNullOrEmpty() || realm.isNullOrEmpty() || firebaseToken.isNullOrEmpty()) {
        promise.resolve(mapOf("success" to false, "message" to "Missing required parameters"))
        return@launch
      }

      withContext(Dispatchers.Default) {
        try {
          OmiClient.getInstance(reactApplicationContext!!).checkCredentials(
            userName = userName ?: "",
            password = password ?: "",
            realm = realm ?: "",
            firebaseToken = firebaseToken ?: "",
            host = host,
            projectId = projectId
          ) { success, statusCode, message ->
            val result = mapOf(
              "success" to success,
              "statusCode" to statusCode,
              "message" to (message ?: "")
            )
            
            promise.resolve(Arguments.makeNativeMap(result))
          }
          
        } catch (e: Exception) {
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
      val host = data.getString("host").let { if (it.isNullOrEmpty()) "vh.omicrm.com" else it }
      val isVideo = if (data.hasKey("isVideo")) data.getBoolean("isVideo") else false
      val firebaseToken = data.getString("fcmToken")
      val projectId = data.getString("projectId") ?: ""
      val showNotification = if (data.hasKey("showNotification")) data.getBoolean("showNotification") else true
      val enableAutoUnregister = if (data.hasKey("enableAutoUnregister")) data.getBoolean("enableAutoUnregister") else true

      // Validate required parameters
      if (userName.isNullOrEmpty() || password.isNullOrEmpty() || realm.isNullOrEmpty() || firebaseToken.isNullOrEmpty()) {
        promise.resolve(mapOf("success" to false, "message" to "Missing required parameters"))
        return@launch
      }

      withContext(Dispatchers.Default) {
        try {
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
            val result = mapOf(
              "success" to success,
              "statusCode" to statusCode,
              "message" to (message ?: "")
            )
            
            promise.resolve(Arguments.makeNativeMap(result))
          }
          
        } catch (e: Exception) {
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
