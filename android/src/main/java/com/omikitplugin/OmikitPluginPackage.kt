package com.omikitplugin

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager


class OmikitPluginPackage : ReactPackage {

  private var localView: OmiLocalCameraView? = null
  private var remoteView: OmiRemoteCameraView? = null

  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    if (localView == null) {
      localView = OmiLocalCameraView(reactContext)
    }
    if (remoteView == null) {
      remoteView = OmiRemoteCameraView(reactContext)
    }
    // ViewManagers are also NativeModules — refresh() is accessible via
    // NativeModules.OmiLocalCameraView and NativeModules.OmiRemoteCameraView
    return listOf(
      OmikitPluginModule(reactContext),
      localView!!,
      remoteView!!,
    )
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    if (localView == null) {
      localView = OmiLocalCameraView(reactContext)
    }
    if (remoteView == null) {
      remoteView = OmiRemoteCameraView(reactContext)
    }
    return listOf(localView!!, remoteView!!)
  }
}
