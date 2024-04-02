const {withStringsXml, AndroidConfig} = require('@expo/config-plugins')

module.exports = function withAndroidSplashScreenStatusBarTranslucentPlugin(
  appConfig,
) {
  return withStringsXml(appConfig, function (decoratedAppConfig) {
    try {
      decoratedAppConfig.modResults = AndroidConfig.Strings.setStringItem(
        [
          {
            _: 'true',
            $: {
              name: 'expo_splash_screen_status_bar_translucent',
              translatable: 'false',
            },
          },
        ],
        decoratedAppConfig.modResults,
      )
    } catch (e) {
      console.error(
        `withAndroidSplashScreenStatusBarTranslucentPlugin failed`,
        e,
      )
    }
    return decoratedAppConfig
  })
}
