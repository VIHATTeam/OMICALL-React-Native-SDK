package com.omikitplugin.expo

import android.content.Context
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityLifecycleListener

/**
 * Expo Package that registers OmiKit's ReactActivityLifecycleListener. Expo
 * autolinking discovers this class via expo-module.config.json (android.modules)
 * and calls it from the generated MainActivity — no user edits needed.
 */
class OmikitExpoPackage : Package {
  override fun createReactActivityLifecycleListeners(
    activityContext: Context
  ): List<ReactActivityLifecycleListener> {
    return listOf(OmikitReactActivityLifecycleListener())
  }
}
