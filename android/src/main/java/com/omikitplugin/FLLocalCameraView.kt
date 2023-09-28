package com.omikitplugin

import android.view.Surface
import android.view.TextureView
import android.widget.LinearLayout
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import vn.vihat.omicall.omisdk.OmiClient
import vn.vihat.omicall.omisdk.videoutils.ScaleManager
import vn.vihat.omicall.omisdk.videoutils.Size

class FLLocalCameraView(private val context: ReactApplicationContext) :
  SimpleViewManager<LinearLayout>() {
  val localView : LinearLayout = LinearLayout(context)
  private val cameraView : TextureView = TextureView(context)

  init {
      localView.addView(cameraView)
  }

  override fun getName(): String {
    return "FLLocalCameraView"
  }

  override fun createViewInstance(p0: ThemedReactContext): LinearLayout {
    return localView
  }

  fun localViewInstance(): LinearLayout {
    return localView
  }

  fun refreshTexture() {
      cameraView.surfaceTexture?.let {
        // OmiClient.getInstance().setupLocalVideoFeed(Surface(it))
        ScaleManager.adjustAspectRatio(
          cameraView,
          Size(cameraView.width, cameraView.height),
          Size(1280, 720)
        )
      }
  }
}
