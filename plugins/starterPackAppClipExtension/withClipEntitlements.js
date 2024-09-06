const {withInfoPlist} = require('@expo/config-plugins')
const plist = require('@expo/plist')
const path = require('path')
const fs = require('fs')

const withClipEntitlements = (config, {targetName}) => {
  // eslint-disable-next-line no-shadow
  return withInfoPlist(config, config => {
    const entitlementsPath = path.join(
      config.modRequest.platformProjectRoot,
      targetName,
      `${targetName}.entitlements`,
    )

    const appClipEntitlements = {
      'com.apple.security.application-groups': [`group.app.bsky`],
      'com.apple.developer.parent-application-identifiers': [
        `$(AppIdentifierPrefix)${config.ios.bundleIdentifier}`,
      ],
      'com.apple.developer.associated-domains': config.ios.associatedDomains,
    }

    fs.mkdirSync(path.dirname(entitlementsPath), {
      recursive: true,
    })
    fs.writeFileSync(entitlementsPath, plist.default.build(appClipEntitlements))

    return config
  })
}

module.exports = {withClipEntitlements}
