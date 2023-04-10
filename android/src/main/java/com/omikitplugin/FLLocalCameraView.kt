package com.omikitplugin

import android.graphics.SurfaceTexture
import android.util.Log
import android.view.Surface
import android.view.TextureView
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import vn.vihat.omicall.omisdk.OmiClient
import vn.vihat.omicall.omisdk.videoutils.ScaleManager
import vn.vihat.omicall.omisdk.videoutils.Size

class FLLocalCameraView(private val context: ReactApplicationContext) :
  SimpleViewManager<TextureView>(), TextureView.SurfaceTextureListener {
  private val localView : TextureView = TextureView(context)

  init {
    localView.surfaceTextureListener = this
  }

  @ReactMethod
  fun refresh(promise: Promise) {
    localView.surfaceTexture?.let {
      OmiClient.instance.setupLocalVideoFeed(Surface(it))
      ScaleManager.adjustAspectRatio(localView,
        Size(localView.width, localView.height),
        Size(1280,720)
      )
    }
  }

  override fun getName(): String {
    return "FLLocalCameraView"
  }

  override fun createViewInstance(p0: ThemedReactContext): TextureView {
    return localView
  }

  override fun onSurfaceTextureAvailable(surface: SurfaceTexture, width: Int, height: Int) {
    Log.d("a", "onSurfaceTextureAvailable")
  }

  override fun onSurfaceTextureSizeChanged(surface: SurfaceTexture, width: Int, height: Int) {
    Log.d("a", "onSurfaceTextureSizeChanged")
  }

  override fun onSurfaceTextureDestroyed(surface: SurfaceTexture): Boolean {
    Log.d("a", "onSurfaceTextureDestroyed")
    return false
  }

  override fun onSurfaceTextureUpdated(surface: SurfaceTexture) {
    Log.d("a", "onSurfaceTextureUpdated")
  }
}
