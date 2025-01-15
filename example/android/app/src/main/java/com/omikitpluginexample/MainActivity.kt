package com.omikitpluginexample

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.content.Intent;
import android.os.Bundle;
import android.util.Log
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.ReactApplicationContext
import com.omikitplugin.OmikitPluginModule
import com.google.firebase.FirebaseApp;

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "OmikitPluginExample"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

       private var reactApplicationContext: ReactApplicationContext? = null

         override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
            FirebaseApp.initializeApp(this);
        val reactInstanceManager: ReactInstanceManager = reactNativeHost.reactInstanceManager
        val currentContext = reactInstanceManager.currentReactContext
        if (currentContext != null && currentContext is ReactApplicationContext) {
            reactApplicationContext = currentContext
            Log.d("MainActivity", "ReactApplicationContext is available.")
        } else {
            Log.d("MainActivity", "ReactApplicationContext Not ready yet, will listen to the event.")
        }

        reactInstanceManager.addReactInstanceEventListener(object : ReactInstanceManager.ReactInstanceEventListener {
            override fun onReactContextInitialized(reactContext: com.facebook.react.bridge.ReactContext) {
                if (reactContext is ReactApplicationContext) {
                    reactApplicationContext = reactContext
                    Log.d("MainActivity", "ReactApplicationContext đã được khởi tạo.")
                }
            }
        })
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        if (intent != null) {
            reactApplicationContext?.let {
                OmikitPluginModule.Companion.onGetIntentFromNotification(it, intent, this)
            } ?: Log.e("MainActivity", "ReactApplicationContext has not been initialized in onNewIntent.")
        } else {
            Log.e("MainActivity", "Intent in onNewIntent is null.")
        }
    }
    override fun onResume() {
        super.onResume()
        reactApplicationContext?.let {
            OmikitPluginModule.Companion.onResume(this)
            intent?.let { intent ->
                OmikitPluginModule.Companion.onGetIntentFromNotification(it, intent, this)
            }
        } ?: Log.e("MainActivity", "ReactApplicationContext has not been initialized in onResume.")
    }
}
