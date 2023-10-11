/* eslint-env detox/detox */

import {openApp, loginAsAlice, createServer} from '../util'

describe('Shell', () => {
  beforeAll(async () => {
    await createServer('?users')
    await openApp({permissions: {notifications: 'YES'}})
  })

  it('Login', async () => {
    await loginAsAlice()
    await element(by.id('homeScreenFeedTabs-Following')).tap()
  })

  it('Can swipe the shelf open', async () => {
    await element(by.id('homeScreen')).swipe('right', 'fast', 0.75)
    await expect(element(by.id('drawer'))).toBeVisible()
    await element(by.id('drawer')).swipe('left', 'fast', 0.75)
    await expect(element(by.id('drawer'))).not.toBeVisible()
  })

  it('Can open the shelf by pressing the header avi', async () => {
    await element(by.id('viewHeaderDrawerBtn')).tap()
    await expect(element(by.id('drawer'))).toBeVisible()
  })

  it('Can navigate using the shelf', async () => {
    await element(by.id('menuItemButton-Notifications')).tap()
    await expect(element(by.id('drawer'))).not.toBeVisible()
    await expect(element(by.id('notificationsScreen'))).toBeVisible()
  })
})
