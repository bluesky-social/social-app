const {withInfoPlist} = require('@expo/config-plugins')
const plist = require('@expo/plist')
const path = require('path')
const fs = require('fs')

const withClipInfoPlist = (config, {targetName}) => {
  // eslint-disable-next-line no-shadow
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
      UISupportedInterfaceOrientations: [
        'UIInterfaceOrientationPortrait',
        'UIInterfaceOrientationPortraitUpsideDown',
      ],
      'UISupportedInterfaceOrientations~ipad': [
        'UIInterfaceOrientationPortrait',
        'UIInterfaceOrientationPortraitUpsideDown',
      ],
    })

    fs.mkdirSync(path.dirname(targetPath), {recursive: true})
    fs.writeFileSync(targetPath, newPlist)

    return config
  })
}

module.exports = {withClipInfoPlist}
