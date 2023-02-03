/* eslint-env detox/detox */

describe('Example', () => {
  async function grantAccessToUserWithValidCredentials(username) {
    await element(by.id('signInButton')).tap()
    await element(by.id('loginSelectServiceButton')).tap()
    await element(by.id('localDevServerButton')).tap()
    await element(by.id('loginUsernameInput')).typeText(username)
    await element(by.id('loginPasswordInput')).typeText('hunter2')
    await element(by.id('loginNextButton')).tap()
  }

  beforeEach(async () => {
    await device.uninstallApp()
    await device.installApp()
    await device.launchApp({permissions: {notifications: 'YES'}})
  })

  it('As a user, I can see the login screen', async () => {
    await expect(element(by.id('signInButton'))).toBeVisible()
  })

  it('As Alice, I can login', async () => {
    await grantAccessToUserWithValidCredentials('alice')
    await device.takeScreenshot('opened general section')
  })

  it('As Alice, I can login, and post a text', async () => {
    await grantAccessToUserWithValidCredentials('alice')
    await element(by.id('composePromptButton')).tap()
    await element(by.id('composerTextInput')).typeText(
      'Greetings earthlings, I come in peace... and to run some tests.',
    )
    await element(by.id('composerPublishButton')).tap()
    await device.takeScreenshot('opened general section')
    await expect(element(by.id('composePromptButton'))).toBeVisible()
  })
})
