const {withAndroidManifest} = require('expo/config-plugins')

module.exports = function withAndroidManifestPlugin(appConfig) {
  return withAndroidManifest(appConfig, function (decoratedAppConfig) {
    try {
      decoratedAppConfig.modResults.manifest.application[0].$[
        'android:largeHeap'
      ] = 'true'
      decoratedAppConfig.modResults.manifest['uses-permission'] =
        decoratedAppConfig.modResults.manifest['uses-permission'] || []
      /**
       * @see https://www.revenuecat.com/docs/getting-started/installation/reactnative#import-purchases
       */
      decoratedAppConfig.modResults.manifest['uses-permission'].push({
        $: {
          'android:name': 'com.android.vending.BILLING',
        },
      })
    } catch (e) {
      console.error(`withAndroidManifestPlugin failed`, e)
    }
    return decoratedAppConfig
  })
}
