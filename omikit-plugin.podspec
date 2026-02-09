require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))
folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'

Pod::Spec.new do |s|
  s.name         = "omikit-plugin"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "13.0" }
  s.source       = { :git => "https://github.com/VIHATTeam/OMICALL-React-Native-SDK.git", :tag => "#{s.version}" }

  # Chỉ định source files
  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.public_header_files = "ios/**/*.h"

  # Đảm bảo hỗ trợ Swift
  s.swift_versions = ["5.0"]

  # Định nghĩa module để tránh lỗi Swift bridging header
  s.static_framework = true
  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES",
    "SWIFT_OPTIMIZATION_LEVEL" => "-Onone",
    "EXCLUDED_ARCHS[sdk=iphonesimulator*]" => "arm64"
  }

  # Xác định module name
  s.module_name = "OmikitPlugin"

  # Thêm dependency bắt buộc
  s.dependency "React-Core"
 
  s.dependency "OmiKit", "1.10.11"


  s.requires_arc = true

  # Xử lý riêng cho kiến trúc mới (New Architecture)
  if ENV['RCT_NEW_ARCH_ENABLED'] == '1'
    s.compiler_flags = folly_compiler_flags + " -DRCT_NEW_ARCH_ENABLED=1"
    s.xcconfig = {
      "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\"",
      "OTHER_CPLUSPLUSFLAGS" => folly_compiler_flags,
      "CLANG_CXX_LANGUAGE_STANDARD" => "c++17"
    }
    s.pod_target_xcconfig = {
      "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\"",
      "OTHER_CPLUSPLUSFLAGS" => folly_compiler_flags,
      "CLANG_CXX_LANGUAGE_STANDARD" => "c++17"
    }
    s.dependency "React-Codegen"
    s.dependency "RCT-Folly"
    s.dependency "RCTRequired"
    s.dependency "RCTTypeSafety"
    s.dependency "ReactCommon/turbomodule/core"
  end
end