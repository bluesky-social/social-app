const {withPodfile, CodeGenerator} = require('expo/config-plugins')

/**
 * Compiles React Native's C++ pods at -O2 instead of Xcode's default -Os in
 * the Release configuration.
 *
 * Nothing in the iOS toolchain sets an optimization level for these pods
 * (Yoga.podspec, RN's CocoaPods scripts and Expo all leave
 * GCC_OPTIMIZATION_LEVEL alone), so Release falls back to Xcode's -Os.
 * Android already builds the same code with -O2 + thin LTO
 * (ReactCommon/yoga/CMakeLists.txt). On replayed app trees Yoga runs ~1.3x
 * faster at -O2 than at -Os (~1.4x with LTO); in the app the end-to-end
 * effect is smaller, since much of the time inside layout is text
 * measurement and React Native callbacks.
 *
 * BSKY_IOS_CPP_OPT, read at prebuild time, picks the pods:
 * - yoga (default): only the Yoga pod (+~11 KB binary)
 * - none: leave everything at -Os
 * - all: Yoga plus the C++ pods built from React Native's source (Fabric,
 *   renderer, JSI, cxxreact, ...) and their C++ dependencies (Folly, fmt,
 *   glog, double-conversion). Hermes ships as a prebuilt binary and is not
 *   affected.
 */

const MODES = ['none', 'yoga', 'all']

/*
 * Pod target names, matched exactly or (when ending in `*`) by prefix.
 * These are the React Native pods with C++ sources; the pure Objective-C
 * React-Core / React-RCT* module pods are left alone.
 */
const YOGA_TARGETS = ['Yoga']
const ALL_TARGETS = [
  ...YOGA_TARGETS,
  'React-Fabric*',
  'React-RCTFabric',
  'React-graphics',
  'React-rendererdebug',
  'React-rendererconsistency',
  'React-renderercss',
  'React-utils',
  'React-featureflags*',
  'React-debug',
  'React-Mapbuffer',
  'React-ImageManager',
  'React-runtimescheduler',
  'React-runtimeexecutor',
  'React-RuntimeCore',
  'React-RuntimeApple',
  'React-RuntimeHermes',
  'React-performancetimeline',
  'React-timing',
  'React-jsi*',
  'React-cxxreact',
  'React-hermes',
  'React-NativeModulesApple',
  'React-domnativemodule',
  'React-defaultsnativemodule',
  'React-idlecallbacksnativemodule',
  'React-microtasksnativemodule',
  'React-featureflagsnativemodule',
  'React-webperformancenativemodule',
  'React-mutationobservernativemodule',
  'React-viewtransitionnativemodule',
  'React-networking',
  'React-performancecdpmetrics',
  'React-intersectionobservernativemodule',
  'React-jserrorhandler',
  'React-logger',
  'React-oscompat',
  'React-perflogger',
  'ReactCommon',
  'ReactCodegen',
  // Third-party C++ dependencies, built from source with RN
  'RCT-Folly',
  'DoubleConversion',
  'fmt',
  'glog',
]

module.exports = function withIosCppOptimization(config) {
  const mode = process.env.BSKY_IOS_CPP_OPT || 'yoga'
  if (!MODES.includes(mode)) {
    throw new Error(
      `BSKY_IOS_CPP_OPT must be one of ${MODES.join(', ')}, got "${mode}"`,
    )
  }
  if (mode === 'none') {
    return config
  }
  const targets = mode === 'yoga' ? YOGA_TARGETS : ALL_TARGETS

  return withPodfile(config, config => {
    const result = CodeGenerator.mergeContents({
      src: config.modResults.contents,
      anchor: /post_install do \|installer\|/,
      offset: 1,
      tag: 'bsky-ios-cpp-optimization',
      comment: '#',
      newSrc: `
    # BSKY_IOS_CPP_OPT=${mode}: compile these pods at -O2 in Release
    bsky_cpp_opt_patterns = ${JSON.stringify(targets)}
    installer.pods_project.targets.each do |target|
      next unless bsky_cpp_opt_patterns.any? do |pattern|
        pattern.end_with?('*') ? target.name.start_with?(pattern.chomp('*')) : target.name == pattern
      end
      target.build_configurations.each do |build_config|
        next unless build_config.name == 'Release'
        build_config.build_settings['GCC_OPTIMIZATION_LEVEL'] = '2'
      end
    end
`,
    })
    if (
      !result.contents.includes('@generated begin bsky-ios-cpp-optimization')
    ) {
      throw new Error(
        'withIosCppOptimization: could not find `post_install do |installer|` in the Podfile',
      )
    }
    config.modResults.contents = result.contents
    return config
  })
}
