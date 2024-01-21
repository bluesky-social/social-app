import {ConfigPlugin, withEntitlementsPlist} from '@expo/config-plugins'

export const withAppEntitlements: ConfigPlugin = config => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  return withEntitlementsPlist(config, async config => {
    config.modResults['com.apple.security.application-groups'] = [
      `group.${config.ios!.bundleIdentifier}`,
    ]
    return config
  })
}
