const {withAndroidManifest} = require('@expo/config-plugins')

const MAIN_ACTIVITY_NAME = '.MainActivity'
const CONFIG_CHANGES_KEY = 'android:configChanges'
const REQUIRED_CONFIG_CHANGE = 'smallestScreenSize'

function getMainActivity(manifest) {
  const activities = manifest?.application?.[0]?.activity
  if (!Array.isArray(activities)) {
    return null
  }

  return (
    activities.find(
      activity => activity?.$?.['android:name'] === MAIN_ACTIVITY_NAME,
    ) ??
    activities.find(activity => {
      const name = activity?.$?.['android:name']
      return typeof name === 'string' && name.endsWith('MainActivity')
    }) ??
    null
  )
}

function normalizeConfigChanges(configChanges) {
  if (typeof configChanges !== 'string') {
    return []
  }

  const values = configChanges
    .split('|')
    .map(value => value.trim())
    .filter(Boolean)

  const seen = new Set()
  return values.filter(value => {
    if (seen.has(value)) {
      return false
    }
    seen.add(value)
    return true
  })
}

module.exports = function withAndroidManifestMainActivityConfigChangesPlugin(
  appConfig,
) {
  return withAndroidManifest(appConfig, function (decoratedAppConfig) {
    try {
      const androidManifest = decoratedAppConfig.modResults.manifest
      const mainActivity = getMainActivity(androidManifest)

      if (!mainActivity || !mainActivity.$) {
        console.warn(
          'withAndroidManifestMainActivityConfigChangesPlugin: Unable to find MainActivity',
        )
        return decoratedAppConfig
      }

      const configChanges = normalizeConfigChanges(
        mainActivity.$[CONFIG_CHANGES_KEY],
      )

      if (!configChanges.includes(REQUIRED_CONFIG_CHANGE)) {
        configChanges.push(REQUIRED_CONFIG_CHANGE)
      }

      mainActivity.$[CONFIG_CHANGES_KEY] = configChanges.join('|')
    } catch (e) {
      console.error(
        'withAndroidManifestMainActivityConfigChangesPlugin failed',
        e,
      )
    }

    return decoratedAppConfig
  })
}
