/* eslint-env detox/detox */

import {describe, beforeAll, it} from '@jest/globals'
import {expect} from 'detox'
import {openApp, loginAsAlice, createServer, sleep} from '../util'

describe('Self-labeling', () => {
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

  it('Post an image with the porn label', async () => {
    await element(by.id('composeFAB')).tap()
    await element(by.id('composerTextInput')).typeText('Post with an image')
    await element(by.id('openGalleryBtn')).tap()
    await sleep(3e3)
    await element(by.id('labelsBtn')).tap()
    await element(by.id('pornLabelBtn')).tap()
    await element(by.id('confirmBtn')).tap()
    await element(by.id('composerPublishBtn')).tap()
    await expect(element(by.id('composeFAB'))).toBeVisible()
    const posts = by.id('feedItem-by-alice.test')
    await element(by.id('e2eRefreshHome')).tap()
    await expect(
      element(by.id('contentHider-embed').withAncestor(posts)).atIndex(0),
    ).toExist()
  })
})
