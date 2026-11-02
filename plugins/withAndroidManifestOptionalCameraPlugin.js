const {withAndroidManifest} = require('expo/config-plugins')

/*
 * Requesting the CAMERA permission makes Google Play assume we require a
 * back-facing camera with autofocus, which hides the app from devices without
 * one (most Chromebooks only have a front webcam). The camera is optional, so
 * say so explicitly.
 */
const OPTIONAL_FEATURES = [
  'android.hardware.camera',
  'android.hardware.camera.autofocus',
]

module.exports = function withAndroidManifestOptionalCameraPlugin(appConfig) {
  return withAndroidManifest(appConfig, function (decoratedAppConfig) {
    const manifest = decoratedAppConfig.modResults.manifest
    manifest['uses-feature'] = manifest['uses-feature'] || []

    for (const name of OPTIONAL_FEATURES) {
      const existing = manifest['uses-feature'].find(
        feature => feature.$['android:name'] === name,
      )
      if (existing) {
        existing.$['android:required'] = 'false'
      } else {
        manifest['uses-feature'].push({
          $: {'android:name': name, 'android:required': 'false'},
        })
      }
    }

    return decoratedAppConfig
  })
}
