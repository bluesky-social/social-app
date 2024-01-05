const {withAndroidManifest, withAppBuildGradle} = require('expo/config-plugins')

module.exports = function withAndroidManifestPlugin(appConfig) {
  appConfig = withAndroidManifest(appConfig, function (decoratedAppConfig) {
    try {
      decoratedAppConfig.modResults.manifest.application[0].$[
        'android:largeHeap'
      ] = 'true'
    } catch (e) {
      console.error(`withAndroidManifestPlugin failed`, e)
    }
    return decoratedAppConfig
  })

  appConfig = withAppBuildGradle(appConfig, function (decoratedAppConfig) {
    // HACK
    // Workaround for https://github.com/facebook/react-native/issues/42024
    // Remove when React Native resolves this issue
    // -prf
    const MATCH_STRING = 'defaultConfig {\n'
    const str = decoratedAppConfig.modResults.contents
    const index = str.indexOf(MATCH_STRING) + MATCH_STRING.length
    decoratedAppConfig.modResults.contents = `${str.slice(
      0,
      index,
    )}\nresConfigs "en", "hi", "ja", "fr", "ko", "pt", "uk"\n${str.slice(
      index,
    )}`
    return decoratedAppConfig
  })

  return appConfig
}
