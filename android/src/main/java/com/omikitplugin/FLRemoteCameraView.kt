package com.omikitplugin

import android.view.TextureView
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext

class FLRemoteCameraView(private val context: ReactApplicationContext) :
  SimpleViewManager<TextureView>() {
  val remoteView : TextureView = TextureView(context)

  override fun getName(): String {
    return "FLRemoteCameraView"
  }

  override fun createViewInstance(p0: ThemedReactContext): TextureView {
    return remoteView
  }

  fun localViewInstance(): TextureView {
    return remoteView
  }
}
