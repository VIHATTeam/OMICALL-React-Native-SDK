# ==========================================
# ProGuard Rules for React Native 0.76+
# Fix crash: TurboModuleRegistry PlatformConstants not found
# ==========================================

# ==========================================
# React Native Core - CRITICAL
# ==========================================

# Keep React Native TurboModule Registry
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep interface com.facebook.react.turbomodule.core.interfaces.** { *; }

# Keep Core Modules (PlatformConstants, DeviceInfo, etc.)
-keep class com.facebook.react.modules.core.** { *; }
-keep class com.facebook.react.modules.** { *; }

# Keep JSI (JavaScript Interface)
-keep class com.facebook.jsi.** { *; }

# Keep Hermes Engine
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.hermes.instrumentation.** { *; }

# Keep React Native Defaults
-keep class com.facebook.react.defaults.** { *; }
-keep class com.facebook.react.** { *; }

# Keep Fabric (New Architecture)
-keep class com.facebook.react.fabric.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.views.** { *; }

# Keep JNI and SoLoader
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.soloader.** { *; }

# Keep all native methods
-keepclasseswithmembernames,includedescriptorclasses class * {
    native <methods>;
}

# Keep React Native ViewManagers
-keep public class * extends com.facebook.react.uimanager.ViewManager {
    <init>(...);
    public <methods>;
}

# Keep React Native Modules
-keep public class * extends com.facebook.react.bridge.NativeModule {
    <init>(...);
    public <methods>;
}
-keep public class * extends com.facebook.react.bridge.BaseJavaModule {
    <init>(...);
    public <methods>;
}

# Keep TurboModule spec interfaces
-keep interface com.facebook.react.turbomodule.core.interfaces.TurboModule { *; }

# Keep ReactPackage implementations
-keep public class * implements com.facebook.react.ReactPackage {
    public <methods>;
}

# ==========================================
# Firebase
# ==========================================

-keep class com.google.android.gms.common.** {*;}
-keepclassmembers enum * {*;}

-keepclassmembers class com.android.installreferrer.api.** {
  *;
}

# ==========================================
# OmiKit Plugin
# ==========================================

-keepclassmembers class com.omikitplugin.** {
  *;
}

# Keep OmiKit native modules
-keep class vn.vihat.omicall.** { *; }
-keep class net.gotev.sipservice.** { *; }

# ==========================================
# Additional React Native
# ==========================================

# Keep React component constructors
-keepclassmembers class * extends com.facebook.react.uimanager.ReactShadowNode {
    <init>(...);
}

# Keep React Native Image
-keep class com.facebook.react.views.image.** { *; }
-keep class com.facebook.react.modules.fresco.** { *; }

# Keep React Native DevSupport
-keep class com.facebook.react.devsupport.** { *; }
-keep class com.facebook.react.packagerconnection.** { *; }

# Keep Annotations
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes InnerClasses
-keepattributes EnclosingMethod

# Keep SourceFile and LineNumber for better stack traces
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ==========================================
# Common third-party libraries
# ==========================================

# React Navigation
-keep class com.reactnavigation.** { *; }
-keep class com.swmansion.** { *; }
-keep class com.th3rdwave.** { *; }

# Async Storage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# Device Info
-keep class com.learnium.RNDeviceInfo.** { *; }

# Permissions
-keep class com.zoontek.rnpermissions.** { *; }

# Gesture Handler
-keep class com.swmansion.gesturehandler.** { *; }

# Reanimated
-keep class com.swmansion.reanimated.** { *; }

# Safe Area Context
-keep class com.th3rdwave.safeareacontext.** { *; }

# Screens
-keep class com.swmansion.rnscreens.** { *; }
