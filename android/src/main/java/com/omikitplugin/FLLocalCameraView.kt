package com.omikitplugin

import android.view.TextureView
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext

class FLLocalCameraView(private val context: ReactApplicationContext) :
  SimpleViewManager<TextureView>() {
  val localView : TextureView = TextureView(context)

  override fun getName(): String {
    return "FLLocalCameraView"
  }

  override fun createViewInstance(p0: ThemedReactContext): TextureView {
    return localView
  }

  fun localViewInstance(): TextureView {
    return localView
  }
}
