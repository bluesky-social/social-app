/**
 * @file Give the system bar icons day/night-aware colors before JS runs.
 * Without these, the status bar icons stay white on the light window until the
 * first `StatusBar` update. `isLightTheme` comes from AppCompat, which flips it
 * for DayNight themes. Must be registered before `expo-navigation-bar`, which
 * removes `android:windowLightNavigationBar` when no `style` is set.
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
