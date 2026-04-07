package com.omikitplugin

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager

class OmikitPluginPackage : TurboReactPackage() {

  // Cache shared instances so the NativeModule interface and ViewManager interface
  // refer to the same object — required for NativeModules.OmiLocalCameraView.refresh() to
  // affect the view that React Native is actually rendering.
  private var localView: OmiLocalCameraView? = null
  private var remoteView: OmiRemoteCameraView? = null

  private fun getLocalView(reactContext: ReactApplicationContext): OmiLocalCameraView {
    if (localView == null) localView = OmiLocalCameraView(reactContext)
    return localView!!
  }

  private fun getRemoteView(reactContext: ReactApplicationContext): OmiRemoteCameraView {
    if (remoteView == null) remoteView = OmiRemoteCameraView(reactContext)
    return remoteView!!
  }

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return when (name) {
      OmikitPluginModule.NAME -> OmikitPluginModule(reactContext)
      "OmiLocalCameraView"   -> getLocalView(reactContext)
      "OmiRemoteCameraView"  -> getRemoteView(reactContext)
      else                   -> null
    }
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      // isTurboModule = false because OmikitPluginModule extends ReactContextBaseJavaModule,
      // not the codegen-generated spec class. The RN interop layer automatically wraps
      // it for New Architecture / bridgeless mode. Set to true only after migrating
      // OmikitPluginModule to extend NativeOmikitPluginSpec.
      mapOf(
        OmikitPluginModule.NAME to ReactModuleInfo(
          OmikitPluginModule.NAME,
          OmikitPluginModule.NAME,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          false, // isCxxModule
          false  // isTurboModule — interop layer handles New Arch
        ),
        // ViewManagers also registered as NativeModules so JS can call
        // NativeModules.OmiLocalCameraView.refresh() etc.
        "OmiLocalCameraView" to ReactModuleInfo(
          "OmiLocalCameraView",
          "OmiLocalCameraView",
          false, false, false, false
        ),
        "OmiRemoteCameraView" to ReactModuleInfo(
          "OmiRemoteCameraView",
          "OmiRemoteCameraView",
          false, false, false, false
        ),
      )
    }
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    // Reuse cached instances — same objects registered as NativeModules above.
    return listOf(
      getLocalView(reactContext),
      getRemoteView(reactContext),
    )
  }
}
