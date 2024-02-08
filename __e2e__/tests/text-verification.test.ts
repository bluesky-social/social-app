/* eslint-env detox/detox */

import {describe, beforeAll, it} from '@jest/globals'
import {expect} from 'detox'
import {openApp, createServer} from '../util'

describe('Create account', () => {
  let service: string
  beforeAll(async () => {
    service = await createServer('?phone')
    await openApp({permissions: {notifications: 'YES'}})
  })

  it('I can create a new account with text verification', async () => {
    await element(by.id('e2eOpenLoggedOutView')).tap()

    await element(by.id('createAccountButton')).tap()
    await device.takeScreenshot('1- opened create account screen')
    await element(by.id('selectServiceButton')).tap()
    await device.takeScreenshot('2- selected other server')
    await element(by.id('customServerTextInput')).typeText(service)
    await element(by.id('customServerTextInput')).tapReturnKey()
    await element(by.id('customServerSelectBtn')).tap()
    await device.takeScreenshot('3- input test server URL')
    await element(by.id('emailInput')).typeText('text-verification@test.com')
    await element(by.id('passwordInput')).typeText('hunter2')
    await device.takeScreenshot('4- entered account details')
    await element(by.id('nextBtn')).tap()

    await element(by.id('phoneInput')).typeText('8042221111')
    await element(by.id('requestCodeBtn')).tap()
    await device.takeScreenshot('5- requested code')

    await element(by.id('codeInput')).typeText('000000')
    await device.takeScreenshot('6- entered code')
    await element(by.id('nextBtn')).tap()

    await element(by.id('handleInput')).typeText('text-verification-test')
    await device.takeScreenshot('7- entered handle')

    await element(by.id('nextBtn')).tap()

    await expect(element(by.id('welcomeOnboarding'))).toBeVisible()
    await element(by.id('continueBtn')).tap()
    await expect(element(by.id('recommendedFeedsOnboarding'))).toBeVisible()
    await element(by.id('continueBtn')).tap()
    await expect(element(by.id('recommendedFollowsOnboarding'))).toBeVisible()
    await element(by.id('continueBtn')).tap()
    await expect(element(by.id('homeScreen'))).toBeVisible()
  })

  it('failed text verification correctly goes back to the code input screen', async () => {
    await element(by.id('e2eSignOut')).tap()
    await element(by.id('e2eOpenLoggedOutView')).tap()

    await element(by.id('createAccountButton')).tap()
    await device.takeScreenshot('1- opened create account screen')
    await element(by.id('selectServiceButton')).tap()
    await device.takeScreenshot('2- selected other server')
    await element(by.id('customServerTextInput')).typeText(service)
    await element(by.id('customServerTextInput')).tapReturnKey()
    await element(by.id('customServerSelectBtn')).tap()
    await device.takeScreenshot('3- input test server URL')
    await element(by.id('emailInput')).typeText('text-verification2@test.com')
    await element(by.id('passwordInput')).typeText('hunter2')
    await device.takeScreenshot('4- entered account details')
    await element(by.id('nextBtn')).tap()

    await element(by.id('phoneInput')).typeText('8042221111')
    await element(by.id('requestCodeBtn')).tap()
    await device.takeScreenshot('5- requested code')

    await element(by.id('codeInput')).typeText('111111')
    await device.takeScreenshot('6- entered code')
    await element(by.id('nextBtn')).tap()

    await element(by.id('handleInput')).typeText('text-verification-test2')
    await device.takeScreenshot('7- entered handle')

    await element(by.id('nextBtn')).tap()

    await expect(element(by.id('codeInput'))).toBeVisible()
    await device.takeScreenshot('8- got error')
  })
})
