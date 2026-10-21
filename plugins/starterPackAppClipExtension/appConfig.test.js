const {IOSConfig} = require('expo/config-plugins')

const createAppConfig = require('../../app.config')

const originalBuildEnvironment = process.env.EXPO_PUBLIC_ENV

afterEach(() => {
  if (originalBuildEnvironment === undefined) {
    delete process.env.EXPO_PUBLIC_ENV
  } else {
    process.env.EXPO_PUBLIC_ENV = originalBuildEnvironment
  }
})

it.each([
  ['local development', undefined, true, '"1,2"'],
  ['development', 'development', true, '"1,2"'],
  ['end-to-end testing', 'e2e', true, '"1,2"'],
  ['TestFlight', 'testflight', true, '"1,2"'],
  ['production', 'production', false, '"1"'],
])(
  'gates tablet support and parent device families for %s',
  (_name, environment, supportsTablet, expectedDeviceFamilies) => {
    if (environment === undefined) {
      delete process.env.EXPO_PUBLIC_ENV
    } else {
      process.env.EXPO_PUBLIC_ENV = environment
    }

    const config = createAppConfig({name: 'Bluesky', slug: 'bluesky'}).expo

    expect(config.ios.supportsTablet).toBe(supportsTablet)
    expect(
      IOSConfig.DeviceFamily.formatDeviceFamilies(
        IOSConfig.DeviceFamily.getDeviceFamilies(config),
      ),
    ).toBe(expectedDeviceFamilies)
    expect(config.ios.infoPlist.UISupportedInterfaceOrientations).toEqual([
      'UIInterfaceOrientationPortrait',
    ])
    expect(
      config.ios.infoPlist['UISupportedInterfaceOrientations~ipad'],
    ).toEqual([
      'UIInterfaceOrientationPortrait',
      'UIInterfaceOrientationPortraitUpsideDown',
      'UIInterfaceOrientationLandscapeLeft',
      'UIInterfaceOrientationLandscapeRight',
    ])
  },
)
