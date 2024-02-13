/* eslint-env detox/detox */

import {describe, beforeAll, it} from '@jest/globals'
import {expect} from 'detox'
import {openApp, loginAsAlice, createServer} from '../util'

describe('Thread screen', () => {
  beforeAll(async () => {
    await createServer('?users&follows&thread')
    await openApp({permissions: {notifications: 'YES'}})
  })

  it('Login & navigate to thread', async () => {
    await loginAsAlice()
    await element(by.id('homeScreenFeedTabs-Following')).tap()
    await element(by.id('feedItem-by-bob.test')).atIndex(0).tap()
    await expect(
      element(
        by
          .id('postThreadItem-by-bob.test')
          .withDescendant(by.text('Thread root')),
      ),
    ).toBeVisible()
    await expect(
      element(
        by
          .id('postThreadItem-by-carla.test')
          .withDescendant(by.text('Thread reply')),
      ),
    ).toBeVisible()
  })

  it('Can like the root post', async () => {
    const post = by.id('postThreadItem-by-bob.test')
    await expect(
      element(by.id('likeCount-expanded').withAncestor(post)).atIndex(0),
    ).not.toExist()
    await element(by.id('likeBtn').withAncestor(post)).atIndex(0).tap()
    await expect(
      element(by.id('likeCount-expanded').withAncestor(post)).atIndex(0),
    ).toHaveText('1 like')
    await element(by.id('likeBtn').withAncestor(post)).atIndex(0).tap()
    await expect(
      element(by.id('likeCount-expanded').withAncestor(post)).atIndex(0),
    ).not.toExist()
  })

  it('Can like a reply post', async () => {
    const post = by.id('postThreadItem-by-carla.test')
    await expect(
      element(by.id('likeCount').withAncestor(post)).atIndex(0),
    ).not.toExist()
    await element(by.id('likeBtn').withAncestor(post)).atIndex(0).tap()
    await expect(
      element(by.id('likeCount').withAncestor(post)).atIndex(0),
    ).toHaveText('1')
    await element(by.id('likeBtn').withAncestor(post)).atIndex(0).tap()
    await expect(
      element(by.id('likeCount').withAncestor(post)).atIndex(0),
    ).not.toExist()
  })

  it('Can repost the root post', async () => {
    const post = by.id('postThreadItem-by-bob.test')
    await expect(
      element(by.id('repostCount-expanded').withAncestor(post)).atIndex(0),
    ).not.toExist()
    await element(by.id('repostBtn').withAncestor(post)).atIndex(0).tap()
    await expect(element(by.id('repostModal'))).toBeVisible()
    await element(by.id('repostBtn').withAncestor(by.id('repostModal'))).tap()
    await expect(element(by.id('repostModal'))).not.toBeVisible()
    await expect(
      element(by.id('repostCount-expanded').withAncestor(post)).atIndex(0),
    ).toHaveText('1 repost')
    await element(by.id('repostBtn').withAncestor(post)).atIndex(0).tap()
    await expect(element(by.id('repostModal'))).toBeVisible()
    await element(by.id('repostBtn').withAncestor(by.id('repostModal'))).tap()
    await expect(element(by.id('repostModal'))).not.toBeVisible()
    await expect(
      element(by.id('repostCount-expanded').withAncestor(post)).atIndex(0),
    ).not.toExist()
  })

  it('Can repost a reply post', async () => {
    const post = by.id('postThreadItem-by-carla.test')
    await expect(
      element(by.id('repostCount').withAncestor(post)).atIndex(0),
    ).not.toExist()
    await element(by.id('repostBtn').withAncestor(post)).atIndex(0).tap()
    await expect(element(by.id('repostModal'))).toBeVisible()
    await element(by.id('repostBtn').withAncestor(by.id('repostModal'))).tap()
    await expect(element(by.id('repostModal'))).not.toBeVisible()
    await expect(
      element(by.id('repostCount').withAncestor(post)).atIndex(0),
    ).toHaveText('1')
    await element(by.id('repostBtn').withAncestor(post)).atIndex(0).tap()
    await expect(element(by.id('repostModal'))).toBeVisible()
    await element(by.id('repostBtn').withAncestor(by.id('repostModal'))).tap()
    await expect(element(by.id('repostModal'))).not.toBeVisible()
    await expect(
      element(by.id('repostCount').withAncestor(post)).atIndex(0),
    ).not.toExist()
  })

  it('Can report the root post', async () => {
    const post = by.id('postThreadItem-by-bob.test')
    await element(by.id('postDropdownBtn').withAncestor(post)).atIndex(0).tap()
    await element(by.text('Report post')).tap()
    await expect(element(by.id('reportModal'))).toBeVisible()
    await element(
      by.id('reportReasonRadios-com.atproto.moderation.defs#reasonSpam'),
    ).tap()
    await element(by.id('sendReportBtn')).tap()
    await expect(element(by.id('reportModal'))).not.toBeVisible()
  })

  it('Can report a reply post', async () => {
    const post = by.id('postThreadItem-by-carla.test')
    await element(by.id('postDropdownBtn').withAncestor(post)).atIndex(0).tap()
    await element(by.text('Report post')).tap()
    await expect(element(by.id('reportModal'))).toBeVisible()
    await element(
      by.id('reportReasonRadios-com.atproto.moderation.defs#reasonSpam'),
    ).tap()
    await element(by.id('sendReportBtn')).tap()
    await expect(element(by.id('reportModal'))).not.toBeVisible()
  })
})
