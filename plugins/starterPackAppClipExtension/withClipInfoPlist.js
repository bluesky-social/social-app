/* eslint-disable import/no-nodejs-modules -- Expo config plugins run in Node. */
const {withInfoPlist} = require('expo/config-plugins')
const plist = require('@expo/plist')
const path = require('path')
const fs = require('fs')

const withClipInfoPlist = (config, {targetName}) => {
  return withInfoPlist(config, config => {
    const targetPath = path.join(
      config.modRequest.platformProjectRoot,
      targetName,
      'Info.plist',
    )

    const newPlist = plist.default.build({
      NSAppClip: {
        NSAppClipRequestEphemeralUserNotification: false,
        NSAppClipRequestLocationConfirmation: false,
      },
      UILaunchScreen: {},
      CFBundleName: '$(PRODUCT_NAME)',
      CFBundleIdentifier: '$(PRODUCT_BUNDLE_IDENTIFIER)',
      CFBundleVersion: '$(CURRENT_PROJECT_VERSION)',
      CFBundleExecutable: '$(EXECUTABLE_NAME)',
      CFBundlePackageType: '$(PRODUCT_BUNDLE_PACKAGE_TYPE)',
      CFBundleShortVersionString: config.version,
      CFBundleIconName: 'AppIcon',
      UIViewControllerBasedStatusBarAppearance: 'NO',
      // Match the parent's resolved orientation and multitasking settings.
      UISupportedInterfaceOrientations:
        config.modResults.UISupportedInterfaceOrientations,
      'UISupportedInterfaceOrientations~ipad':
        config.modResults['UISupportedInterfaceOrientations~ipad'],
      UIRequiresFullScreen: config.modResults.UIRequiresFullScreen,
    })

    fs.mkdirSync(path.dirname(targetPath), {recursive: true})
    fs.writeFileSync(targetPath, newPlist)

    return config
  })
}

module.exports = {withClipInfoPlist}
