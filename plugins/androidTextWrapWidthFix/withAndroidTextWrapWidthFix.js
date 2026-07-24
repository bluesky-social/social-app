/**
 * @file Fix Android silently dropping the last line of wrapped text (#5235).
 *
 * Copies WrapWidthTextFix.kt into the generated Android project and registers
 * WrapWidthTextPackage in MainApplication, whose "RCTText" view manager
 * replaces the stock one with a TextView that wraps at a slightly wider
 * width, covering the measurement/render rounding window that causes the
 * truncation. See WrapWidthTextFix.kt for the full mechanism.
 */

// eslint-disable-next-line import-x/no-nodejs-modules
const {promises: fs} = require('fs')
// eslint-disable-next-line import-x/no-nodejs-modules
const path = require('path')
const {withDangerousMod, withMainApplication} = require('expo/config-plugins')

const SOURCE_FILE = 'WrapWidthTextFix.kt'
const PACKAGE_PATH = 'xyz/blueskyweb/app/textwrapfix'
const REGISTRATION =
  'add(xyz.blueskyweb.app.textwrapfix.WrapWidthTextPackage())'
const PACKAGES_ANCHOR = 'PackageList(this).packages.apply {'

module.exports = function withAndroidTextWrapWidthFix(appConfig) {
  appConfig = withDangerousMod(appConfig, [
    'android',
    async function copyNativeSource(config) {
      const destDir = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/java',
        PACKAGE_PATH,
      )
      await fs.mkdir(destDir, {recursive: true})
      await fs.copyFile(
        path.join(__dirname, SOURCE_FILE),
        path.join(destDir, SOURCE_FILE),
      )
      return config
    },
  ])
  return withMainApplication(appConfig, function registerPackage(config) {
    const {contents} = config.modResults
    if (!contents.includes(REGISTRATION)) {
      if (!contents.includes(PACKAGES_ANCHOR)) {
        throw new Error(
          `withAndroidTextWrapWidthFix: could not find "${PACKAGES_ANCHOR}" in MainApplication`,
        )
      }
      config.modResults.contents = contents.replace(
        PACKAGES_ANCHOR,
        `${PACKAGES_ANCHOR}\n              ${REGISTRATION}`,
      )
    }
    return config
  })
}
