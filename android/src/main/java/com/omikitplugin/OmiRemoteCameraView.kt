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

class OmiRemoteCameraView(private val context: ReactApplicationContext) :
  SimpleViewManager<FrameLayout>() {

  companion object {
    @Volatile
    var instance: OmiRemoteCameraView? = null
  }

  val remoteContainer: FrameLayout = FrameLayout(context)
  private val remoteView: TextureView = TextureView(context)

  @Volatile
  private var isSurfaceReady = false
  private var pendingRefreshPromise: Promise? = null

  init {
    instance = this
    remoteContainer.addView(remoteView, FrameLayout.LayoutParams(
      FrameLayout.LayoutParams.MATCH_PARENT,
      FrameLayout.LayoutParams.MATCH_PARENT
    ))

    remoteView.surfaceTextureListener = object : TextureView.SurfaceTextureListener {
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

  override fun getName(): String = "OmiRemoteCameraView"

  override fun createViewInstance(p0: ThemedReactContext): FrameLayout {
    (remoteContainer.parent as? ViewGroup)?.removeView(remoteContainer)
    return remoteContainer
  }

  fun remoteViewInstance(): FrameLayout = remoteContainer

  @ReactMethod
  fun refresh(promise: Promise) {
    UiThreadUtil.runOnUiThread {
      if (isSurfaceReady && remoteView.surfaceTexture != null) {
        doRefresh(promise)
      } else {
        pendingRefreshPromise = promise
      }
    }
  }

  private fun doRefresh(promise: Promise) {
    try {
      val surface = Surface(remoteView.surfaceTexture)
      OmiClient.getInstance(context.applicationContext).setupIncomingVideoFeed(surface)
      Log.d("OmiRemoteCameraView", "Connected remote video feed to surface")

      // Default landscape; updated by onVideoSize when PJSIP reports actual dimensions
      ScaleManager.adjustAspectRatio(
        remoteView,
        Size(remoteView.width, remoteView.height),
        Size(640, 480)
      )
      promise.resolve(true)
    } catch (e: Exception) {
      Log.e("OmiRemoteCameraView", "Error refreshing: ${e.message}")
      promise.resolve(false)
    }
  }

  /**
   * Called from OmikitPluginModule.onVideoSize() when PJSIP reports
   * actual remote video dimensions. Re-applies correct aspect ratio.
   */
  fun updateAspectRatio(videoWidth: Int, videoHeight: Int) {
    UiThreadUtil.runOnUiThread {
      if (remoteView.width > 0 && remoteView.height > 0 && videoWidth > 0 && videoHeight > 0) {
        Log.d("OmiRemoteCameraView", "updateAspectRatio: video=${videoWidth}x${videoHeight}")
        ScaleManager.adjustAspectRatio(
          remoteView,
          Size(remoteView.width, remoteView.height),
          Size(videoWidth, videoHeight)
        )
      }
    }
  }
}
