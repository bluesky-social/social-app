/* eslint-env detox/detox */

import {beforeAll, describe, it} from '@jest/globals'
import {expect} from 'detox'

import {createServer, loginAsAlice, openApp} from '../util'

describe('Home screen', () => {
  beforeAll(async () => {
    await createServer('?users&follows&posts&feeds')
    await openApp({permissions: {notifications: 'YES'}})
  })

  it('Login', async () => {
    await loginAsAlice()
    await element(by.id('homeScreenFeedTabs-Following')).tap()
  })

  it('Can go to feeds page using feeds button in tab bar', async () => {
    await element(by.id('homeScreenFeedTabs-Feeds ✨')).tap()
    await expect(element(by.text('Discover New Feeds'))).toBeVisible()
  })

  it('Feeds button disappears after pinning a feed', async () => {
    await element(by.id('bottomBarProfileBtn')).tap()
    await element(by.id('profilePager-selector')).swipe('left')
    await element(by.id('profilePager-selector-4')).tap()
    await element(by.id('feed-alice-favs')).tap()
    await element(by.id('pinBtn')).tap()
    await element(by.id('bottomBarHomeBtn')).tap()
    await expect(
      element(by.id('homeScreenFeedTabs-Feeds ✨')),
    ).not.toBeVisible()
  })

  it('Can like posts', async () => {
    const carlaPosts = by.id('feedItem-by-carla.test')
    await expect(
      element(by.id('likeCount').withAncestor(carlaPosts)).atIndex(0),
    ).not.toExist()
    await element(by.id('likeBtn').withAncestor(carlaPosts)).atIndex(0).tap()
    await expect(
      element(by.id('likeCount').withAncestor(carlaPosts)).atIndex(0),
    ).toHaveText('1')
    await element(by.id('likeBtn').withAncestor(carlaPosts)).atIndex(0).tap()
    await expect(
      element(by.id('likeCount').withAncestor(carlaPosts)).atIndex(0),
    ).not.toExist()
  })

  it('Can repost posts', async () => {
    const carlaPosts = by.id('feedItem-by-carla.test')
    await expect(
      element(by.id('repostCount').withAncestor(carlaPosts)).atIndex(0),
    ).not.toExist()
    await element(by.id('repostBtn').withAncestor(carlaPosts)).atIndex(0).tap()
    await expect(element(by.id('repostModal'))).toBeVisible()
    await element(by.id('repostBtn').withAncestor(by.id('repostModal'))).tap()
    await expect(element(by.id('repostModal'))).not.toBeVisible()
    await expect(
      element(by.id('repostCount').withAncestor(carlaPosts)).atIndex(0),
    ).toHaveText('1')
    await element(by.id('repostBtn').withAncestor(carlaPosts)).atIndex(0).tap()
    await expect(element(by.id('repostModal'))).toBeVisible()
    await element(by.id('repostBtn').withAncestor(by.id('repostModal'))).tap()
    await expect(element(by.id('repostModal'))).not.toBeVisible()
    await expect(
      element(by.id('repostCount').withAncestor(carlaPosts)).atIndex(0),
    ).not.toExist()
  })

  it('Can report posts', async () => {
    const carlaPosts = by.id('feedItem-by-carla.test')
    await element(by.id('postDropdownBtn').withAncestor(carlaPosts))
      .atIndex(0)
      .tap()
    await element(by.text('Report post')).tap()
    await expect(element(by.id('reportModal'))).toBeVisible()
    await element(
      by.id('reportReasonRadios-com.atproto.moderation.defs#reasonSpam'),
    ).tap()
    await element(by.id('sendReportBtn')).tap()
    await expect(element(by.id('reportModal'))).not.toBeVisible()
  })

  it('Can swipe between feeds', async () => {
    await element(by.id('homeScreen')).swipe('left', 'fast', 0.75)
    await expect(element(by.id('customFeedPage'))).toBeVisible()
    await element(by.id('homeScreen')).swipe('right', 'fast', 0.75)
    await expect(element(by.id('followingFeedPage'))).toBeVisible()
  })

  it('Can tap between feeds', async () => {
    await element(by.id('homeScreenFeedTabs-alice-favs')).tap()
    await expect(element(by.id('customFeedPage'))).toBeVisible()
    await element(by.id('homeScreenFeedTabs-Following')).tap()
    await expect(element(by.id('followingFeedPage'))).toBeVisible()
  })

  it('Can delete posts', async () => {
    const alicePosts = by.id('feedItem-by-alice.test')
    await expect(element(alicePosts.withDescendant(by.text('Post')))).toExist()
    await element(by.id('postDropdownBtn').withAncestor(alicePosts))
      .atIndex(0)
      .tap()
    await element(by.text('Delete post')).tap()
    await expect(element(by.id('confirmModal'))).toBeVisible()
    await element(by.id('confirmBtn')).tap()
    await expect(
      element(alicePosts.withDescendant(by.text('Post'))),
    ).not.toExist()
  })
})
