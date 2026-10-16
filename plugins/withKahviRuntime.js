const {
  withAppDelegate,
  withPodfile,
  withPodfileProperties,
} = require('expo/config-plugins')

const IMPORT = 'import ReactKahvi'
const DELEGATE = 'class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {'
const FACTORY_METHOD = `  override func createJSRuntimeFactory() -> JSRuntimeFactoryRef {
    return jsrt_create_kahvi_factory()
  }`
const KAHVI_PODFILE_HEADER = [
  '# Kahvi replaces Hermes for the app runtime.',
  "ENV['USE_HERMES'] = '0'",
  "ENV['USE_KAHVI'] = '1'",
  '',
].join('\n')

module.exports = config => {
  config = withPodfile(config, config => {
    const contents = config.modResults.contents
    if (!contents.includes("ENV['USE_KAHVI'] = '1'")) {
      config.modResults.contents = `${KAHVI_PODFILE_HEADER}${contents}`
    }
    return config
  })

  config = withPodfileProperties(config, config => {
    config.modResults['expo.jsEngine'] = 'jsc'
    return config
  })

  return withAppDelegate(config, config => {
    let contents = config.modResults.contents

    if (!contents.includes(IMPORT)) {
      const reactImport = 'import React\n'
      if (!contents.includes(reactImport)) {
        throw new Error(
          'withKahviRuntime: expected an import React in AppDelegate.swift',
        )
      }
      contents = contents.replace(reactImport, `${reactImport}${IMPORT}\n`)
    }

    if (!contents.includes('override func createJSRuntimeFactory()')) {
      if (!contents.includes(DELEGATE)) {
        throw new Error(
          'withKahviRuntime: expected ReactNativeDelegate in AppDelegate.swift',
        )
      }
      contents = contents.replace(DELEGATE, `${DELEGATE}\n${FACTORY_METHOD}`)
    }

    config.modResults.contents = contents
    return config
  })
}
