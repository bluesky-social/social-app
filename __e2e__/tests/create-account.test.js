/* eslint-env detox/detox */

const {openApp} = require('../util')

describe('Create account', () => {
  beforeEach(async () => {
    await openApp({permissions: {notifications: 'YES'}})
  })

  it('I can create a new account', async () => {
    await element(by.id('createAccountButton')).tap()
    await device.takeScreenshot('1- opened create account screen')
    await element(by.id('otherServerBtn')).tap()
    await device.takeScreenshot('2- selected other server')
    await element(by.id('localDevServerBtn')).tap()
    await device.takeScreenshot('3- selected local dev server')
    await element(by.id('nextBtn')).tap()
    await element(by.id('emailInput')).typeText('example@test.com')
    await element(by.id('passwordInput')).typeText('hunter2')
    await element(by.id('is13Input')).tap()
    await device.takeScreenshot('4- entered account details')
    await element(by.id('nextBtn')).tap()
    await element(by.id('handleInput')).typeText('e2e-test')
    await device.takeScreenshot('4- entered handle')
    await element(by.id('nextBtn')).tap()
    await expect(element(by.id('homeScreen'))).toBeVisible()
  })
})
