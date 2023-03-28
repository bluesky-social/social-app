/* eslint-env detox/detox */

import {openApp, login, createServer, sleep} from '../util'

describe('Login', () => {
  let service: string
  beforeAll(async () => {
    service = await createServer('?users')
    await openApp({
      permissions: {notifications: 'YES', medialibrary: 'YES', photos: 'YES'},
    })
  })

  it('Login and navigate to my profile', async () => {
    await expect(element(by.id('signInButton'))).toBeVisible()
    await login(service, 'alice', 'hunter2')
    await element(by.id('bottomBarProfileBtn')).tap()
  })

  it('Open and close edit profile modal', async () => {
    await element(by.id('profileHeaderEditProfileButton')).tap()
    await expect(element(by.id('editProfileModal'))).toBeVisible()
    await element(by.id('editProfileCancelBtn')).tap()
    await expect(element(by.id('editProfileModal'))).not.toBeVisible()
  })

  it('Edit display name and description via the edit profile modal', async () => {
    await element(by.id('profileHeaderEditProfileButton')).tap()
    await expect(element(by.id('editProfileModal'))).toBeVisible()
    await element(by.id('editProfileDisplayNameInput')).clearText()
    await element(by.id('editProfileDisplayNameInput')).typeText('Alicia')
    await element(by.id('editProfileDescriptionInput')).clearText()
    await element(by.id('editProfileDescriptionInput')).typeText(
      'One cool hacker',
    )
    await element(by.id('editProfileSaveBtn')).tap()
    await expect(element(by.id('editProfileModal'))).not.toBeVisible()
    await expect(element(by.id('profileHeaderDisplayName'))).toHaveText(
      'Alicia',
    )
    await expect(element(by.id('profileHeaderDescription'))).toHaveText(
      'One cool hacker',
    )
  })

  it('Remove display name and description via the edit profile modal', async () => {
    await element(by.id('profileHeaderEditProfileButton')).tap()
    await expect(element(by.id('editProfileModal'))).toBeVisible()
    await element(by.id('editProfileDisplayNameInput')).clearText()
    await element(by.id('editProfileDescriptionInput')).clearText()
    await element(by.id('editProfileSaveBtn')).tap()
    await expect(element(by.id('editProfileModal'))).not.toBeVisible()
    await expect(element(by.id('profileHeaderDisplayName'))).toHaveText(
      'alice.test',
    )
    await expect(element(by.id('profileHeaderDescription'))).toHaveText('')
  })

  // TODO
  // it('Set avi and banner via the edit profile modal', async () => {
  //   await element(by.id('profileHeaderEditProfileButton')).tap()
  //   await expect(element(by.id('editProfileModal'))).toBeVisible()
  //   await element(by.id('changeBannerBtn')).tap()
  //   await element(by.id('changeBannerLibraryBtn')).tap()
  //   await sleep(3e3)
  //   await element(by.id('editProfileSaveBtn')).tap()
  //   await expect(element(by.id('editProfileModal'))).not.toBeVisible()
  // })
})
