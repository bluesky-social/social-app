/* eslint-env detox/detox */

/**
 * This test is being skipped until we can resolve the detox crash issue
 * with the side drawer.
 */

import {openApp, loginAsAlice, createServer} from '../util'

describe('invite-codes', () => {
  let service: string
  let inviteCode = ''
  beforeAll(async () => {
    service = await createServer('?users&invite')
    await openApp({permissions: {notifications: 'YES'}})
  })

  it('I can fetch invite codes', async () => {
    await expect(element(by.id('signInButton'))).toBeVisible()
    await loginAsAlice()
    await element(by.id('e2eOpenInviteCodesModal')).tap()
    await expect(element(by.id('inviteCodesModal'))).toBeVisible()
    const attrs = await element(by.id('inviteCode-0-code')).getAttributes()
    inviteCode = attrs.text
    await element(by.id('closeBtn')).tap()
    await element(by.id('e2eSignOut')).tap()
  })

  it('I can create a new account with the invite code', async () => {
    await element(by.id('createAccountButton')).tap()
    await device.takeScreenshot('1- opened create account screen')
    await element(by.id('otherServerBtn')).tap()
    await device.takeScreenshot('2- selected other server')
    await element(by.id('customServerInput')).clearText()
    await element(by.id('customServerInput')).typeText(service)
    await device.takeScreenshot('3- input test server URL')
    await element(by.id('nextBtn')).tap()
    await element(by.id('inviteCodeInput')).typeText(inviteCode)
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
    await expect(element(by.id('recommendedFollowsOnboarding'))).toBeVisible()
    await element(by.id('continueBtn')).tap()
    await expect(element(by.id('homeScreen'))).toBeVisible()
  })

  it('I get a notification for the new user', async () => {
    await element(by.id('e2eSignOut')).tap()
    await loginAsAlice()
    await waitFor(element(by.id('homeScreen')))
      .toBeVisible()
      .withTimeout(5000)
    await element(by.id('bottomBarNotificationsBtn')).tap()
    await expect(element(by.id('invitedUser'))).toBeVisible()
  })

  it('I can dismiss the new user notification', async () => {
    await element(by.id('dismissBtn')).tap()
    await expect(element(by.id('invitedUser'))).not.toBeVisible()
  })
})
