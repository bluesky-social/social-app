/**
 * @file Set accent color to primaryColor from app.config.ts.
 * This way we get a sane default color for spinners, text inputs, etc.
 */

const {withAndroidStyles, AndroidConfig} = require('@expo/config-plugins')

module.exports = function withAndroidStylesAccentColorPlugin(appConfig) {
  return withAndroidStyles(appConfig, function (decoratedAppConfig) {
    try {
      decoratedAppConfig.modResults = AndroidConfig.Styles.assignStylesValue(
        decoratedAppConfig.modResults,
        {
          add: true,
          parent: AndroidConfig.Styles.getAppThemeLightNoActionBarGroup(),
          name: 'colorAccent',
          value: '@color/colorPrimary',
        },
      )
    } catch (e) {
      console.error(`withAndroidStylesAccentColorPlugin failed`, e)
    }
    return decoratedAppConfig
  })
}
