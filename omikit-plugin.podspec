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

  # Source files configuration
  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.public_header_files = "ios/**/*.h"

  # Swift support
  s.swift_versions = ["5.0"]

  # Module configuration for Swift bridging
  s.static_framework = true
  s.module_name = "OmikitPlugin"
  s.requires_arc = true

  # Dependencies
  s.dependency "React-Core"
  s.dependency "OmiKit", "~> 1.10"

  # Base build settings (for both Old and New Architecture)
  base_xcconfig = {
    "DEFINES_MODULE" => "YES",
    "SWIFT_OPTIMIZATION_LEVEL" => "-Onone",
    # Note: arm64 simulator excluded due to OmiKit binary compatibility
    "EXCLUDED_ARCHS[sdk=iphonesimulator*]" => "arm64"
  }

  # New Architecture (TurboModule/Fabric) support
  if ENV['RCT_NEW_ARCH_ENABLED'] == '1'
    s.compiler_flags = folly_compiler_flags + " -DRCT_NEW_ARCH_ENABLED=1"

    # Merge base config with New Architecture config
    new_arch_xcconfig = base_xcconfig.merge({
      "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\"",
      "OTHER_CPLUSPLUSFLAGS" => folly_compiler_flags,
      "CLANG_CXX_LANGUAGE_STANDARD" => "c++20"
    })

    s.xcconfig = new_arch_xcconfig
    s.pod_target_xcconfig = new_arch_xcconfig

    # New Architecture dependencies
    s.dependency "React-Codegen"
    s.dependency "RCT-Folly"
    s.dependency "RCTRequired"
    s.dependency "RCTTypeSafety"
    s.dependency "ReactCommon/turbomodule/core"
  else
    # Old Architecture - use base config only
    s.pod_target_xcconfig = base_xcconfig
  end
end