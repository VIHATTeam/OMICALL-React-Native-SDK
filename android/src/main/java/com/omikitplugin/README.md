# Hướng dẫn tích hợp Omicall SDK cho React Native

## Giới thiệu

Omicall SDK cho React Native giúp tích hợp các tính năng gọi điện của Omicall vào ứng dụng React Native một cách đơn giản. SDK này cung cấp hai cách tích hợp:

1. **Sử dụng Delegate (Khuyến nghị)**: Tích hợp không xâm lấn, không cần thay đổi cấu trúc kế thừa hiện tại của ứng dụng
2. Sử dụng Inheritance: Kế thừa các lớp base của Omicall (phương pháp cũ)

## 1. Tích hợp sử dụng Delegate

### 1.1. Cài đặt

```bash
# Cài đặt package từ npm hoặc yarn
npm install omicall-react-native-sdk
# hoặc
yarn add omicall-react-native-sdk
```

### 1.2. Tích hợp trong MainActivity

#### Đối với React Native 0.78 trở lên

```kotlin
// MainActivity.kt
import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.omikitplugin.OmicallActivityDelegate

class MainActivity : ReactActivity() {
    // Khởi tạo delegate để quản lý Omicall SDK
    private val omicallDelegate = OmicallActivityDelegate(this)
    
    // Từ RN 0.78, sử dụng createReactActivityDelegate thay vì getMainComponentName
    override fun createReactActivityDelegate(): ReactActivityDelegate {
        return DefaultReactActivityDelegate(this, "YourAppName")
    }
    
    // Gọi các phương thức của delegate trong lifecycle
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        omicallDelegate.onCreate(savedInstanceState)
    }
    
    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        omicallDelegate.onNewIntent(intent)
    }
    
    override fun onResume() {
        super.onResume()
        omicallDelegate.onResume()
    }
    
    override fun onDestroy() {
        omicallDelegate.onDestroy()
        super.onDestroy()
    }
    
    override fun onRequestPermissionsResult(
        requestCode: Int, 
        permissions: Array<out String>, 
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        omicallDelegate.onRequestPermissionsResult(requestCode, permissions, grantResults)
    }
}
```

#### Đối với React Native 0.77 trở xuống

```kotlin
// MainActivity.kt
import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.omikitplugin.OmicallActivityDelegate

class MainActivity : ReactActivity() {
    // Khởi tạo delegate để quản lý Omicall SDK
    private val omicallDelegate = OmicallActivityDelegate(this)
    
    override fun getMainComponentName(): String = "YourAppName"
    
    // Gọi các phương thức của delegate trong lifecycle
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        omicallDelegate.onCreate(savedInstanceState)
    }
    
    // Các phương thức khác giống như ở phiên bản 0.78...
}
```

### 1.3. Tích hợp trong MainApplication

#### Đối với React Native 0.78 trở lên

```kotlin
// MainApplication.kt
import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader
import com.omikitplugin.OmicallApplicationDelegate

class MainApplication : Application(), ReactApplication {
    // Khởi tạo delegate để quản lý Omicall SDK
    private val omicallDelegate = OmicallApplicationDelegate(this)

    override val reactNativeHost: ReactNativeHost = object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> {
            val packageList = PackageList(this).packages.toMutableList()
            // Đảm bảo các package cần thiết cho Omicall
            return omicallDelegate.setupReactPackages(packageList)
        }

        override fun getJSMainModuleName(): String = "index"
        
        // Trong RN 0.78, không cần getMainModuleName vì đã cấu hình ở MainActivity
    }

    override val reactHost: ReactHost
        get() = DefaultReactHost.getDefaultReactHost(applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()
        
        // Khởi tạo Omicall SDK
        omicallDelegate.initialize()
        
        // Khởi tạo React Native
        SoLoader.init(this, false)
    }
}
```

#### Đối với React Native 0.77 trở xuống

```kotlin
// MainApplication.kt
import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.omikitplugin.OmicallApplicationDelegate

class MainApplication : Application(), ReactApplication {
    // Khởi tạo delegate để quản lý Omicall SDK
    private val omicallDelegate = OmicallApplicationDelegate(this)

    override val reactNativeHost: ReactNativeHost = object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> {
            val packageList = PackageList(this).packages.toMutableList()
            return omicallDelegate.setupReactPackages(packageList)
        }

        override fun getJSMainModuleName(): String = "index"
        
        override fun getMainModuleName(): String = "YourAppName"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
    }

    override fun onCreate() {
        super.onCreate()
        
        // Khởi tạo Omicall SDK
        omicallDelegate.initialize()
        
        // Khởi tạo React Native
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            DefaultNewArchitectureEntryPoint.load()
        }
        SoLoader.init(this, false)
    }
}
```

### 1.4. Cấu hình build.gradle (app level)

#### Đối với React Native 0.78 trở lên

```gradle
apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "com.facebook.react"

react {
    // Cấu hình react native
    
    // KHÔNG sử dụng enableHermes (đã loại bỏ trong 0.78)
    
    // Chỉ sử dụng các cấu hình sau nếu cần thiết
    extraPackagerArgs = ["--sourcemap-output", "$buildDir/generated/sourcemaps/react/debug/index.android.js.map"]
    
    autolinkLibrariesWithApp()
}

// Cấu hình dependencies
dependencies {
    implementation("com.facebook.react:react-android")
    
    // Hermes được cấu hình trong gradle.properties
    if (hermesEnabled.toBoolean()) {
        implementation("com.facebook.react:hermes-android")
    } else {
        implementation jscFlavor
    }
    
    // Các dependency khác...
}
```

#### Đối với React Native 0.77 trở xuống

```gradle
apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "com.facebook.react"

react {
    // Cấu hình react native
    
    // Cấu hình Hermes (cách cũ)
    enableHermes = true
    
    autolinkLibrariesWithApp()
}

// Cấu hình dependencies
dependencies {
    implementation("com.facebook.react:react-android")
    
    // Hermes được cấu hình dựa trên enableHermes
    if (enableHermes) {
        implementation("com.facebook.react:hermes-android")
    } else {
        implementation jscFlavor
    }
    
    // Các dependency khác...
}
```

## 2. Sử dụng trong JavaScript/TypeScript

```javascript
import OmicallSDK from 'omicall-react-native-sdk';

// Khởi tạo với API key
await OmicallSDK.initCallWithApiKey('YOUR_API_KEY', userData);

// Tạo cuộc gọi
const result = await OmicallSDK.startCall({
  phoneNumber: '0123456789',
  isVideo: false
});

// Tham gia cuộc gọi
await OmicallSDK.joinCall();

// Kết thúc cuộc gọi
await OmicallSDK.endCall();

// Lắng nghe sự kiện trạng thái cuộc gọi
OmicallSDK.addCallStateListener((callState) => {
  console.log('Call state changed:', callState);
});
```

## Lợi ích của phương pháp Delegate

- Không cần thay đổi cấu trúc kế thừa của Activity và Application
- Dễ dàng tích hợp vào ứng dụng đã có sẵn
- Không xung đột với các library khác
- Khách hàng vẫn có thể sử dụng các lớp base riêng của họ
- Tăng tính linh hoạt trong quá trình tích hợp
- Hỗ trợ nhiều phiên bản React Native khác nhau

## Yêu cầu hệ thống

- React Native >= 0.60.0
- Android SDK version >= 21
- iOS version >= 12.0 