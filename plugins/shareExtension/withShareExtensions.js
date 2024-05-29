const {withPlugins} = require('@expo/config-plugins')
const {withAppEntitlements} = require('./withAppEntitlements')
const {withXcodeTarget} = require('./withXcodeTarget')
const {withExtensionEntitlements} = require('./withExtensionEntitlements')
const {withExtensionInfoPlist} = require('./withExtensionInfoPlist')
const {withExtensionViewController} = require('./withExtensionViewController')
const {withIntentFilters} = require('./withIntentFilters')

const SHARE_EXTENSION_NAME = 'Share-with-Bluesky'
const SHARE_EXTENSION_CONTROLLER_NAME = 'ShareViewController'

const withShareExtensions = config => {
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

module.exports = withShareExtensions
