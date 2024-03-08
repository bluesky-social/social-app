const {withAndroidManifest} = require('expo/config-plugins')

module.exports = function withAndroidManifestFCMIconPlugin(appConfig) {
  return withAndroidManifest(appConfig, function (decoratedAppConfig) {
    try {
      function addOrModifyMetaData(metaData, name, resource) {
        const elem = metaData.find(elem => elem.$['android:name'] === name)
        if (elem === undefined) {
          metaData.push({
            $: {
              'android:name': name,
              'android:resource': resource,
            },
          })
        } else {
          elem.$['android:resource'] = resource
        }
      }
      const androidManifest = decoratedAppConfig.modResults.manifest
      const metaData = androidManifest.application[0]['meta-data']
      addOrModifyMetaData(
        metaData,
        'com.google.firebase.messaging.default_notification_color',
        '@color/notification_icon_color',
      )
      addOrModifyMetaData(
        metaData,
        'com.google.firebase.messaging.default_notification_icon',
        '@drawable/notification_icon',
      )
      return decoratedAppConfig
    } catch (e) {
      console.error(`withAndroidManifestFCMIconPlugin failed`, e)
    }
    return decoratedAppConfig
  })
}
