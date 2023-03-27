const appConfig = require('../app.json')
const {resolveConfig} = require('detox/internals')

const platform = device.getPlatform()

module.exports.openApp = async function openApp(opts) {
  opts = opts || {}
  const config = await resolveConfig()
  if (config.configurationName.split('.').includes('debug')) {
    return await openAppForDebugBuild(platform, opts)
  } else {
    return await device.launchApp({
      ...opts,
      newInstance: true,
    })
  }
}

async function openAppForDebugBuild(platform, opts) {
  const deepLinkUrl = process.env.EXPO_USE_UPDATES
    ? // Testing latest published EAS update for the test_debug channel
      getDeepLinkUrl(getLatestUpdateUrl())
    : // Local testing with packager
      getDeepLinkUrl(getDevLauncherPackagerUrl(platform))

  if (platform === 'ios') {
    await device.launchApp({
      ...opts,
      newInstance: true,
    })
    sleep(3000)
    await device.openURL({
      url: deepLinkUrl,
    })
  } else {
    await device.launchApp({
      ...opts,
      newInstance: true,
      url: deepLinkUrl,
    })
  }

  await sleep(3000)
}

const getDeepLinkUrl = url =>
  `expo+bluesky://expo-development-client/?url=${encodeURIComponent(url)}`

const getDevLauncherPackagerUrl = platform =>
  `http://localhost:8081/index.bundle?platform=${platform}&dev=true&minify=false&disableOnboarding=1`

const getLatestUpdateUrl = () =>
  `https://u.expo.dev/${getAppId()}?channel-name=test_debug&disableOnboarding=1`

const getAppId = () => appConfig?.expo?.extra?.eas?.projectId ?? ''

const sleep = t => new Promise(res => setTimeout(res, t))
