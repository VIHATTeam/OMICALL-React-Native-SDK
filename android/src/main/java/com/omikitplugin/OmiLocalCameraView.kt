package com.omikitplugin

import android.graphics.SurfaceTexture
import android.util.Log
import android.view.Surface
import android.view.TextureView
import android.view.ViewGroup
import android.widget.LinearLayout
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import vn.vihat.omicall.omisdk.OmiClient
import vn.vihat.omicall.omisdk.videoutils.ScaleManager
import vn.vihat.omicall.omisdk.videoutils.Size

class OmiLocalCameraView(private val context: ReactApplicationContext) :
  SimpleViewManager<LinearLayout>() {

  val localView: LinearLayout = LinearLayout(context)
  private val cameraView: TextureView = TextureView(context)

  // Track whether the surface is ready for rendering
  @Volatile
  private var isSurfaceReady = false

  // Queued refresh — executed when surface becomes available
  private var pendingRefreshPromise: Promise? = null

  init {
    localView.addView(cameraView)
    cameraView.surfaceTextureListener = object : TextureView.SurfaceTextureListener {
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
    return "OmiLocalCameraView"
  }

  override fun createViewInstance(p0: ThemedReactContext): LinearLayout {
    // Detach from previous parent if remounted
    // (avoids "The specified child already has a parent" crash)
    (localView.parent as? ViewGroup)?.removeView(localView)
    return localView
  }

  fun localViewInstance(): LinearLayout {
    return localView
  }

  // Exposed to JS via NativeModules.OmiLocalCameraView.refresh()
  @ReactMethod
  fun refresh(promise: Promise) {
    UiThreadUtil.runOnUiThread {
      if (isSurfaceReady && cameraView.surfaceTexture != null) {
        doRefresh(promise)
      } else {
        // Surface not ready yet — queue and execute when available
        pendingRefreshPromise = promise
      }
    }
  }

  private fun doRefresh(promise: Promise) {
    try {
      val surface = Surface(cameraView.surfaceTexture)
      val client = OmiClient.getInstance(context.applicationContext)

      // Connect local camera feed — delay slightly to ensure camera subsystem ready
      // (matches native SDK sample behavior with AppUtils.postDelay)
      android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
        try {
          client.setupLocalVideoFeed(surface)
          Log.d("OmiLocalCameraView", "Connected local video feed to surface")

          ScaleManager.adjustAspectRatio(
            cameraView,
            Size(cameraView.width, cameraView.height),
            Size(9, 16)
          )
        } catch (e: Exception) {
          Log.e("OmiLocalCameraView", "Error setting up local feed: ${e.message}")
        }
      }, 300)

      promise.resolve(true)
    } catch (e: Exception) {
      Log.e("OmiLocalCameraView", "Error refreshing: ${e.message}")
      promise.resolve(false)
    }
  }
}
