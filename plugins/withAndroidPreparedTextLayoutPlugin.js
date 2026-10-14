const {withMainApplication} = require('expo/config-plugins')

const anchor = 'loadReactNative(this)'

const imports = [
  'import android.util.Log',
  'import com.facebook.react.common.ReleaseLevel',
  'import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint',
  'import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags',
  'import com.facebook.react.internal.featureflags.ReactNativeNewArchitectureFeatureFlagsDefaults',
]

/*
 * With prepared text layout, Fabric keeps the android.text.Layout it builds
 * while measuring text and PreparedLayoutTextView draws it as-is, instead of
 * ReactTextView (an AppCompatTextView) building a second layout on the UI
 * thread.
 *
 * The override must run after loadReactNative() installs the release-level
 * flags and before any ReactHost or Activity reads a flag. It replaces the
 * whole flag provider, so it is only applied on the STABLE release level, whose
 * provider is an empty subclass of ReactNativeNewArchitectureFeatureFlagsDefaults.
 */
const override = `
    if (DefaultNewArchitectureEntryPoint.releaseLevel == ReleaseLevel.STABLE) {
      val flagsReadEarly = ReactNativeFeatureFlags.dangerouslyForceOverride(
          object : ReactNativeNewArchitectureFeatureFlagsDefaults() {
            override fun enablePreparedTextLayout() = true
          })
      if (flagsReadEarly != null) {
        Log.w("MainApplication", "Feature flags read before override: $flagsReadEarly")
      }
    }`

module.exports = function withAndroidPreparedTextLayoutPlugin(config) {
  return withMainApplication(config, config => {
    let contents = config.modResults.contents
    if (config.modResults.language !== 'kt' || !contents.includes(anchor)) {
      throw Error(
        `Expected to find \`${anchor}\` in MainApplication.kt. ` +
          'You MUST verify where React Native is now loaded before the ' +
          'feature flag override can be re-applied.',
      )
    }
    if (contents.includes('enablePreparedTextLayout')) {
      return config
    }
    const missingImports = imports.filter(i => !contents.includes(i))
    if (missingImports.length) {
      contents = contents.replace(
        /^(package .*)$/m,
        `$1\n\n${missingImports.join('\n')}`,
      )
    }
    contents = contents.replace(anchor, `${anchor}${override}`)
    config.modResults.contents = contents
    return config
  })
}
