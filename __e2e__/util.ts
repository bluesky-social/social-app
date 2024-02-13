import {resolveConfig} from 'detox/internals'
import {execSync} from 'child_process'
import http from 'http'

const platform = device.getPlatform()

export async function openApp(opts: any) {
  opts = opts || {}
  const config = await resolveConfig()

  if (device.getPlatform() === 'ios') {
    // disable password autofill
    execSync(
      `plutil -replace restrictedBool.allowPasswordAutoFill.value -bool NO ~/Library/Developer/CoreSimulator/Devices/${device.id}/data/Containers/Shared/SystemGroup/systemgroup.com.apple.configurationprofiles/Library/ConfigurationProfiles/UserSettings.plist`,
    )
    execSync(
      `plutil -replace restrictedBool.allowPasswordAutoFill.value -bool NO ~/Library/Developer/CoreSimulator/Devices/${device.id}/data/Library/UserConfigurationProfiles/EffectiveUserSettings.plist`,
    )
    execSync(
      `plutil -replace restrictedBool.allowPasswordAutoFill.value -bool NO ~/Library/Developer/CoreSimulator/Devices/${device.id}/data/Library/UserConfigurationProfiles/PublicInfo/PublicEffectiveUserSettings.plist`,
    )
  }
  if (config.configurationName.split('.').includes('debug')) {
    return await openAppForDebugBuild(platform, opts)
  } else {
    return await device.launchApp({
      ...opts,
      newInstance: true,
    })
  }
}

export async function isVisible(id: string) {
  try {
    await expect(element(by.id(id))).toBeVisible()
    return true
  } catch (e) {
    return false
  }
}

export async function login(
  service: string,
  username: string,
  password: string,
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
  await element(by.id('customSelectBtn')).tap()
  await element(by.id('customServerTextInput')).typeText(service)
  await element(by.id('customServerTextInput')).tapReturnKey()
  await element(by.id('doneBtn')).tap()
  if (takeScreenshots) {
    await device.takeScreenshot('3- input custom service')
  }
  await element(by.id('loginUsernameInput')).typeText(username)
  await element(by.id('loginPasswordInput')).typeText(password)
  if (takeScreenshots) {
    await device.takeScreenshot('4- entered username and password')
  }
  await element(by.id('loginNextButton')).tap()
}

export async function loginAsAlice() {
  await element(by.id('e2eSignInAlice')).tap()
}

export async function loginAsBob() {
  await element(by.id('e2eSignInBob')).tap()
}

async function openAppForDebugBuild(platform: string, opts: any) {
  const deepLinkUrl = // Local testing with packager
    /*process.env.EXPO_USE_UPDATES
    ? // Testing latest published EAS update for the test_debug channel
      getDeepLinkUrl(getLatestUpdateUrl())
    : */ getDeepLinkUrl(getDevLauncherPackagerUrl(platform))

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

export async function createServer(path = ''): Promise<string> {
  return new Promise(function (resolve, reject) {
    var req = http.request(
      {
        method: 'POST',
        host: 'localhost',
        port: 1986,
        path: `/${path}`,
      },
      function (res) {
        const body: Buffer[] = []
        res.on('data', chunk => body.push(chunk))
        res.on('end', function () {
          try {
            resolve(Buffer.concat(body).toString())
          } catch (e) {
            reject(e)
          }
        })
      },
    )
    req.on('error', reject)
    req.end()
  })
}

const getDeepLinkUrl = (url: string) =>
  `expo+bluesky://expo-development-client/?url=${encodeURIComponent(url)}`

const getDevLauncherPackagerUrl = (platform: string) =>
  `http://localhost:8081/index.bundle?platform=${platform}&dev=true&minify=false&disableOnboarding=1`

export const sleep = (t: number) => new Promise(res => setTimeout(res, t))
