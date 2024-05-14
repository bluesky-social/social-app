const {withPlugins} = require('@expo/config-plugins')
const {withAppEntitlements} = require('./withAppEntitlements')
const {withXcodeTarget} = require('./withXcodeTarget')
const {withExtensionEntitlements} = require('./withExtensionEntitlements')
const {withExtensionInfoPlist} = require('./withExtensionInfoPlist')
const {withExtensionViewController} = require('./withExtensionViewController')

const EXTENSION_NAME = 'Bluesky-Notifications'
const EXTENSION_CONTROLLER_NAME = 'NotificationViewController'

const withNotificationsExtension = config => {
  return withPlugins(config, [
    // IOS
    withAppEntitlements,
    [
      withExtensionEntitlements,
      {
        extensionName: EXTENSION_NAME,
      },
    ],
    [
      withExtensionInfoPlist,
      {
        extensionName: EXTENSION_NAME,
      },
    ],
    [
      withExtensionViewController,
      {
        extensionName: EXTENSION_NAME,
        controllerName: EXTENSION_CONTROLLER_NAME,
      },
    ],
    [
      withXcodeTarget,
      {
        extensionName: EXTENSION_NAME,
        controllerName: EXTENSION_CONTROLLER_NAME,
      },
    ],
  ])
}

module.exports = withNotificationsExtension
