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
  # Keep the vendored xcframework headers out of source_files/public_header_files.
  # Do not exclude the whole dir: exclude_files also applies to vendored_frameworks.
  s.exclude_files = "ios/Frameworks/**/*.{h,m,mm,swift}"

  # Swift support
  s.swift_versions = ["5.0"]

  # Module configuration for Swift bridging
  s.static_framework = true
  s.module_name = "OmikitPlugin"
  s.requires_arc = true

  # OmiKit binary dependency. Since 1.11.23 the xcframework ships an
  # ios-arm64-simulator slice, so arm64 simulator builds link natively on
  # Apple Silicon — no need to exclude arm64 for the simulator anymore.
  # (Excluding it forced x86_64/Rosetta and dropped our Swift .o files from the
  #  simulator binary, which broke the Expo lifecycle subscriber's +load.)
  #
  # OmiKit is vendored (no CocoaPods Trunk dependency; Trunk goes read-only 2026-12-02).
  # Vendored version: 1.12.3. Update with: scripts/update-omikit.sh <version>
  #
  # Swift Package Manager instead of the vendored copy: set `$OmikitUseSPM = true`
  # in the Podfile (or OMIKIT_USE_SPM=1) before `use_native_modules!`. Needs RN 0.75+
  # (`spm_dependency`). Keep the SPM minimum version in sync with the vendored one.
  omikit_spm = ($OmikitUseSPM == true || ENV["OMIKIT_USE_SPM"] == "1")
  omikit_spm_url = "https://github.com/VIHATTeam/OmiKit.git"
  # upToNextMinor: take 1.12.x fixes, never 1.13 automatically
  omikit_spm_requirement = { kind: "upToNextMinorVersion", minimumVersion: "1.12.3" }

  # spm_dependency links OmiKit into this (static) pod only. OmiKit is a dynamic framework and
  # Xcode embeds package frameworks only into targets that link them, so without the app target
  # linking it too the app dies at launch ("dyld: Library not loaded: @rpath/OmiKit.framework").
  # Hook RN's SPM post-install step to add the package to the app targets (and remove it again
  # when SPM is switched off, otherwise OmiKit would be embedded twice).
  if respond_to?(:spm_dependency, true) && defined?(SPM)
    $omikit_spm_link_app = omikit_spm
    unless $omikit_spm_hooked
      $omikit_spm_hooked = true
      SPM.singleton_class.prepend(Module.new do
        define_method(:apply_on_post_install) do |installer|
          super(installer)
          pkg_class = Xcodeproj::Project::Object::XCRemoteSwiftPackageReference
          ref_class = Xcodeproj::Project::Object::XCSwiftPackageProductDependency
          installer.aggregate_targets.group_by(&:user_project).each do |project, aggregates|
            next if project.nil?
            pkg = project.root_object.package_references.find { |p| p.class == pkg_class && p.repositoryURL == omikit_spm_url }
            app_targets = aggregates.flat_map(&:user_targets).uniq.select { |t| t.symbol_type == :application }
            if $omikit_spm_link_app
              unless pkg
                pkg = project.new(pkg_class)
                pkg.repositoryURL = omikit_spm_url
                project.root_object.package_references << pkg
              end
              pkg.requirement = omikit_spm_requirement.transform_keys(&:to_s)
              app_targets.each do |target|
                next if target.package_product_dependencies.any? { |r| r.package == pkg && r.product_name == "OmiKit" }
                ref = project.new(ref_class)
                ref.package = pkg
                ref.product_name = "OmiKit"
                target.package_product_dependencies << ref
                build_file = project.new(Xcodeproj::Project::Object::PBXBuildFile)
                build_file.product_ref = ref
                target.frameworks_build_phase.files << build_file
              end
              Pod::UI.puts "[omikit-plugin] Linked OmiKit (Swift Package) into #{app_targets.map(&:name).join(', ')}"
            elsif pkg
              project.targets.each do |target|
                refs = target.package_product_dependencies.select { |r| r.package == pkg }
                target.frameworks_build_phase.files.select { |f| refs.include?(f.product_ref) }.each(&:remove_from_project)
                refs.each(&:remove_from_project)
              end
              pkg.remove_from_project
              Pod::UI.puts "[omikit-plugin] Removed the OmiKit Swift Package from the app (using the vendored OmiKit.xcframework)"
            else
              next
            end
            project.save
          end
        end
      end)
    end
  end

  if omikit_spm && respond_to?(:spm_dependency, true)
    spm_dependency(s,
      url: omikit_spm_url,
      requirement: omikit_spm_requirement,
      products: ["OmiKit"]
    )
  else
    if omikit_spm
      Pod::UI.warn "omikit-plugin: OmiKit via Swift Package Manager needs React Native 0.75+; using the vendored OmiKit.xcframework."
    end
    s.vendored_frameworks = "ios/Frameworks/OmiKit.xcframework"
    s.preserve_paths = "ios/Frameworks/OmiKit.xcframework"
  end
  s.libraries = "stdc++"
  s.frameworks = "CoreFoundation", "VideoToolbox", "AudioToolbox", "AVFoundation", "GLKit", "CFNetwork", "CoreMedia"
  # SWIFT_STRICT_CONCURRENCY/warning flags carried over from OmiKit.podspec
  # (prevents dispatch_assert_queue_fail crashes under Swift 6).
  s.user_target_xcconfig = {
    "EXCLUDED_ARCHS[sdk=iphonesimulator*]" => "x86_64",
    "GCC_WARN_ABOUT_MISSING_PROTOTYPES" => "NO",
    "CLANG_WARN_STRICT_PROTOTYPES" => "NO",
    "SWIFT_STRICT_CONCURRENCY" => "minimal"
  }

  # Base xcconfig applied regardless of architecture
  base_xcconfig = {
    "DEFINES_MODULE" => "YES",
    "OTHER_LDFLAGS" => "-ObjC",
    "EXCLUDED_ARCHS[sdk=iphonesimulator*]" => "x86_64",
    "SWIFT_STRICT_CONCURRENCY" => "minimal"
  }

  # Use install_modules_dependencies (RN 0.71+) for proper New Architecture support.
  # Falls back to manual setup for older React Native versions.
  if respond_to?(:install_modules_dependencies, true)
    install_modules_dependencies(s)
    # install_modules_dependencies sets pod_target_xcconfig internally.
    # Re-assign with base_xcconfig merged — pod_target_xcconfig= accumulates,
    # so calling it again applies DEFINES_MODULE without losing New Arch settings.
    s.pod_target_xcconfig = base_xcconfig
  else
    # Fallback: manual New Architecture / Old Architecture setup for RN < 0.71
    s.dependency "React-Core"

    if ENV['RCT_NEW_ARCH_ENABLED'] == '1'
      s.compiler_flags = folly_compiler_flags + " -DRCT_NEW_ARCH_ENABLED=1"

      new_arch_xcconfig = base_xcconfig.merge({
        "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\"",
        "OTHER_CPLUSPLUSFLAGS" => folly_compiler_flags,
        "CLANG_CXX_LANGUAGE_STANDARD" => "c++20"
      })

      s.xcconfig = new_arch_xcconfig
      s.pod_target_xcconfig = new_arch_xcconfig

      s.dependency "React-Codegen"
      s.dependency "RCT-Folly"
      s.dependency "RCTRequired"
      s.dependency "RCTTypeSafety"
      s.dependency "ReactCommon/turbomodule/core"
    else
      s.pod_target_xcconfig = base_xcconfig
    end
  end
end