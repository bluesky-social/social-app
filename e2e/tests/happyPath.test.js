/* eslint-env detox/detox */

describe('Example', () => {
  async function grantAccessToUserWithValidCredentials(
    username,
    {takeScreenshots} = {takeScreenshots: false},
  ) {
    await element(by.id('signInButton')).tap()
    if (takeScreenshots) {
      await device.takeScreenshot('1- opened sign-in screen')
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
    await element(by.id('loginPasswordInput')).typeText('hunter2')
    if (takeScreenshots) {
      await device.takeScreenshot('4- entered username and password')
    }
    await element(by.id('loginNextButton')).tap()
  }

  beforeEach(async () => {
    await device.uninstallApp()
    await device.installApp()
    await device.launchApp({permissions: {notifications: 'YES'}})
  })

  it('As Alice, I can login', async () => {
    await expect(element(by.id('signInButton'))).toBeVisible()
    await grantAccessToUserWithValidCredentials('alice', {
      takeScreenshots: true,
    })
    await device.takeScreenshot('5- opened home screen')
  })

  it('As Alice, I can login, and post a text', async () => {
    await grantAccessToUserWithValidCredentials('alice')
    await element(by.id('composeFAB')).tap()
    await device.takeScreenshot('1- opened composer')
    await element(by.id('composerTextInput')).typeText(
      'Greetings earthlings, I come in peace... and to run some tests.',
    )
    await device.takeScreenshot('2- entered text')
    await element(by.id('composerPublishButton')).tap()
    await device.takeScreenshot('3- opened general section')
    await expect(element(by.id('composeFAB'))).toBeVisible()
  })

  it('I can create a new account', async () => {
    await element(by.id('createAccountButton')).tap()
    await device.takeScreenshot('1- opened create account screen')
    await element(by.id('registerSelectServiceButton')).tap()
    await device.takeScreenshot('2- opened service selector')
    await element(by.id('localDevServerButton')).tap()
    await device.takeScreenshot('3- selected local dev server')
    await element(by.id('registerEmailInput')).typeText('example@test.com')
    await element(by.id('registerPasswordInput')).typeText('hunter2')
    await element(by.id('registerHandleInput')).typeText('e2e-test')
    await element(by.id('registerIs13Input')).tap()
    await device.takeScreenshot('4- entered account details')
    await element(by.id('createAccountButton')).tap()
    await expect(element(by.id('onboardFeatureExplainerSkipBtn'))).toBeVisible()
    await expect(element(by.id('onboardFeatureExplainerNextBtn'))).toBeVisible()
    await device.takeScreenshot('5- onboard feature explainer')
    await element(by.id('onboardFeatureExplainerSkipBtn')).tap()
    await expect(element(by.id('onboardFollowsSkipBtn'))).toBeVisible()
    await expect(element(by.id('onboardFollowsNextBtn'))).toBeVisible()
    await device.takeScreenshot('6- onboard follows recommender')
    await element(by.id('onboardFollowsSkipBtn')).tap()
  })
})
