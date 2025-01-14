require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "omikit-plugin"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "11.0" }
  s.source       = { :git => "https://github.com/VIHATTeam/OMICALL-React-Native-SDK.git", :tag => "#{s.version}" }

  # Chỉ định source files
  s.source_files = "ios/**/*.{h,m,mm,swift}"


  # Đảm bảo hỗ trợ Swift
  s.swift_versions = ["5.0"]

  # Định nghĩa module để tránh lỗi Swift bridging header
  s.static_framework = true
  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES"
  }

  # Xác định module name
  s.module_name = "OmikitPlugin"

  # Thêm dependency bắt buộc
  s.dependency "React-Core"
  s.dependency "OmiKit", "1.8.1"

  # Đảm bảo Swift bridging header được tự động tạo
  # s.requires_arc = true

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