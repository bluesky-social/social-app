/* eslint-env detox/detox */

const {openApp} = require('../util')

describe('Create account', () => {
  beforeEach(async () => {
    await openApp({permissions: {notifications: 'YES'}})
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
    await expect(element(by.id('welcomeBanner'))).toBeVisible()
  })
})
