const {withAndroidManifest} = require('expo/config-plugins')

module.exports = function withAndroidManifestLaunchModePlugin(appConfig) {
  return withAndroidManifest(appConfig, function (decoratedAppConfig) {
    try {
      const mainApplication =
        decoratedAppConfig.modResults.manifest.application[0]
      const mainActivity = mainApplication.activity.find(
        elem => elem.$['android:name'] === '.MainActivity',
      )
      mainActivity.$['android:launchMode'] = 'singleTop'
    } catch (e) {
      console.error(`withAndroidManifestLaunchModePlugin failed`, e)
    }
    return decoratedAppConfig
  })
}
