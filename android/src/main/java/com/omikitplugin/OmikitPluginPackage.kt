package com.omikitplugin

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager


class OmikitPluginPackage : ReactPackage {

  private var localView: FLLocalCameraView? = null
  private var remoteView: FLRemoteCameraView? = null
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    if (localView == null) {
      localView = FLLocalCameraView(reactContext)
    }
    if (remoteView == null) {
      remoteView = FLRemoteCameraView(reactContext)
    }
    return listOf(
      OmikitPluginModule(reactContext),
      FLLocalCameraModule(reactContext, localView!!),
      FLRemoteCameraModule(reactContext, remoteView!!),
    )
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    if (localView == null) {
      localView = FLLocalCameraView(reactContext)
    }
    if (remoteView == null) {
      remoteView = FLRemoteCameraView(reactContext)
    }
    return listOf(localView!!, remoteView!!)
  }
}
