import {ConfigPlugin, withInfoPlist} from '@expo/config-plugins'
import plist from '@expo/plist'
import * as path from 'path'
import * as fs from 'fs'

export const withExtensionEntitlements: ConfigPlugin<{
  extensionName: string
}> = (config, {extensionName}) => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  return withInfoPlist(config, config => {
    const extensionEntitlementsPath = path.join(
      config.modRequest.platformProjectRoot,
      extensionName,
      `${extensionName}.entitlements`,
    )

    const shareExtensionEntitlements: Record<string, string | string[]> = {
      'com.apple.security.application-groups': [
        `group.${config.ios?.bundleIdentifier}`,
      ],
    }

    fs.mkdirSync(path.dirname(extensionEntitlementsPath), {
      recursive: true,
    })
    fs.writeFileSync(
      extensionEntitlementsPath,
      plist.build(shareExtensionEntitlements),
    )

    return config
  })
}
