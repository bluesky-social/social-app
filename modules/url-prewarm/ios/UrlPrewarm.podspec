Pod::Spec.new do |s|
  s.name           = 'UrlPrewarm'
  s.version        = '1.0.0'
  s.summary        = 'Allows prewarming of URLs with SFSafariViewController'
  s.description    = 'Allows prewarming of URLs with SFSafariViewController'
  s.author         = ''
  s.homepage       = 'https://github.com/bluesky-social/social-app'
  s.platforms      = {
    :ios => '15.1',
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.frameworks = 'SafariServices'

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
