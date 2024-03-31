/* eslint-env detox/detox */

import {beforeAll, describe, it} from '@jest/globals'
import {expect} from 'detox'

import {createServer, loginAsAlice, loginAsBob, openApp, sleep} from '../util'

describe('Curate lists', () => {
  beforeAll(async () => {
    await createServer('?users&follows&posts')
    await openApp({
      permissions: {notifications: 'YES', medialibrary: 'YES', photos: 'YES'},
    })
  })

  it('Login and create a curatelists', async () => {
    await loginAsAlice()
    await element(by.id('e2eGotoLists')).tap()
    await element(by.id('newUserListBtn')).tap()
    await expect(element(by.id('createOrEditListModal'))).toBeVisible()
    await element(by.id('editNameInput')).typeText('Good Ppl')
    await element(by.id('editDescriptionInput')).typeText('They good')
    await element(by.id('saveBtn')).tap()
    await expect(element(by.id('createOrEditListModal'))).not.toBeVisible()
    await element(by.text('About')).tap()
    await expect(element(by.id('headerTitle'))).toHaveText('Good Ppl')
    await expect(element(by.id('listDescription'))).toHaveText('They good')
  })

  it('Edit display name and description via the edit curatelist modal', async () => {
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

  it('Remove description via the edit curatelist modal', async () => {
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

  it('Set avi via the edit curatelist modal', async () => {
    await expect(element(by.id('userAvatarFallback'))).toExist()
    await element(by.id('headerDropdownBtn')).tap()
    await element(by.text('Edit list details')).tap()
    await expect(element(by.id('createOrEditListModal'))).toBeVisible()
    await element(by.id('changeAvatarBtn')).tap()
    await element(by.text('Upload from Library')).tap()
    await sleep(3e3)
    await element(by.id('saveBtn')).tap()
    await expect(element(by.id('createOrEditListModal'))).not.toBeVisible()
    await expect(element(by.id('userAvatarImage'))).toExist()
    // have to wait for the toast to clear
    await waitFor(element(by.id('headerDropdownBtn')))
      .toBeVisible()
      .withTimeout(5000)
  })

  it('Remove avi via the edit curatelist modal', async () => {
    await expect(element(by.id('userAvatarImage'))).toExist()
    await element(by.id('headerDropdownBtn')).tap()
    await element(by.text('Edit list details')).tap()
    await expect(element(by.id('createOrEditListModal'))).toBeVisible()
    await element(by.id('changeAvatarBtn')).tap()
    await element(by.text('Remove Avatar')).tap()
    await element(by.id('saveBtn')).tap()
    await expect(element(by.id('createOrEditListModal'))).not.toBeVisible()
    await expect(element(by.id('userAvatarFallback'))).toExist()
    // have to wait for the toast to clear
    await waitFor(element(by.id('headerDropdownBtn')))
      .toBeVisible()
      .withTimeout(5000)
  })

  it('Delete the curatelist', async () => {
    await element(by.id('headerDropdownBtn')).tap()
    await element(by.text('Delete List')).tap()
    await element(by.id('confirmBtn')).tap()
    await expect(element(by.id('listsEmpty'))).toBeVisible()
  })

  it('Create a new curatelist', async () => {
    await element(by.id('e2eGotoLists')).tap()
    await element(by.id('newUserListBtn')).tap()
    await expect(element(by.id('createOrEditListModal'))).toBeVisible()
    await element(by.id('editNameInput')).typeText('Good Ppl')
    await element(by.id('editDescriptionInput')).typeText('They good')
    await element(by.id('saveBtn')).tap()
    await expect(element(by.id('createOrEditListModal'))).not.toBeVisible()
    await element(by.text('About')).tap()
    await expect(element(by.id('headerTitle'))).toHaveText('Good Ppl')
    await expect(element(by.id('listDescription'))).toHaveText('They good')
  })

  it('Adds users on curatelists from the list', async () => {
    await element(by.text('About')).tap()
    await element(by.id('addUserBtn')).tap()
    await expect(element(by.id('listAddUserModal'))).toBeVisible()
    await waitFor(element(by.id('user-bob.test-addBtn')))
      .toBeVisible()
      .withTimeout(5000)
    await element(by.id('user-bob.test-addBtn')).tap()
    await element(by.id('doneBtn')).tap()
    await expect(element(by.id('listAddUserModal'))).not.toBeVisible()
    await expect(element(by.id('user-bob.test'))).toBeVisible()
  })

  it('Shows posts by the users in the list', async () => {
    await element(by.text('Posts')).tap()
    await expect(element(by.id('feedItem-by-bob.test'))).toBeVisible()
  })

  it('Pins the list', async () => {
    await expect(element(by.id('pinBtn'))).toBeVisible()
    await element(by.id('pinBtn')).tap()
    await element(by.id('e2eGotoHome')).tap()
    await element(by.id('homeScreenFeedTabs-Good Ppl')).tap()
    await expect(element(by.id('feedItem-by-bob.test'))).toBeVisible()

    await element(by.id('bottomBarFeedsBtn')).tap()
    await element(by.id('saved-feed-Good Ppl')).tap()
    await expect(element(by.id('feedItem-by-bob.test'))).toBeVisible()

    await element(by.id('unpinBtn')).tap()
    await element(by.id('bottomBarHomeBtn')).tap()
    await expect(
      element(by.id('homeScreenFeedTabs-Good Ppl')),
    ).not.toBeVisible()

    await element(by.id('e2eGotoLists')).tap()
    await element(by.id('list-Good Ppl')).tap()
  })

  it('Removes users on curatelists from the list', async () => {
    await element(by.text('About')).tap()
    await expect(element(by.id('user-bob.test'))).toBeVisible()
    await element(by.id('user-bob.test-editBtn')).tap()
    await expect(element(by.id('userAddRemoveListsModal'))).toBeVisible()
    await element(by.id('user-bob.test-addBtn')).tap()
    await element(by.id('doneBtn')).tap()
    await expect(element(by.id('userAddRemoveListsModal'))).not.toBeVisible()
  })

  it('Shows the curatelist on my profile', async () => {
    await element(by.id('bottomBarProfileBtn')).tap()
    await element(by.id('profilePager-selector')).swipe('left')
    await element(by.id('profilePager-selector-5')).tap()
    await element(by.id('list-Good Ppl')).tap()
  })

  it('Adds and removes users on curatelists from the profile', async () => {
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

  it('Can report a user list', async () => {
    await element(by.id('e2eGotoSettings')).tap()
    await element(by.id('signOutBtn')).tap()
    await loginAsBob()
    await element(by.id('bottomBarSearchBtn')).tap()
    await element(by.id('searchTextInput')).typeText('alice')
    await element(by.id('searchAutoCompleteResult-alice.test')).tap()
    await element(by.id('profilePager-selector')).swipe('left')
    await element(by.id('profilePager-selector-3')).tap()
    await element(by.id('list-Good Ppl')).tap()
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
