Pod::Spec.new do |s|
  s.name           = 'ExpoSelectableText'
  s.version        = '1.0.0'
  s.summary        = 'Simple wrapper for RN Text to use UITextView instead of UILabel'
  s.description    = 'Simple wrapper for RN Text to use UITextView instead of UILabel'
  s.author         = ''
  s.homepage       = 'https://github.com/bluesky-social/social-app/modules/expo-selectable-text'
  s.platform       = :ios, '13.0'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
