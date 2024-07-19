const {withPlugins} = require('@expo/config-plugins')
const {withAppEntitlements} = require('./withAppEntitlements')
const {withClipEntitlements} = require('./withClipEntitlements')
const {withClipInfoPlist} = require('./withClipInfoPlist')
const {withFiles} = require('./withFiles')
const {withXcodeTarget} = require('./withXcodeTarget')

const APP_CLIP_TARGET_NAME = 'BlueskyClip'

const withStarterPackAppClip = config => {
  return withPlugins(config, [
    withAppEntitlements,
    [
      withClipEntitlements,
      {
        targetName: APP_CLIP_TARGET_NAME,
      },
    ],
    [
      withClipInfoPlist,
      {
        targetName: APP_CLIP_TARGET_NAME,
      },
    ],
    [
      withFiles,
      {
        targetName: APP_CLIP_TARGET_NAME,
      },
    ],
    [
      withXcodeTarget,
      {
        targetName: APP_CLIP_TARGET_NAME,
      },
    ],
  ])
}

module.exports = withStarterPackAppClip
