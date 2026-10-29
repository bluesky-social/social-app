/**
 * @file Give the system bar icons day/night-aware colors before JS runs.
 * `react-native-edge-to-edge`'s theme used to do this. Without it, the status
 * bar icons stay white on the light window until the first `StatusBar` update.
 * `isLightTheme` comes from AppCompat, which flips it for DayNight themes.
 */

const {withAndroidStyles, AndroidConfig} = require('expo/config-plugins')

module.exports = function withAndroidStylesSystemBarsPlugin(appConfig) {
  return withAndroidStyles(appConfig, function (decoratedAppConfig) {
    const parent = AndroidConfig.Styles.getAppThemeGroup()
    let styles = decoratedAppConfig.modResults
    styles = AndroidConfig.Styles.assignStylesValue(styles, {
      add: true,
      parent,
      name: 'android:windowLightStatusBar',
      value: '?attr/isLightTheme',
    })
    styles = AndroidConfig.Styles.assignStylesValue(styles, {
      add: true,
      parent,
      name: 'android:windowLightNavigationBar',
      value: '?attr/isLightTheme',
      targetApi: '27',
    })
    decoratedAppConfig.modResults = styles
    return decoratedAppConfig
  })
}
