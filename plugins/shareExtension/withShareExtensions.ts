import {ConfigPlugin, withPlugins} from '@expo/config-plugins'
import {withAppEntitlements} from './withAppEntitlements'
import {withXcodeTarget} from './withXcodeTarget'
import {withExtensionEntitlements} from './withExtensionEntitlements'
import {withExtensionInfoPlist} from './withExtensionInfoPlist'
import {withExtensionViewController} from './withExtensionViewController'
import {withIntentFilters} from './withIntentFilters'

const SHARE_EXTENSION_NAME = 'Share-with-Bluesky'
const SHARE_EXTENSION_CONTROLLER_NAME = 'ShareViewController'

const withShareExtensions: ConfigPlugin = config => {
  return withPlugins(config, [
    // IOS
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
      },
    ],
    [
      withExtensionViewController,
      {
        extensionName: SHARE_EXTENSION_NAME,
        controllerName: SHARE_EXTENSION_CONTROLLER_NAME,
      },
    ],
    [
      withXcodeTarget,
      {
        extensionName: SHARE_EXTENSION_NAME,
        controllerName: SHARE_EXTENSION_CONTROLLER_NAME,
      },
    ],
    // Android
    withIntentFilters,
  ])
}

export default withShareExtensions
