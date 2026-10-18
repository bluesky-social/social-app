const {withPodfile, CodeGenerator} = require('expo/config-plugins')

/**
 * Compiles every pod at -O2 instead of Xcode's default -Os in non-debug
 * configurations.
 *
 * Nothing in the iOS toolchain sets an optimization level for pods
 * (Yoga.podspec, RN's CocoaPods scripts and Expo all leave
 * GCC_OPTIMIZATION_LEVEL alone), so Release falls back to Xcode's -Os.
 * Android already builds React Native's C++ with -O2 (and Yoga with thin LTO,
 * see ReactCommon/yoga/CMakeLists.txt). On the simulator, Yoga's own layout
 * time drops by roughly 7-15% at -O2, and the binary gets smaller.
 *
 * GCC_OPTIMIZATION_LEVEL only affects C, C++ and Objective-C; Swift is
 * unaffected. Debug configurations are left at -O0.
 *
 * Replace with expo-build-properties' `ios.gccOptimizationLevel` once it ships
 * (https://github.com/expo/expo/pull/51770).
 */
module.exports = function withIosCppOptimization(config) {
  return withPodfile(config, config => {
    const result = CodeGenerator.mergeContents({
      src: config.modResults.contents,
      anchor: /post_install do \|installer\|/,
      offset: 1,
      tag: 'bsky-ios-cpp-optimization',
      comment: '#',
      newSrc: `
    # compile all pods at -O2 instead of Xcode's default -Os outside debug
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        next if build_config.type == :debug
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
