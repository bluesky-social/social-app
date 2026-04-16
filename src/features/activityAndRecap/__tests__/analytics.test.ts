import {describe, expect, test} from '@jest/globals'

import {
  recapCardDismissed,
  recapCardShown,
  recapCardTapped,
  recapOptIn,
  recapOptOut,
  streakExplainerOpened,
  streakIndicatorShown,
  streakOptIn,
  streakOptOut,
} from '#/features/activityAndRecap/analytics/events'

describe('analytics events (AC-B12)', () => {
  test('streakIndicatorShown carries only has_streak boolean', () => {
    const [name, payload] = streakIndicatorShown(true)
    expect(name).toBe('streak:indicatorShown')
    expect(payload).toEqual({has_streak: true})
  })

  test('streak:explainerOpened / optIn / optOut have empty payloads', () => {
    expect(streakExplainerOpened()).toEqual(['streak:explainerOpened', {}])
    expect(streakOptIn()).toEqual(['streak:optIn', {}])
    expect(streakOptOut()).toEqual(['streak:optOut', {}])
  })

  test('recap:cardShown carries ONLY booleans, no metric values (B12)', () => {
    const [name, payload] = recapCardShown({
      postsCount: 3,
      followerDelta: 10,
      topPost: {uri: 'at://x', cid: 'bafy'},
    })
    expect(name).toBe('recap:cardShown')
    expect(payload).toEqual({
      has_posts: true,
      has_top_post: true,
      has_follower_delta: true,
    })
    // Booleans only — never leak the raw counts.
    expect(Object.values(payload).every(v => typeof v === 'boolean')).toBe(true)
    expect(payload).not.toHaveProperty('postsCount')
    expect(payload).not.toHaveProperty('followerDelta')
    expect(payload).not.toHaveProperty('topPost')
  })

  test('recap:cardShown flags false when zeros / null', () => {
    const [, payload] = recapCardShown({
      postsCount: 0,
      followerDelta: 0,
      topPost: null,
    })
    expect(payload).toEqual({
      has_posts: false,
      has_top_post: false,
      has_follower_delta: false,
    })
  })

  test('recap:cardTapped / cardDismissed / optIn / optOut have empty payloads', () => {
    expect(recapCardTapped()).toEqual(['recap:cardTapped', {}])
    expect(recapCardDismissed()).toEqual(['recap:cardDismissed', {}])
    expect(recapOptIn()).toEqual(['recap:optIn', {}])
    expect(recapOptOut()).toEqual(['recap:optOut', {}])
  })
})
