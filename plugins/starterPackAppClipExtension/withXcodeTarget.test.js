const {IOSConfig} = require('expo/config-plugins')

const {withXcodeTarget} = require('./withXcodeTarget')

jest.mock('expo/config-plugins', () => ({
  ...jest.requireActual('expo/config-plugins'),
  /**
   * @param {unknown} config
   * @param {(config: unknown) => unknown} action
   */
  withXcodeProject: (config, action) => action(config),
}))

describe('App Clip device family', () => {
  it.each([
    ['default iPhone-only', {}, '"1"'],
    ['explicit iPhone-only', {supportsTablet: false}, '"1"'],
    ['universal', {supportsTablet: true}, '"1,2"'],
    ['tablet-only', {isTabletOnly: true}, '"2"'],
    [
      'tablet-only with tablet support',
      {supportsTablet: true, isTabletOnly: true},
      '"2"',
    ],
  ])('matches the parent for %s builds', (_name, ios, expected) => {
    /** @type {Record<string, {buildSettings: Record<string, string>}>} */
    const configurations = {
      APP_DEBUG: {buildSettings: {PRODUCT_NAME: '"Bluesky"'}},
      APP_RELEASE: {buildSettings: {PRODUCT_NAME: '"Bluesky"'}},
    }
    const project = {
      addTarget: jest.fn(() => {
        configurations.CLIP_DEBUG = {
          buildSettings: {PRODUCT_NAME: '"BlueskyClip"'},
        }
        configurations.CLIP_RELEASE = {
          buildSettings: {PRODUCT_NAME: '"BlueskyClip"'},
        }
        return {uuid: 'APP_CLIP_TARGET', pbxNativeTarget: {}}
      }),
      addBuildPhase: jest.fn(),
      addPbxGroup: jest.fn(() => ({uuid: 'APP_CLIP_GROUP'})),
      addFile: jest.fn(),
      pbxXCBuildConfigurationSection: () => configurations,
      addTargetAttribute: jest.fn(),
      addTargetDependency: jest.fn(),
      getFirstTarget: () => ({uuid: 'APP_TARGET'}),
      hash: {project: {objects: {}}},
    }
    const config = {
      name: 'Bluesky',
      slug: 'bluesky',
      version: '1.0.0',
      ios: {bundleIdentifier: 'xyz.blueskyweb.app', ...ios},
      modResults: project,
    }

    IOSConfig.DeviceFamily.setDeviceFamily(config, {project})
    withXcodeTarget(config, {targetName: 'BlueskyClip'})

    for (const buildType of ['DEBUG', 'RELEASE']) {
      const parent = configurations[`APP_${buildType}`].buildSettings
      const clip = configurations[`CLIP_${buildType}`].buildSettings
      expect(parent.TARGETED_DEVICE_FAMILY).toBe(expected)
      expect(clip.TARGETED_DEVICE_FAMILY).toBe(parent.TARGETED_DEVICE_FAMILY)
    }
  })
})
