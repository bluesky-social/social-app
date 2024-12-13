Pod::Spec.new do |s|
  s.name           = 'BottomSheet'
  s.version        = '1.0.0'
  s.summary        = 'A bottom sheet for use in Bluesky'
  s.description    = 'A bottom sheet for use in Bluesky'
  s.author         = ''
  s.homepage       = 'https://github.com/bluesky-social/social-app'
  s.platforms      = { :ios => '15.0', :tvos => '15.0' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  new_arch_enabled = ENV['RCT_NEW_ARCH_ENABLED'] == '1'
  new_arch_compiler_flags = '-DRCT_NEW_ARCH_ENABLED'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
    'OTHER_SWIFT_FLAGS' => "$(inherited) #{new_arch_enabled ? new_arch_compiler_flags : ''}",
  }

  s.source_files = "**/*.{h,m,swift}"
end
