import {type AnalyticsContextType} from '#/analytics'
import {isFollowingRestorationEnabled} from './eligibility'

function analytics(isEnabled: boolean) {
  return {
    features: {
      FollowingV2Enable: 'following_v2:enable',
      enabled: () => isEnabled,
    },
  } as unknown as Pick<AnalyticsContextType, 'features'>
}

/** As `RQKEY` builds them. */
function feedKey(feedDesc: string, params: object = {}) {
  return ['post-feed', feedDesc, params]
}

const HOME_FOLLOWING = feedKey('following', {
  mergeFeedEnabled: false,
  mergeFeedSources: [],
})

describe('isFollowingRestorationEnabled', () => {
  it('is enabled for Home Following with Following v2', () => {
    expect(isFollowingRestorationEnabled(analytics(true), HOME_FOLLOWING)).toBe(
      true,
    )
  })

  it('is not enabled without Following v2', () => {
    expect(
      isFollowingRestorationEnabled(analytics(false), HOME_FOLLOWING),
    ).toBe(false)
  })

  it('is never enabled for another feed', () => {
    const ax = analytics(true)
    for (const queryKey of [
      // For You and Discover.
      feedKey(
        'feedgen|at://did:plc:3guzzweuqraryl3rdkimjamk/app.bsky.feed.generator/for-you',
      ),
      feedKey(
        'feedgen|at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot',
        {feedCacheKey: 'discover'},
      ),
      feedKey('list|at://did:plc:owner/app.bsky.graph.list/list'),
      feedKey('author|did:plc:author|posts_and_author_threads'),
      // Following merged with other feeds, or with other params.
      feedKey('following', {
        mergeFeedEnabled: true,
        mergeFeedSources: ['at://did:plc:owner/app.bsky.feed.generator/feed'],
      }),
      feedKey('following'),
    ]) {
      expect(isFollowingRestorationEnabled(ax, queryKey)).toBe(false)
    }
  })
})
