Pod::Spec.new do |s|
  s.name           = 'ExpoBlueskyOAuthClient'
  s.version        = '0.0.1'
  s.summary        = 'A library of native functions to support Bluesky OAuth in React Native.'
  s.description    = 'A library of native functions to support Bluesky OAuth in React Native.'
  s.author         = ''
  s.homepage       = 'https://github.com/bluesky-social/social-app'
  s.platforms      = { :ios => '13.4', :tvos => '13.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'JOSESwift', '~> 2.3'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
