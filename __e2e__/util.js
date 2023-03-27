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

async function isVisible(id) {
  try {
    await expect(element(by.id(id))).toBeVisible()
    return true
  } catch (e) {
    return false
  }
}
module.exports.isVisible = isVisible

module.exports.login = async function login(
  username,
  password,
  {takeScreenshots} = {takeScreenshots: false},
) {
  await element(by.id('signInButton')).tap()
  if (takeScreenshots) {
    await device.takeScreenshot('1- opened sign-in screen')
  }
  if (await isVisible('chooseAccountForm')) {
    await element(by.id('chooseNewAccountBtn')).tap()
  }
  await element(by.id('loginSelectServiceButton')).tap()
  if (takeScreenshots) {
    await device.takeScreenshot('2- opened service selector')
  }
  await element(by.id('localDevServerButton')).tap()
  if (takeScreenshots) {
    await device.takeScreenshot('3- selected local dev server')
  }
  await element(by.id('loginUsernameInput')).typeText(username)
  await element(by.id('loginPasswordInput')).typeText(password)
  if (takeScreenshots) {
    await device.takeScreenshot('4- entered username and password')
  }
  await element(by.id('loginNextButton')).tap()
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
