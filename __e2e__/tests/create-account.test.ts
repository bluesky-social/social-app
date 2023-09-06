/* eslint-env detox/detox */

import {openApp, createServer} from '../util'

describe('Create account', () => {
  let service: string
  beforeAll(async () => {
    service = await createServer('')
    await openApp({permissions: {notifications: 'YES'}})
  })

  it('I can create a new account', async () => {
    await element(by.id('createAccountButton')).tap()
    await device.takeScreenshot('1- opened create account screen')
    await element(by.id('otherServerBtn')).tap()
    await device.takeScreenshot('2- selected other server')
    await element(by.id('customServerInput')).clearText()
    await element(by.id('customServerInput')).typeText(service)
    await device.takeScreenshot('3- input test server URL')
    await element(by.id('nextBtn')).tap()
    await element(by.id('emailInput')).typeText('example@test.com')
    await element(by.id('passwordInput')).typeText('hunter2')
    await device.takeScreenshot('4- entered account details')
    await element(by.id('nextBtn')).tap()
    await element(by.id('handleInput')).typeText('e2e-test')
    await device.takeScreenshot('4- entered handle')
    await element(by.id('nextBtn')).tap()
    await expect(element(by.id('welcomeOnboarding'))).toBeVisible()
    await element(by.id('continueBtn')).tap()
    await expect(element(by.id('recommendedFeedsOnboarding'))).toBeVisible()
    await element(by.id('continueBtn')).tap()
    await expect(element(by.id('homeScreen'))).toBeVisible()
  })
})
