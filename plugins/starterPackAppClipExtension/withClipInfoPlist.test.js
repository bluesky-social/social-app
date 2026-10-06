/* eslint-disable import/no-nodejs-modules -- Config plugin tests run in Node. */
const fs = require('fs')
const {IOSConfig} = require('expo/config-plugins')
const plist = require('@expo/plist').default

const createAppConfig = require('../../app.config')
const {withClipInfoPlist} = require('./withClipInfoPlist')

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}))

const allOrientations = [
  'UIInterfaceOrientationPortrait',
  'UIInterfaceOrientationPortraitUpsideDown',
  'UIInterfaceOrientationLandscapeLeft',
  'UIInterfaceOrientationLandscapeRight',
]

/** @param {import('@expo/config-types').ExpoConfig} inputConfig */
async function generateClipInfoPlist(inputConfig) {
  const rawConfig = {
    ...inputConfig,
    ios: {
      ...inputConfig.ios,
      infoPlist: {...inputConfig.ios?.infoPlist},
    },
  }

  // Match Expo prebuild's registration order: custom plugins, then defaults.
  /** @type {import('expo/config-plugins').ExportedConfig} */
  let config = withClipInfoPlist(inputConfig, {targetName: 'BlueskyClip'})
  config = IOSConfig.Orientation.withOrientation(config)
  config = IOSConfig.RequiresFullScreen.withRequiresFullScreen(config)
  const infoPlistMod = config.mods?.ios?.infoPlist
  if (!infoPlistMod) {
    throw new Error('Expected an Info.plist mod')
  }
  const result = await infoPlistMod({
    ...config,
    modRawConfig: rawConfig,
    modResults: {...rawConfig.ios.infoPlist},
    modRequest: {
      projectRoot: '/project',
      platformProjectRoot: '/project/ios',
      platform: 'ios',
      modName: 'infoPlist',
      introspect: false,
    },
  })

  expect(fs.writeFileSync).toHaveBeenCalledTimes(1)
  const [targetPath, xml] = jest.mocked(fs.writeFileSync).mock.calls[0]
  expect(targetPath).toBe('/project/ios/BlueskyClip/Info.plist')
  if (typeof xml !== 'string') {
    throw new Error('Expected a plist string')
  }
  const clip = /** @type {import('@expo/plist').PlistObject} */ (
    plist.parse(xml)
  )
  return {clip, parent: result.modResults}
}

describe('App Clip orientations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('inherits all multitasking orientations from the current app config', async () => {
    const {clip, parent} = await generateClipInfoPlist(
      createAppConfig({name: 'Bluesky', slug: 'bluesky'}).expo,
    )

    expect(clip['UISupportedInterfaceOrientations~ipad']).toEqual(
      allOrientations,
    )
    expect(clip.UISupportedInterfaceOrientations).toEqual([
      'UIInterfaceOrientationPortrait',
    ])
    expect(clip.UIRequiresFullScreen).toBe(false)
    expect(clip['UISupportedInterfaceOrientations~ipad']).toEqual(
      parent['UISupportedInterfaceOrientations~ipad'],
    )
    expect(clip).not.toHaveProperty('UIBackgroundModes')
    expect(clip.UILaunchScreen).toEqual({})
    expect(clip.NSAppClip).toEqual({
      NSAppClipRequestEphemeralUserNotification: false,
      NSAppClipRequestLocationConfirmation: false,
    })
  })

  it.each([
    ['default universal', {ios: {supportsTablet: true}}],
    ['portrait phone', {orientation: 'portrait', ios: {supportsTablet: false}}],
    [
      'landscape phone',
      {orientation: 'landscape', ios: {supportsTablet: false}},
    ],
    ['tablet-only', {orientation: 'portrait', ios: {isTabletOnly: true}}],
    [
      'full-screen tablet',
      {
        orientation: 'landscape',
        ios: {
          supportsTablet: true,
          requireFullScreen: true,
          infoPlist: {
            'UISupportedInterfaceOrientations~ipad': [
              'UIInterfaceOrientationLandscapeLeft',
            ],
          },
        },
      },
    ],
  ])('matches resolved parent settings for %s', async (_name, options) => {
    const {clip, parent} = await generateClipInfoPlist({
      name: 'Bluesky',
      slug: 'bluesky',
      version: '1.0.0',
      ...options,
    })

    for (const key of [
      'UISupportedInterfaceOrientations',
      'UISupportedInterfaceOrientations~ipad',
      'UIRequiresFullScreen',
    ]) {
      expect(clip[key]).toEqual(parent[key])
      if (parent[key] === undefined) {
        expect(clip).not.toHaveProperty(key)
      }
    }
  })
})
