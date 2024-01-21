import {ConfigPlugin, withPlugins} from '@expo/config-plugins'
import {withAppEntitlements} from './withAppEntitlements'
import {withExtensionEntitlements} from './withExtensionEntitlements'

const SHARE_EXTENSION_NAME = 'Share-with-Bluesky'
// const SHARE_EXTENSION_CONTROLLER_NAME = 'ShareViewController'
// const EXTENSIONS_DIRECTORY = '/extensions'
//
// const IOS_TARGET_DIRECTORY = './ios/'

export const withShareExtensionIos: ConfigPlugin = config => {
  return withPlugins(config, [
    withAppEntitlements,
    [withExtensionEntitlements, {folderName: SHARE_EXTENSION_NAME}],
  ])
}
