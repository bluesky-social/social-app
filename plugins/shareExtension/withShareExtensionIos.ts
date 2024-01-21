import {ConfigPlugin, withPlugins} from '@expo/config-plugins'
import {withAppEntitlements} from './withAppEntitlements'
import {withExtensionEntitlements} from './withExtensionEntitlements'
import {withExtensionInfoPlist} from './withExtensionInfoPlist'

const SHARE_EXTENSION_NAME = 'Share-with-Bluesky'
const SHARE_EXTENSION_CONTROLLER_NAME = 'ShareViewController'
// const EXTENSIONS_DIRECTORY = '/extensions'
//
// const IOS_TARGET_DIRECTORY = './ios/'

const withShareExtensionIos: ConfigPlugin = config => {
  return withPlugins(config, [
    withAppEntitlements,
    [
      withExtensionEntitlements,
      {
        extensionName: SHARE_EXTENSION_NAME,
      },
    ],
    [
      withExtensionInfoPlist,
      {
        extensionName: SHARE_EXTENSION_NAME,
        controllerName: SHARE_EXTENSION_CONTROLLER_NAME,
      },
    ],
  ])
}

export default withShareExtensionIos
