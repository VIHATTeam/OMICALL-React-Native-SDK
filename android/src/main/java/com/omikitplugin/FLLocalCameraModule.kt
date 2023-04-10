package com.omikitplugin

import android.view.Surface
import android.view.TextureView
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import vn.vihat.omicall.omisdk.OmiClient
import vn.vihat.omicall.omisdk.videoutils.ScaleManager
import vn.vihat.omicall.omisdk.videoutils.Size

class FLLocalCameraModule(reactContext: ReactApplicationContext, localViewManager: FLLocalCameraView) :
  ReactContextBaseJavaModule(reactContext) {

  var cameraView: TextureView

  override fun getName(): String {
    return "FLLocalCameraView"
  }

  init {
    cameraView = localViewManager.localView
  }

  @ReactMethod
  fun refresh(promise: Promise) {
    cameraView.surfaceTexture?.let {
      OmiClient.instance.setupLocalVideoFeed(Surface(it))
      ScaleManager.adjustAspectRatio(cameraView,
        Size(cameraView.width, cameraView.height),
        Size(1280,720)
      )
      promise.resolve(true)
    }
  }
}
