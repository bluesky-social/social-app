import {ConfigPlugin, withInfoPlist} from '@expo/config-plugins'
import plist from '@expo/plist'
import path from 'path'
import fs from 'fs'

export const withExtensionEntitlements: ConfigPlugin<{
  folderName: string
}> = (config, {folderName}) => {
  return withInfoPlist(config, config => {
    const extensionEntitlementsPath = path.join(
      config.modRequest.projectRoot,
      folderName,
      `${folderName}.entitlements`,
    )
    const entitilementsFileExists = fs.existsSync(extensionEntitlementsPath)

    if (entitilementsFileExists) return config

    const safariExtensionEntitlements: Record<string, string | string[]> = {
      'com.apple.security.application-groups': [
        `group.${config.ios?.bundleIdentifier}`,
      ],
    }

    fs.mkdirSync(path.dirname(extensionEntitlementsPath), {recursive: true})
    fs.writeFileSync(
      extensionEntitlementsPath,
      plist.build(safariExtensionEntitlements),
    )

    return config
  })
}
