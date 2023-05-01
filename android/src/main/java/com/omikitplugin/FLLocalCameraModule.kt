package com.omikitplugin

import android.view.Surface
import android.view.TextureView
import android.widget.LinearLayout
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import vn.vihat.omicall.omisdk.OmiClient
import vn.vihat.omicall.omisdk.videoutils.ScaleManager
import vn.vihat.omicall.omisdk.videoutils.Size

class FLLocalCameraModule(reactContext: ReactApplicationContext, localViewManager: FLLocalCameraView) :
  ReactContextBaseJavaModule(reactContext) {

  var cameraView: LinearLayout
  lateinit var localViewManager : FLLocalCameraView

  override fun getName(): String {
    return "FLLocalCameraView"
  }

  init {
    cameraView = localViewManager.localView
    this.localViewManager = localViewManager
  }

  @ReactMethod
  fun refresh(promise: Promise) {
    this.localViewManager.refreshTexture()
    promise.resolve(true)
  }
}
