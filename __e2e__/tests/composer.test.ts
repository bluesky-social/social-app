/* eslint-env detox/detox */

import {beforeAll, describe, it} from '@jest/globals'
import {expect} from 'detox'

import {createServer, loginAsAlice, openApp, sleep} from '../util'

describe('Composer', () => {
  beforeAll(async () => {
    await createServer('?users')
    await openApp({
      permissions: {notifications: 'YES', medialibrary: 'YES', photos: 'YES'},
    })
  })

  it('Login', async () => {
    await loginAsAlice()
    await element(by.id('homeScreenFeedTabs-Following')).tap()
  })

  it('Post text only', async () => {
    await element(by.id('composeFAB')).tap()
    await device.takeScreenshot('1- opened composer')
    await element(by.id('composerTextInput')).typeText('Post text only')
    await device.takeScreenshot('2- entered text')
    await element(by.id('composerPublishBtn')).tap()
    await device.takeScreenshot('3- opened general section')
    await expect(element(by.id('composeFAB'))).toBeVisible()
  })

  it('Post with an image', async () => {
    await element(by.id('composeFAB')).tap()
    await element(by.id('composerTextInput')).typeText('Post with an image')
    await element(by.id('openGalleryBtn')).tap()
    await sleep(1e3)
    await element(by.id('composerPublishBtn')).tap()
    await expect(element(by.id('composeFAB'))).toBeVisible()
  })

  it('Post with a link card', async () => {
    await element(by.id('composeFAB')).tap()
    await element(by.id('composerTextInput')).typeText(
      'Post with a https://example.com link card',
    )
    await element(by.id('composerPublishBtn')).tap()
    await expect(element(by.id('composeFAB'))).toBeVisible()
  })

  it('Reply text only', async () => {
    await element(by.id('e2eRefreshHome')).tap()

    const post = by.id('feedItem-by-alice.test')
    await element(by.id('replyBtn').withAncestor(post)).atIndex(0).tap()
    await element(by.id('composerTextInput')).typeText('Reply text only')
    await element(by.id('composerPublishBtn')).tap()
    await expect(element(by.id('composeFAB'))).toBeVisible()
  })

  it('Reply with an image', async () => {
    const post = by.id('feedItem-by-alice.test')
    await element(by.id('replyBtn').withAncestor(post)).atIndex(0).tap()
    await element(by.id('composerTextInput')).typeText('Reply with an image')
    await element(by.id('openGalleryBtn')).tap()
    await sleep(1e3)
    await element(by.id('composerPublishBtn')).tap()
    await expect(element(by.id('composeFAB'))).toBeVisible()
  })

  it('Reply with a link card', async () => {
    const post = by.id('feedItem-by-alice.test')
    await element(by.id('replyBtn').withAncestor(post)).atIndex(0).tap()
    await element(by.id('composerTextInput')).typeText(
      'Reply with a https://example.com link card',
    )
    await element(by.id('composerPublishBtn')).tap()
    await expect(element(by.id('composeFAB'))).toBeVisible()
  })

  it('QP text only', async () => {
    const post = by.id('feedItem-by-alice.test')
    await element(by.id('repostBtn').withAncestor(post)).atIndex(0).tap()
    await element(by.id('quoteBtn').withAncestor(by.id('repostModal'))).tap()
    await element(by.id('composerTextInput')).typeText('QP text only')
    await element(by.id('composerPublishBtn')).tap()
    await expect(element(by.id('composeFAB'))).toBeVisible()
  })

  it('QP with an image', async () => {
    const post = by.id('feedItem-by-alice.test')
    await element(by.id('repostBtn').withAncestor(post)).atIndex(0).tap()
    await element(by.id('quoteBtn').withAncestor(by.id('repostModal'))).tap()
    await element(by.id('composerTextInput')).typeText('QP with an image')
    await element(by.id('openGalleryBtn')).tap()
    await sleep(1e3)
    await element(by.id('composerPublishBtn')).tap()
    await expect(element(by.id('composeFAB'))).toBeVisible()
  })

  it('QP with a link card', async () => {
    const post = by.id('feedItem-by-alice.test')
    await element(by.id('repostBtn').withAncestor(post)).atIndex(0).tap()
    await element(by.id('quoteBtn').withAncestor(by.id('repostModal'))).tap()
    await element(by.id('composerTextInput')).typeText(
      'QP with a https://example.com link card',
    )
    await element(by.id('composerPublishBtn')).tap()
    await expect(element(by.id('composeFAB'))).toBeVisible()
  })
})
