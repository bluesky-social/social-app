const {withEntitlementsPlist} = require('expo/config-plugins')

const withAppEntitlements = config => {
  return withEntitlementsPlist(config, async config => {
    config.modResults['com.apple.security.application-groups'] = [
      `group.community.blacksky.app`,
    ]
    config.modResults[
      'com.apple.developer.associated-appclip-app-identifiers'
    ] = [`$(AppIdentifierPrefix)${config.ios.bundleIdentifier}.AppClip`]
    return config
  })
}

module.exports = {withAppEntitlements}
