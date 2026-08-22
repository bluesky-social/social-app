const {withAndroidManifest} = require('expo/config-plugins')

module.exports = function withAndroidManifestConfigChangesPlugin(appConfig) {
  return withAndroidManifest(appConfig, function (decoratedAppConfig) {
    try {
      const application =
        decoratedAppConfig.modResults.manifest.application?.[0]
      const activity = application?.activity?.find(
        a => a.$?.['android:name'] === '.MainActivity',
      )
      if (!activity) {
        console.warn(
          'withAndroidManifestConfigChangesPlugin: .MainActivity not found',
        )
        return decoratedAppConfig
      }
      const existing = activity.$['android:configChanges'] || ''
      const tokens = new Set(existing.split('|').filter(Boolean))
      tokens.add('smallestScreenSize')
      tokens.add('density')
      activity.$['android:configChanges'] = Array.from(tokens).join('|')
    } catch (e) {
      console.error(`withAndroidManifestConfigChangesPlugin failed`, e)
    }
    return decoratedAppConfig
  })
}
