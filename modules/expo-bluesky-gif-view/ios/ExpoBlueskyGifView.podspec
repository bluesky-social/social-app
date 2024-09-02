Pod::Spec.new do |s|
  s.name           = 'ExpoBlueskyGifView'
  s.version        = '1.0.0'
  s.summary        = 'A simple GIF player for Bluesky'
  s.description    = 'A simple GIF player for Bluesky'
  s.author         = ''
  s.homepage       = 'https://github.com/bluesky-social/social-app'
  s.platforms      = { :ios => '13.4', :tvos => '13.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'SDWebImage', '~> 5.19.1'
  s.dependency 'SDWebImageWebPCoder', '~> 0.14.6'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
