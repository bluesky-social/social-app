const fs = require('fs')
const path = require('path')
const {withProjectBuildGradle} = require('expo/config-plugins')

const rootProjectMarker = 'apply plugin: "expo-root-project"'

/*
 * react-native-pager-view 9 compiles against its own default Jetpack Compose
 * version (1.7.8) unless the root project defines `composeVersion`. @expo/ui
 * already forces a newer androidx.compose.foundation onto the whole app, so
 * Gradle would compile the pager against 1.7.8 and run it against the newer
 * artifact. Pin the pager to the version @expo/ui ships so that any removed
 * Compose API fails at build time instead of at runtime.
 */
function readExpoUiComposeVersion(projectRoot) {
  const gradlePath = path.join(
    projectRoot,
    'node_modules/@expo/ui/android/build.gradle',
  )
  const contents = fs.readFileSync(gradlePath, 'utf8')
  const match = contents.match(
    /androidx\.compose\.foundation:foundation-android:([0-9][^'"\s]*)/,
  )
  if (!match) {
    throw Error(
      'Expected to find the androidx.compose.foundation version in @expo/ui. ' +
        'Check whether @expo/ui changed how it declares Compose dependencies.',
    )
  }
  return match[1]
}

module.exports = function withAndroidComposeVersion(config) {
  return withProjectBuildGradle(config, config => {
    const composeVersion = readExpoUiComposeVersion(
      config.modRequest.projectRoot,
    )
    if (!config.modResults.contents.includes(rootProjectMarker)) {
      throw Error(
        'Expected to find the expo-root-project plugin in android/build.gradle. ' +
          'Check whether the Expo template changed.',
      )
    }
    config.modResults.contents = config.modResults.contents.replace(
      rootProjectMarker,
      `${rootProjectMarker}\n\n// Keep react-native-pager-view on the Compose version @expo/ui resolves.\next.composeVersion = "${composeVersion}"`,
    )
    return config
  })
}
