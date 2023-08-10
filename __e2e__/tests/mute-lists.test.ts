/* eslint-env detox/detox */

import {openApp, login, createServer, sleep} from '../util'

describe('Mute lists', () => {
  let service: string
  beforeAll(async () => {
    service = await createServer('?users&follows&labels')
    await openApp({
      permissions: {notifications: 'YES', medialibrary: 'YES', photos: 'YES'},
    })
  })

  it('Login and view my mutelists', async () => {
    await expect(element(by.id('signInButton'))).toBeVisible()
    await login(service, 'alice', 'hunter2')
    await element(by.id('viewHeaderDrawerBtn')).tap()
    await expect(element(by.id('drawer'))).toBeVisible()
    await element(by.id('menuItemButton-Moderation')).tap()
    await element(by.id('mutelistsBtn')).tap()
    await expect(element(by.id('list-Muted Users'))).toBeVisible()
    await element(by.id('list-Muted Users')).tap()
    await expect(
      element(by.id('user-muted-by-list-account.test')),
    ).toBeVisible()
  })

  it('Toggle subscription', async () => {
    await element(by.id('unsubscribeListBtn')).tap()
    await element(by.id('subscribeListBtn')).tap()
  })

  it('Edit display name and description via the edit mutelist modal', async () => {
    await element(by.id('editListBtn')).tap()
    await expect(element(by.id('createOrEditMuteListModal'))).toBeVisible()
    await element(by.id('editNameInput')).clearText()
    await element(by.id('editNameInput')).typeText('Bad Ppl')
    await element(by.id('editDescriptionInput')).clearText()
    await element(by.id('editDescriptionInput')).typeText('They bad')
    await element(by.id('saveBtn')).tap()
    await expect(element(by.id('createOrEditMuteListModal'))).not.toBeVisible()
    await expect(element(by.id('listName'))).toHaveText('Bad Ppl')
    await expect(element(by.id('listDescription'))).toHaveText('They bad')
    // have to wait for the toast to clear
    await waitFor(element(by.id('editListBtn')))
      .toBeVisible()
      .withTimeout(5000)
  })

  it('Remove description via the edit mutelist modal', async () => {
    await element(by.id('editListBtn')).tap()
    await expect(element(by.id('createOrEditMuteListModal'))).toBeVisible()
    await element(by.id('editDescriptionInput')).clearText()
    await element(by.id('saveBtn')).tap()
    await expect(element(by.id('createOrEditMuteListModal'))).not.toBeVisible()
    await expect(element(by.id('listDescription'))).not.toBeVisible()
    // have to wait for the toast to clear
    await waitFor(element(by.id('editListBtn')))
      .toBeVisible()
      .withTimeout(5000)
  })

  it('Set avi via the edit mutelist modal', async () => {
    await expect(element(by.id('userAvatarFallback'))).toExist()
    await element(by.id('editListBtn')).tap()
    await expect(element(by.id('createOrEditMuteListModal'))).toBeVisible()
    await element(by.id('changeAvatarBtn')).tap()
    await element(by.text('Library')).tap()
    await sleep(3e3)
    await element(by.id('saveBtn')).tap()
    await expect(element(by.id('createOrEditMuteListModal'))).not.toBeVisible()
    await expect(element(by.id('userAvatarImage'))).toExist()
    // have to wait for the toast to clear
    await waitFor(element(by.id('editListBtn')))
      .toBeVisible()
      .withTimeout(5000)
  })

  it('Remove avi via the edit mutelist modal', async () => {
    await expect(element(by.id('userAvatarImage'))).toExist()
    await element(by.id('editListBtn')).tap()
    await expect(element(by.id('createOrEditMuteListModal'))).toBeVisible()
    await element(by.id('changeAvatarBtn')).tap()
    await element(by.text('Remove')).tap()
    await element(by.id('saveBtn')).tap()
    await expect(element(by.id('createOrEditMuteListModal'))).not.toBeVisible()
    await expect(element(by.id('userAvatarFallback'))).toExist()
    // have to wait for the toast to clear
    await waitFor(element(by.id('editListBtn')))
      .toBeVisible()
      .withTimeout(5000)
  })

  it('Delete the mutelist', async () => {
    await element(by.id('deleteListBtn')).tap()
    await element(by.id('confirmBtn')).tap()
    await expect(element(by.id('emptyMuteLists'))).toBeVisible()
  })

  it('Create a new mutelist', async () => {
    await element(by.id('emptyMuteLists-button')).tap()
    await expect(element(by.id('createOrEditMuteListModal'))).toBeVisible()
    await element(by.id('editNameInput')).typeText('Bad Ppl')
    await element(by.id('editDescriptionInput')).typeText('They bad')
    await element(by.id('saveBtn')).tap()
    await expect(element(by.id('createOrEditMuteListModal'))).not.toBeVisible()
    await expect(element(by.id('listName'))).toHaveText('Bad Ppl')
    await expect(element(by.id('listDescription'))).toHaveText('They bad')
    // have to wait for the toast to clear
    await waitFor(element(by.id('editListBtn')))
      .toBeVisible()
      .withTimeout(5000)
  })

  it('Shows the mutelist on my profile', async () => {
    await element(by.id('bottomBarProfileBtn')).tap()
    await element(by.id('selector-3')).tap()
    await element(by.id('list-Bad Ppl')).tap()
  })

  it('Adds and removes users on mutelists', async () => {
    await element(by.id('bottomBarSearchBtn')).tap()
    await element(by.id('searchTextInput')).typeText('bob')
    await element(by.id('searchAutoCompleteResult-bob.test')).tap()
    await expect(element(by.id('profileView'))).toBeVisible()

    await element(by.id('profileHeaderDropdownBtn')).tap()
    await element(by.text('Add to Lists')).tap()
    await expect(element(by.id('listAddRemoveUserModal'))).toBeVisible()
    await element(by.id('toggleBtn-Bad Ppl')).tap()
    await element(by.id('saveBtn')).tap()
    await expect(element(by.id('listAddRemoveUserModal'))).not.toBeVisible()

    await element(by.id('profileHeaderDropdownBtn')).tap()
    await element(by.text('Add to Lists')).tap()
    await expect(element(by.id('listAddRemoveUserModal'))).toBeVisible()
    await element(by.id('toggleBtn-Bad Ppl')).tap()
    await element(by.id('saveBtn')).tap()
    await expect(element(by.id('listAddRemoveUserModal'))).not.toBeVisible()
  })
})
