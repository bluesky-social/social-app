Pod::Spec.new do |s|
  s.name           = 'ExpoBlueskyVideoCompress'
  s.version        = '1.0.0'
  s.summary        = 'Hardware-accelerated video compression for Bluesky'
  s.description    = 'Hardware-accelerated video compression using AVAssetReader/Writer on iOS'
  s.author         = ''
  s.homepage       = 'https://github.com/bluesky-social/social-app'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
