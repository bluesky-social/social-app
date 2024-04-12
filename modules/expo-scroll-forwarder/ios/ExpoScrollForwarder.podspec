Pod::Spec.new do |s|
  s.name           = 'ExpoScrollForwarder'
  s.version        = '1.0.0'
  s.summary        = 'Forward scroll gesture from UIView to UIScrollView'
  s.description    = 'Forward scroll gesture from UIView to UIScrollView'
  s.author         = 'bluesky-social'
  s.homepage       = 'https://github.com/bluesky-social/social-app'
  s.platforms      = { :ios => '13.4', :tvos => '13.4' }
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
