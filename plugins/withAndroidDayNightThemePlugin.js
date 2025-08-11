// Based on https://github.com/expo/expo/pull/33957
// Could be removed once the app has been updated to Expo 53
const {withAndroidStyles} = require('@expo/config-plugins')

module.exports = function withAndroidDayNightThemePlugin(appConfig) {
  const cleanupList = new Set([
    'colorPrimary',
    'android:editTextBackground',
    'android:textColor',
    'android:editTextStyle',
  ])

  return withAndroidStyles(appConfig, config => {
    config.modResults.resources.style = config.modResults.resources.style
      ?.map(style => {
        if (style.$.name === 'AppTheme' && style.item != null) {
          style.item = style.item.filter(item => !cleanupList.has(item.$.name))
        }
        return style
      })
      .filter(style => {
        return style.$.name !== 'ResetEditText'
      })

    return config
  })
}
