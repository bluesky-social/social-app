import {ConfigPlugin, withInfoPlist} from '@expo/config-plugins'
import plist from '@expo/plist'
import * as path from 'path'
import * as fs from 'fs'

interface Params {
  extensionName: string
}

export const withExtensionInfoPlist: ConfigPlugin<Params> = (
  config,
  {extensionName},
) => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  return withInfoPlist(config, config => {
    const plistPath = path.join(
      config.modRequest.projectRoot,
      'extensions',
      extensionName,
      'Info.plist',
    )
    const targetPath = path.join(
      config.modRequest.platformProjectRoot,
      extensionName,
      'Info.plist',
    )

    const extPlist = plist.parse(fs.readFileSync(plistPath).toString())

    extPlist.MainAppScheme = config.scheme
    extPlist.CFBundleName = '$(PRODUCT_NAME)'
    extPlist.CFBundleDisplayName = 'Extension'
    extPlist.CFBundleIdentifier = '$(PRODUCT_BUNDLE_IDENTIFIER)'
    extPlist.CFBundleVersion = '$(CURRENT_PROJECT_VERSION)'
    extPlist.CFBundleExecutable = '$(EXECUTABLE_NAME)'
    extPlist.CFBundlePackageType = '$(PRODUCT_BUNDLE_PACKAGE_TYPE)'
    extPlist.CFBundleShortVersionString = '$(MARKETING_VERSION)'

    fs.mkdirSync(path.dirname(targetPath), {recursive: true})
    fs.writeFileSync(targetPath, plist.build(extPlist))

    return config
  })
}
