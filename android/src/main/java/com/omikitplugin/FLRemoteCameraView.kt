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

class FLRemoteCameraView(private val context: ReactApplicationContext) :
  SimpleViewManager<TextureView>(), TextureView.SurfaceTextureListener {
  private val remoteView : TextureView = TextureView(context)

  init {
    remoteView.surfaceTextureListener = this
  }

  @ReactMethod
  fun refresh(promise: Promise) {
    remoteView.surfaceTexture?.let {
      OmiClient.instance.setupIncomingVideoFeed(Surface(it))
      ScaleManager.adjustAspectRatio(remoteView,
        Size(remoteView.width, remoteView.height),
        Size(1280,720)
      )
    }
  }

  override fun getName(): String {
    return "FLRemoteCameraView"
  }

  override fun createViewInstance(p0: ThemedReactContext): TextureView {
    return remoteView
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
