# Consumer ProGuard/R8 rules for omikit-plugin.
#
# Applied automatically to every app that depends on this module (declared via
# `consumerProguardFiles` in android/build.gradle), so host apps that turn on
# `minifyEnabled true` keep working without copying any rules by hand.
#
# The OMI Android SDK ships its own consumer-rules.pro covering
# vn.vihat.omicall.**, net.gotev.sipservice.**, org.pjsip.** and Retrofit/Gson,
# so those are NOT repeated here — only what this plugin itself needs.

# React Native resolves native modules and view managers by the string returned
# from getName(), and instantiates them reflectively. Renaming or removing any of
# them fails at runtime with no compile-time warning.
-keep class com.omikitplugin.** { *; }

# The Expo package is named as a string in expo-module.config.json
# ("com.omikitplugin.expo.OmikitExpoPackage") and loaded by Expo autolinking via
# reflection, so R8 cannot see the reference.
-keep class com.omikitplugin.expo.** { *; }

# Base classes React Native instantiates reflectively for this module.
-keep public class * extends com.facebook.react.bridge.NativeModule { <init>(...); public <methods>; }
-keep public class * extends com.facebook.react.bridge.BaseJavaModule { <init>(...); public <methods>; }
-keep public class * extends com.facebook.react.uimanager.ViewManager { <init>(...); public <methods>; }
-keep public class * implements com.facebook.react.ReactPackage { public <methods>; }

# Kotlin enums that cross the bridge — values()/valueOf() are reflective.
-keepclassmembers enum com.omikitplugin.** {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep native method names (JNI links by name).
-keepclasseswithmembernames,includedescriptorclasses class * {
    native <methods>;
}
