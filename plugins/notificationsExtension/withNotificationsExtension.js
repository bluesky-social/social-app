const {withPlugins} = require('@expo/config-plugins')
const {withAppEntitlements} = require('./withAppEntitlements')
const {withXcodeTarget} = require('./withXcodeTarget')
const {withExtensionEntitlements} = require('./withExtensionEntitlements')
const {withExtensionInfoPlist} = require('./withExtensionInfoPlist')
const {withExtensionViewController} = require('./withExtensionViewController')
const {withSounds} = require('./withSounds')

const EXTENSION_NAME = 'BlueskyNSE'
const EXTENSION_CONTROLLER_NAME = 'NotificationService'

const withNotificationsExtension = config => {
  const soundFiles = ['dm.aiff']

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
      withSounds,
      {
        extensionName: EXTENSION_NAME,
        soundFiles,
      },
    ],
    [
      withXcodeTarget,
      {
        extensionName: EXTENSION_NAME,
        controllerName: EXTENSION_CONTROLLER_NAME,
        soundFiles,
      },
    ],
  ])
}

module.exports = withNotificationsExtension
