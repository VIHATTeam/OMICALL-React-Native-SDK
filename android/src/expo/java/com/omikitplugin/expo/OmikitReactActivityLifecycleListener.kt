package com.omikitplugin.expo

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.ReactApplicationContext
import com.omikitplugin.OmikitPluginModule
import expo.modules.core.interfaces.ReactActivityLifecycleListener

/**
 * Wires the OmiKit MainActivity hooks that a bare React Native app would call
 * manually (onResume / onNewIntent). Registered via OmikitExpoPackage so Expo's
 * generated MainActivity dispatches to it — the consuming app edits nothing.
 *
 * This source set (android/src/expo) is only compiled when expo-modules-core is
 * on the classpath (i.e. the app is an Expo app); bare RN builds skip it.
 */
class OmikitReactActivityLifecycleListener : ReactActivityLifecycleListener {

  override fun onResume(activity: android.app.Activity) {
    (activity as? ReactActivity)?.let { OmikitPluginModule.onResume(it) }
  }

  override fun onNewIntent(intent: Intent): Boolean {
    val activity = currentReactActivity ?: return false
    // Early pickup handling — runs even before React is ready.
    OmikitPluginModule.handlePickupIntentEarly(activity, intent)
    val ctx = reactContextOf(activity)
    if (ctx != null) {
      OmikitPluginModule.onGetIntentFromNotification(ctx, intent, activity)
    }
    return false
  }

  // Expo passes the activity to onCreate; cache it for onNewIntent.
  override fun onCreate(activity: android.app.Activity, savedInstanceState: Bundle?) {
    cachedActivity = activity as? ReactActivity
  }

  companion object {
    @Volatile
    private var cachedActivity: ReactActivity? = null

    private val currentReactActivity: ReactActivity?
      get() = cachedActivity

    private fun reactContextOf(activity: ReactActivity): ReactApplicationContext? {
      // `activity.reactInstanceManager` is protected; reach the instance
      // manager through the ReactApplication host instead (same path the bare
      // example's MainActivity uses).
      val host = (activity.application as? ReactApplication)?.reactNativeHost ?: return null
      return host.reactInstanceManager.currentReactContext as? ReactApplicationContext
    }
  }
}
