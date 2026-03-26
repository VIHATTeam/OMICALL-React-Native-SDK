package com.omikitplugin

import android.graphics.SurfaceTexture
import android.util.Log
import android.view.Surface
import android.view.TextureView
import android.view.ViewGroup
import android.widget.FrameLayout
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
  SimpleViewManager<FrameLayout>() {

  val localView: FrameLayout = FrameLayout(context)
  private val cameraView: TextureView = TextureView(context)

  @Volatile
  private var isSurfaceReady = false
  private var pendingRefreshPromise: Promise? = null

  init {
    // TextureView fills container — RN styles (width/height) control the FrameLayout
    localView.addView(cameraView, FrameLayout.LayoutParams(
      FrameLayout.LayoutParams.MATCH_PARENT,
      FrameLayout.LayoutParams.MATCH_PARENT
    ))

    cameraView.surfaceTextureListener = object : TextureView.SurfaceTextureListener {
      override fun onSurfaceTextureAvailable(surface: SurfaceTexture, width: Int, height: Int) {
        isSurfaceReady = true
        pendingRefreshPromise?.let { promise ->
          pendingRefreshPromise = null
          doRefresh(promise)
        }
      }

      override fun onSurfaceTextureSizeChanged(surface: SurfaceTexture, width: Int, height: Int) {}

      override fun onSurfaceTextureDestroyed(surface: SurfaceTexture): Boolean {
        isSurfaceReady = false
        pendingRefreshPromise = null
        return false
      }

      override fun onSurfaceTextureUpdated(surface: SurfaceTexture) {}
    }
  }

  override fun getName(): String = "OmiLocalCameraView"

  override fun createViewInstance(p0: ThemedReactContext): FrameLayout {
    (localView.parent as? ViewGroup)?.removeView(localView)
    return localView
  }

  fun localViewInstance(): FrameLayout = localView

  @ReactMethod
  fun refresh(promise: Promise) {
    UiThreadUtil.runOnUiThread {
      if (isSurfaceReady && cameraView.surfaceTexture != null) {
        doRefresh(promise)
      } else {
        pendingRefreshPromise = promise
      }
    }
  }

  private fun doRefresh(promise: Promise) {
    try {
      val surface = Surface(cameraView.surfaceTexture)
      OmiClient.getInstance(context.applicationContext).setupLocalVideoFeed(surface)
      Log.d("OmiLocalCameraView", "Connected local video feed to surface")

      ScaleManager.adjustAspectRatioCrop(
        cameraView,
        Size(cameraView.width, cameraView.height),
        Size(3, 4)
      )
      promise.resolve(true)
    } catch (e: Exception) {
      Log.e("OmiLocalCameraView", "Error refreshing: ${e.message}")
      promise.resolve(false)
    }
  }
}
