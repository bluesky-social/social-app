/* eslint-env detox/detox */

import {openApp, loginAsAlice, createServer} from '../util'

describe('Home screen', () => {
  beforeAll(async () => {
    await createServer('?users&follows&posts')
    await openApp({permissions: {notifications: 'YES'}})
  })

  it('Login', async () => {
    await loginAsAlice()
    await element(by.id('homeScreenFeedTabs-Following')).tap()
    await element(by.id('e2eToggleMergefeed')).tap()
  })

  it('Can like posts', async () => {
    const carlaPosts = by.id('feedItem-by-carla.test')
    await expect(
      element(by.id('likeCount').withAncestor(carlaPosts)).atIndex(0),
    ).toHaveText('0')
    await element(by.id('likeBtn').withAncestor(carlaPosts)).atIndex(0).tap()
    await expect(
      element(by.id('likeCount').withAncestor(carlaPosts)).atIndex(0),
    ).toHaveText('1')
    await element(by.id('likeBtn').withAncestor(carlaPosts)).atIndex(0).tap()
    await expect(
      element(by.id('likeCount').withAncestor(carlaPosts)).atIndex(0),
    ).toHaveText('0')
  })
})
