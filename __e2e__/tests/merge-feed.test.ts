/* eslint-env detox/detox */

import {openApp, loginAsAlice, createServer} from '../util'

describe('Mergefeed', () => {
  beforeAll(async () => {
    await createServer('?mergefeed')
    await openApp({permissions: {notifications: 'YES'}})
  })

  it('Login', async () => {
    await loginAsAlice()
    await element(by.id('e2eToggleMergefeed')).tap()
  })

  it('Sees the expected mix of posts with default filters', async () => {
    await element(by.id('followingFeedPage-feed-flatlist')).swipe(
      'down',
      'slow',
      1,
      0.5,
      0.5,
    )
    // followed users
    await expect(
      element(
        by.id('postText').withAncestor(by.id('feedItem-by-carla.test')),
      ).atIndex(0),
    ).toHaveText('Post 9')
    await expect(
      element(
        by.id('postText').withAncestor(by.id('feedItem-by-bob.test')),
      ).atIndex(0),
    ).toHaveText('Post 9')
    await element(by.id('followingFeedPage-feed-flatlist')).swipe(
      'up',
      'fast',
      1,
      0.5,
      0.5,
    )
    // feed users
    await expect(
      element(
        by.id('postText').withAncestor(by.id('feedItem-by-dan.test')),
      ).atIndex(0),
    ).toHaveText('Post 0')
  })

  it('Sees the expected mix of posts with replies disabled', async () => {
    await element(by.id('followingFeedPage-feed-flatlist')).swipe(
      'down',
      'fast',
      1,
      0.5,
      0.5,
    )
    await element(by.id('followingFeedPage-feed-flatlist')).swipe(
      'down',
      'fast',
      1,
      0.5,
      0.5,
    )
    await element(by.id('viewHeaderHomeFeedPrefsBtn')).tap()
    await element(by.id('toggleRepliesBtn')).tap()
    await element(by.id('confirmBtn')).tap()
    await element(by.id('followingFeedPage-feed-flatlist')).swipe(
      'down',
      'slow',
      1,
      0.5,
      0.5,
    )

    // followed users
    await expect(
      element(
        by.id('postText').withAncestor(by.id('feedItem-by-carla.test')),
      ).atIndex(0),
    ).toHaveText('Post 9')
    await expect(
      element(
        by.id('postText').withAncestor(by.id('feedItem-by-bob.test')),
      ).atIndex(0),
    ).toHaveText('Post 9')
    await element(by.id('followingFeedPage-feed-flatlist')).swipe(
      'up',
      'fast',
      1,
      0.5,
      0.5,
    )

    // feed users
    await expect(
      element(
        by.id('postText').withAncestor(by.id('feedItem-by-dan.test')),
      ).atIndex(0),
    ).toHaveText('Post 0')
  })

  it('Sees the expected mix of posts with no follows', async () => {
    await element(by.id('followingFeedPage-feed-flatlist')).swipe(
      'down',
      'fast',
      1,
      0.5,
      0.5,
    )

    await element(by.id('bottomBarSearchBtn')).tap()
    await element(by.id('searchTextInput')).typeText('bob')
    await element(by.id('searchAutoCompleteResult-bob.test')).tap()
    await expect(element(by.id('profileView'))).toBeVisible()
    await element(by.id('unfollowBtn')).tap()
    await element(by.id('profileHeaderBackBtn')).tap()

    // have to wait for the toast to clear
    await waitFor(element(by.id('searchTextInputClearBtn')))
      .toBeVisible()
      .withTimeout(5000)
    await element(by.id('searchTextInputClearBtn')).tap()
    await element(by.id('searchTextInput')).typeText('carla')
    await element(by.id('searchAutoCompleteResult-carla.test')).tap()
    await expect(element(by.id('profileView'))).toBeVisible()
    await element(by.id('unfollowBtn')).tap()
    await element(by.id('profileHeaderBackBtn')).tap()

    await element(by.id('bottomBarHomeBtn')).tap()
    await element(by.id('followingFeedPage-feed-flatlist')).swipe(
      'down',
      'slow',
      1,
      0.5,
      0.5,
    )
    await element(by.id('followingFeedPage-feed-flatlist')).swipe(
      'down',
      'slow',
      1,
      0.5,
      0.5,
    )

    // followed users NOT present
    await expect(element(by.id('feedItem-by-carla.test'))).not.toExist()
    await expect(element(by.id('feedItem-by-bob.test'))).not.toExist()

    // feed users
    await expect(
      element(
        by.id('postText').withAncestor(by.id('feedItem-by-dan.test')),
      ).atIndex(0),
    ).toHaveText('Post 0')
  })
})
