Pod::Spec.new do |s|
  s.name           = 'ExpoKeyboardLanguage'
  s.version        = '1.0.0'
  s.summary        = 'Expo module to detect the current keyboard language'
  s.description    = 'Expo module to detect the current keyboard language'
  s.author         = ''
  s.homepage       = 'https://github.com/bluesky-social/social-app'
  s.platforms      = { :ios => '13.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
