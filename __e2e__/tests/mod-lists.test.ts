/* eslint-env detox/detox */

import {describe, beforeAll, it} from '@jest/globals'
import {expect} from 'detox'
import {openApp, loginAsAlice, loginAsBob, createServer} from '../util'

describe('Mod lists', () => {
  beforeAll(async () => {
    await createServer('?users&follows&labels')
    await openApp({
      permissions: {notifications: 'YES', medialibrary: 'YES', photos: 'YES'},
    })
  })

  it('Login and view my modlists', async () => {
    await loginAsAlice()
    await element(by.id('e2eGotoModeration')).tap()
    await element(by.id('moderationlistsBtn')).tap()
    await expect(element(by.id('list-Muted Users'))).toBeVisible()
    await element(by.id('list-Muted Users')).tap()
    await expect(
      element(by.id('user-muted-by-list-account.test')),
    ).toBeVisible()
  })

  it('Toggle mute subscription', async () => {
    await element(by.id('unmuteBtn')).tap()
    await element(by.id('subscribeBtn')).tap()
    await element(by.text('Mute accounts')).tap()
    await element(by.id('confirmBtn')).tap()
  })

  it('Edit display name and description via the edit modlist modal', async () => {
    await element(by.id('headerDropdownBtn')).tap()
    await element(by.text('Edit list details')).tap()
    await expect(element(by.id('createOrEditListModal'))).toBeVisible()
    await element(by.id('editNameInput')).clearText()
    await element(by.id('editNameInput')).typeText('Bad Ppl')
    await element(by.id('editDescriptionInput')).clearText()
    await element(by.id('editDescriptionInput')).typeText('They bad')
    await element(by.id('saveBtn')).tap()
    await expect(element(by.id('createOrEditListModal'))).not.toBeVisible()
    await expect(element(by.id('headerTitle'))).toHaveText('Bad Ppl')
    await expect(element(by.id('listDescription'))).toHaveText('They bad')
    // have to wait for the toast to clear
    await waitFor(element(by.id('headerDropdownBtn')))
      .toBeVisible()
      .withTimeout(5000)
  })

  it('Remove description via the edit modlist modal', async () => {
    await element(by.id('headerDropdownBtn')).tap()
    await element(by.text('Edit list details')).tap()
    await expect(element(by.id('createOrEditListModal'))).toBeVisible()
    await element(by.id('editDescriptionInput')).clearText()
    await element(by.id('saveBtn')).tap()
    await expect(element(by.id('createOrEditListModal'))).not.toBeVisible()
    await expect(element(by.id('listDescription'))).not.toBeVisible()
    // have to wait for the toast to clear
    await waitFor(element(by.id('headerDropdownBtn')))
      .toBeVisible()
      .withTimeout(5000)
  })

  // DISABLED e2e environment is real finicky about avatar uploads -prf
  // it('Set avi via the edit modlist modal', async () => {
  //   await expect(element(by.id('userAvatarFallback'))).toExist()
  //   await element(by.id('headerDropdownBtn')).tap()
  //   await element(by.text('Edit list details')).tap()
  //   await expect(element(by.id('createOrEditListModal'))).toBeVisible()
  //   await element(by.id('changeAvatarBtn')).tap()
  //   await element(by.text('Library')).tap()
  //   await sleep(3e3)
  //   await element(by.id('saveBtn')).tap()
  //   await expect(element(by.id('createOrEditListModal'))).not.toBeVisible()
  //   await expect(element(by.id('userAvatarImage'))).toExist()
  //   // have to wait for the toast to clear
  //   await waitFor(element(by.id('headerDropdownBtn')))
  //     .toBeVisible()
  //     .withTimeout(5000)
  // })

  // it('Remove avi via the edit modlist modal', async () => {
  //   await expect(element(by.id('userAvatarImage'))).toExist()
  //   await element(by.id('headerDropdownBtn')).tap()
  //   await element(by.text('Edit list details')).tap()
  //   await expect(element(by.id('createOrEditListModal'))).toBeVisible()
  //   await element(by.id('changeAvatarBtn')).tap()
  //   await element(by.text('Remove')).tap()
  //   await element(by.id('saveBtn')).tap()
  //   await expect(element(by.id('createOrEditListModal'))).not.toBeVisible()
  //   await expect(element(by.id('userAvatarFallback'))).toExist()
  //   // have to wait for the toast to clear
  //   await waitFor(element(by.id('headerDropdownBtn')))
  //     .toBeVisible()
  //     .withTimeout(5000)
  // })

  it('Delete the modlist', async () => {
    await element(by.id('headerDropdownBtn')).tap()
    await element(by.text('Delete List')).tap()
    await element(by.id('confirmBtn')).tap()
    await expect(element(by.id('listsEmpty'))).toBeVisible()
  })

  it('Create a new modlist', async () => {
    await element(by.id('newModListBtn')).tap()
    await expect(element(by.id('createOrEditListModal'))).toBeVisible()
    await element(by.id('editNameInput')).typeText('Bad Ppl')
    await element(by.id('editDescriptionInput')).typeText('They bad')
    await element(by.id('saveBtn')).tap()
    await expect(element(by.id('createOrEditListModal'))).not.toBeVisible()
    await expect(element(by.id('headerTitle'))).toHaveText('Bad Ppl')
    await expect(element(by.id('listDescription'))).toHaveText('They bad')
  })

  it('Adds and removes users on modlists from the list', async () => {
    await element(by.id('addUserBtn')).tap()
    await expect(element(by.id('listAddUserModal'))).toBeVisible()
    await waitFor(element(by.id('user-warn-posts.test-addBtn')))
      .toBeVisible()
      .withTimeout(5000)
    await element(by.id('user-warn-posts.test-addBtn')).tap()
    await element(by.id('doneBtn')).tap()
    await expect(element(by.id('listAddUserModal'))).not.toBeVisible()
    await element(by.id('listItems-flatlist')).swipe(
      'down',
      'slow',
      1,
      0.5,
      0.5,
    )
    await expect(element(by.id('user-warn-posts.test'))).toBeVisible()
    await element(by.id('user-warn-posts.test-editBtn')).tap()
    await expect(element(by.id('userAddRemoveListsModal'))).toBeVisible()
    await element(by.id('user-warn-posts.test-addBtn')).tap()
    await element(by.id('doneBtn')).tap()
    await expect(element(by.id('userAddRemoveListsModal'))).not.toBeVisible()
  })

  it('Shows the modlist on my profile', async () => {
    await element(by.id('bottomBarProfileBtn')).tap()
    await element(by.id('profilePager-selector')).swipe('left')
    await element(by.id('profilePager-selector-5')).tap()
    await element(by.id('list-Bad Ppl')).tap()
  })

  it('Adds and removes users on modlists from the profile', async () => {
    await element(by.id('bottomBarSearchBtn')).tap()
    await element(by.id('searchTextInput')).typeText('bob')
    await element(by.id('searchAutoCompleteResult-bob.test')).tap()
    await expect(element(by.id('profileView'))).toBeVisible()

    await element(by.id('profileHeaderDropdownBtn')).tap()
    await element(by.text('Add to Lists')).tap()
    await expect(element(by.id('userAddRemoveListsModal'))).toBeVisible()
    await element(by.id('user-bob.test-addBtn')).tap()
    await element(by.id('doneBtn')).tap()
    await expect(element(by.id('userAddRemoveListsModal'))).not.toBeVisible()

    await element(by.id('profileHeaderDropdownBtn')).tap()
    await element(by.text('Add to Lists')).tap()
    await expect(element(by.id('userAddRemoveListsModal'))).toBeVisible()
    await element(by.id('user-bob.test-addBtn')).tap()
    await element(by.id('doneBtn')).tap()
    await expect(element(by.id('userAddRemoveListsModal'))).not.toBeVisible()
  })

  it('Can report a mute list', async () => {
    await element(by.id('e2eGotoSettings')).tap()
    await element(by.id('signOutBtn')).tap()
    await loginAsBob()
    await element(by.id('bottomBarSearchBtn')).tap()
    await element(by.id('searchTextInput')).typeText('alice')
    await element(by.id('searchAutoCompleteResult-alice.test')).tap()
    await element(by.id('profilePager-selector')).swipe('left')
    await element(by.id('profilePager-selector-3')).tap()
    await element(by.id('list-Bad Ppl')).tap()
    await element(by.id('headerDropdownBtn')).tap()
    await element(by.text('Report List')).tap()
    await expect(element(by.id('reportModal'))).toBeVisible()
    await expect(element(by.text('Report List'))).toBeVisible()
    await element(
      by.id('reportReasonRadios-com.atproto.moderation.defs#reasonRude'),
    ).tap()
    await element(by.id('sendReportBtn')).tap()
    await expect(element(by.id('reportModal'))).not.toBeVisible()
  })
})
