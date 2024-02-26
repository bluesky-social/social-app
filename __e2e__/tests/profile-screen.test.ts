/* eslint-env detox/detox */

import {describe, beforeAll, it} from '@jest/globals'
import {expect} from 'detox'
import {openApp, loginAsAlice, createServer, sleep} from '../util'

describe('Profile screen', () => {
  beforeAll(async () => {
    await createServer('?users&posts&feeds')
    await openApp({
      permissions: {notifications: 'YES', medialibrary: 'YES', photos: 'YES'},
    })
  })

  it('Login and navigate to my profile', async () => {
    await loginAsAlice()
    await element(by.id('bottomBarProfileBtn')).tap()
  })

  it('Can see feeds', async () => {
    await element(by.id('profilePager-selector')).swipe('left')
    await element(by.id('profilePager-selector-4')).tap()
    await expect(element(by.id('feed-alice-favs'))).toBeVisible()
    await element(by.id('profilePager-selector')).swipe('right')
    await element(by.id('profilePager-selector-0')).tap()
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
    await expect(element(by.id('profileHeaderDescription'))).not.toExist()
  })

  it('Set avi and banner via the edit profile modal', async () => {
    await expect(element(by.id('userBannerFallback'))).toExist()
    await expect(element(by.id('userAvatarFallback'))).toExist()
    await element(by.id('profileHeaderEditProfileButton')).tap()
    await expect(element(by.id('editProfileModal'))).toBeVisible()
    await element(by.id('changeBannerBtn')).tap()
    await element(by.text('Library')).tap()
    await sleep(3e3)
    await element(by.id('changeAvatarBtn')).tap()
    await element(by.text('Library')).tap()
    await sleep(3e3)
    await element(by.id('editProfileSaveBtn')).tap()
    await expect(element(by.id('editProfileModal'))).not.toBeVisible()
    await expect(element(by.id('userBannerImage'))).toExist()
    await expect(element(by.id('userAvatarImage'))).toExist()
  })

  it('Remove avi and banner via the edit profile modal', async () => {
    await expect(element(by.id('userBannerImage'))).toExist()
    await expect(element(by.id('userAvatarImage'))).toExist()
    await element(by.id('profileHeaderEditProfileButton')).tap()
    await expect(element(by.id('editProfileModal'))).toBeVisible()
    await element(by.id('changeBannerBtn')).tap()
    await element(by.text('Remove')).tap()
    await element(by.id('changeAvatarBtn')).tap()
    await element(by.text('Remove')).tap()
    await element(by.id('editProfileSaveBtn')).tap()
    await expect(element(by.id('editProfileModal'))).not.toBeVisible()
    await expect(element(by.id('userBannerFallback'))).toExist()
    await expect(element(by.id('userAvatarFallback'))).toExist()
  })

  it('Navigate to another user profile', async () => {
    await element(by.id('bottomBarSearchBtn')).tap()
    // have to wait for the toast to clear
    await waitFor(element(by.id('searchTextInput')))
      .toBeVisible()
      .withTimeout(5000)
    await element(by.id('searchTextInput')).typeText('bob')
    await element(by.id('searchAutoCompleteResult-bob.test')).tap()
    await expect(element(by.id('profileView'))).toBeVisible()
  })

  it('Can follow/unfollow another user', async () => {
    await element(by.id('followBtn')).tap()
    await expect(element(by.id('unfollowBtn'))).toBeVisible()
    await element(by.id('unfollowBtn')).tap()
    await expect(element(by.id('followBtn'))).toBeVisible()
  })

  it('Can mute/unmute another user', async () => {
    await expect(element(by.id('profileHeaderAlert'))).not.toExist()
    await element(by.id('profileHeaderDropdownBtn')).tap()
    await element(by.text('Mute Account')).tap()
    await expect(element(by.id('profileHeaderAlert'))).toBeVisible()
    await element(by.id('profileHeaderDropdownBtn')).tap()
    await element(by.text('Unmute Account')).tap()
    await expect(element(by.id('profileHeaderAlert'))).not.toExist()
  })

  it('Can report another user', async () => {
    await element(by.id('profileHeaderDropdownBtn')).tap()
    await element(by.text('Report Account')).tap()
    await expect(element(by.id('reportModal'))).toBeVisible()
    await element(
      by.id('reportReasonRadios-com.atproto.moderation.defs#reasonSpam'),
    ).tap()
    await element(by.id('sendReportBtn')).tap()
    await expect(element(by.id('reportModal'))).not.toBeVisible()
  })

  it('Can like posts', async () => {
    await element(by.id('postsFeed-flatlist')).swipe(
      'down',
      'slow',
      1,
      0.5,
      0.5,
    )

    const posts = by.id('feedItem-by-bob.test')
    await expect(
      element(by.id('likeCount').withAncestor(posts)).atIndex(0),
    ).not.toExist()
    await element(by.id('likeBtn').withAncestor(posts)).atIndex(0).tap()
    await expect(
      element(by.id('likeCount').withAncestor(posts)).atIndex(0),
    ).toHaveText('1')
    await element(by.id('likeBtn').withAncestor(posts)).atIndex(0).tap()
    await expect(
      element(by.id('likeCount').withAncestor(posts)).atIndex(0),
    ).not.toExist()
  })

  it('Can repost posts', async () => {
    const posts = by.id('feedItem-by-bob.test')
    await expect(
      element(by.id('repostCount').withAncestor(posts)).atIndex(0),
    ).not.toExist()
    await element(by.id('repostBtn').withAncestor(posts)).atIndex(0).tap()
    await expect(element(by.id('repostModal'))).toBeVisible()
    await element(by.id('repostBtn').withAncestor(by.id('repostModal'))).tap()
    await expect(element(by.id('repostModal'))).not.toBeVisible()
    await expect(
      element(by.id('repostCount').withAncestor(posts)).atIndex(0),
    ).toHaveText('1')
    await element(by.id('repostBtn').withAncestor(posts)).atIndex(0).tap()
    await expect(element(by.id('repostModal'))).toBeVisible()
    await element(by.id('repostBtn').withAncestor(by.id('repostModal'))).tap()
    await expect(element(by.id('repostModal'))).not.toBeVisible()
    await expect(
      element(by.id('repostCount').withAncestor(posts)).atIndex(0),
    ).not.toExist()
  })

  it('Can report posts', async () => {
    const posts = by.id('feedItem-by-bob.test')
    await element(by.id('postDropdownBtn').withAncestor(posts)).atIndex(0).tap()
    await element(by.text('Report post')).tap()
    await expect(element(by.id('reportModal'))).toBeVisible()
    await element(
      by.id('reportReasonRadios-com.atproto.moderation.defs#reasonSpam'),
    ).tap()
    await element(by.id('sendReportBtn')).tap()
    await expect(element(by.id('reportModal'))).not.toBeVisible()
  })
})
