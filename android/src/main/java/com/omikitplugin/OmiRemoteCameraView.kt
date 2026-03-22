package com.omikitplugin

import android.graphics.SurfaceTexture
import android.util.Log
import android.view.Surface
import android.view.TextureView
import android.view.ViewGroup
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import vn.vihat.omicall.omisdk.OmiClient
import vn.vihat.omicall.omisdk.videoutils.ScaleManager
import vn.vihat.omicall.omisdk.videoutils.Size

class OmiRemoteCameraView(private val context: ReactApplicationContext) :
  SimpleViewManager<TextureView>() {

  val remoteView: TextureView = TextureView(context)

  // Track whether the surface is ready for rendering
  @Volatile
  private var isSurfaceReady = false

  // Queued refresh — executed when surface becomes available
  private var pendingRefreshPromise: Promise? = null

  init {
    remoteView.surfaceTextureListener = object : TextureView.SurfaceTextureListener {
      override fun onSurfaceTextureAvailable(surface: SurfaceTexture, width: Int, height: Int) {
        isSurfaceReady = true
        // Execute queued refresh if any
        pendingRefreshPromise?.let { promise ->
          pendingRefreshPromise = null
          doRefresh(promise)
        }
      }

      override fun onSurfaceTextureSizeChanged(surface: SurfaceTexture, width: Int, height: Int) {}

      override fun onSurfaceTextureDestroyed(surface: SurfaceTexture): Boolean {
        isSurfaceReady = false
        pendingRefreshPromise = null
        return true
      }

      override fun onSurfaceTextureUpdated(surface: SurfaceTexture) {}
    }
  }

  override fun getName(): String {
    return "OmiRemoteCameraView"
  }

  override fun createViewInstance(p0: ThemedReactContext): TextureView {
    // Detach from previous parent if remounted
    // (avoids "The specified child already has a parent" crash)
    (remoteView.parent as? ViewGroup)?.removeView(remoteView)
    return remoteView
  }

  fun remoteViewInstance(): TextureView {
    return remoteView
  }

  // Exposed to JS via NativeModules.OmiRemoteCameraView.refresh()
  @ReactMethod
  fun refresh(promise: Promise) {
    UiThreadUtil.runOnUiThread {
      if (isSurfaceReady && remoteView.surfaceTexture != null) {
        doRefresh(promise)
      } else {
        // Surface not ready yet — queue and execute when available
        pendingRefreshPromise = promise
      }
    }
  }

  private fun doRefresh(promise: Promise) {
    try {
      // Connect TextureView surface to SDK incoming video feed
      val surface = Surface(remoteView.surfaceTexture)
      OmiClient.getInstance(context.applicationContext).setupIncomingVideoFeed(surface)
      Log.d("OmiRemoteCameraView", "Connected remote video feed to surface")

      ScaleManager.adjustAspectRatio(
        remoteView,
        Size(remoteView.width, remoteView.height),
        Size(1280, 720)
      )
      promise.resolve(true)
    } catch (e: Exception) {
      Log.e("OmiRemoteCameraView", "Error refreshing: ${e.message}")
      promise.resolve(false)
    }
  }
}
