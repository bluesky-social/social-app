const {withInfoPlist} = require('@expo/config-plugins')
const plist = require('@expo/plist')
const path = require('path')
const fs = require('fs')

const withExtensionEntitlements = (config, {extensionName}) => {
  // eslint-disable-next-line no-shadow
  return withInfoPlist(config, config => {
    const extensionEntitlementsPath = path.join(
      config.modRequest.platformProjectRoot,
      extensionName,
      `${extensionName}.entitlements`,
    )

    const notificationsExtensionEntitlements = {
      'com.apple.security.application-groups': [`group.app.bsky`],
    }

    fs.mkdirSync(path.dirname(extensionEntitlementsPath), {
      recursive: true,
    })
    fs.writeFileSync(
      extensionEntitlementsPath,
      plist.default.build(notificationsExtensionEntitlements),
    )

    return config
  })
}

module.exports = {withExtensionEntitlements}
