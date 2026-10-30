import {describe, expect, it} from '@jest/globals'

import {type ActivityGroupRowItem, type ActivityRowItem} from './model'
import {
  buildActivityPresentationListItems,
  getRecordActor,
} from './presentation'
import {
  type ActivityActor,
  activityCollections,
  type ActivityItem,
} from './types'

function activity(
  uri: ActivityItem['record']['uri'],
  collection: ActivityItem['collection'] = activityCollections.document,
  subscribed = false,
): ActivityItem {
  return {
    $type: 'app.bsky.unspecced.getAtmosphereTimeline#activityItem' as const,
    record: {
      uri,
      cid: `cid-${uri.split('/').at(-1)}`,
      indexedAt: '2026-09-09T00:00:00.000Z',
    },
    collection,
    viewerState: {subscribed},
  }
}

function actor(
  did: ActivityActor['did'],
  handle: ActivityActor['handle'],
): ActivityActor {
  return {
    did,
    handle,
    avatar: `https://example.com/${did}.jpg`,
  }
}

function getComputedView(item: ActivityRowItem | ActivityGroupRowItem) {
  const [presentationItem] = buildActivityPresentationListItems([item])
  return presentationItem?.computedItemView
}

describe('Atmosphere presentation', () => {
  it('normalizes usable actors in API order while retaining hydrated actor object references', () => {
    const alice = actor('did:plc:alice', 'alice.test')
    const bob = actor('did:plc:bob', 'bob.test')
    const row: ActivityGroupRowItem = {
      type: 'group',
      key: 'subject-group',
      group: {
        $type: 'app.bsky.unspecced.getAtmosphereTimeline#activityGroup',
        id: 'subject-group',
        groupBy: 'subject',
        collection: activityCollections.grainFavorite,
        indexedAt: '2026-09-09T00:00:00.000Z',
        subject: 'at://did:plc:subject/social.grain.gallery/subject',
        items: [
          activity(
            'at://did:plc:alice/social.grain.favorite/1',
            activityCollections.grainFavorite,
          ),
          activity(
            'at://did:plc:ghost/social.grain.favorite/2',
            activityCollections.grainFavorite,
          ),
          activity(
            'at://did:plc:bob/social.grain.favorite/3',
            activityCollections.grainFavorite,
          ),
          activity(
            'at://did:plc:alice/social.grain.favorite/4',
            activityCollections.grainFavorite,
          ),
          activity(
            'at://did:plc:bad/social.grain.favorite/5',
            activityCollections.grainFavorite,
          ),
        ],
      },
      actors: {
        'did:plc:alice': alice,
        'did:plc:bob': bob,
        'did:plc:bad': actor('did:plc:bad', 'handle.invalid'),
      },
    }

    const computedItemView = getComputedView(row)

    expect(computedItemView?.actors).toEqual([alice, bob])
    expect(computedItemView?.actors[0]).toBe(alice)
    expect(computedItemView?.actors[1]).toBe(bob)
  })

  it('contains only actors and document subscription aggregation', () => {
    const documentUri = 'at://did:plc:author/site.standard.document/1'
    const documentActor = actor('did:plc:author', 'author.test')
    const document: ActivityRowItem = {
      type: 'activity',
      key: documentUri,
      activity: activity(documentUri, activityCollections.document, true),
      actors: {'did:plc:author': documentActor},
    }
    const recommendationUri =
      'at://did:plc:recommender/site.standard.graph.recommend/1'
    const recommendation: ActivityRowItem = {
      type: 'activity',
      key: recommendationUri,
      activity: activity(recommendationUri, activityCollections.recommendation),
      actors: {
        'did:plc:recommender': actor('did:plc:recommender', 'recommender.test'),
      },
    }

    expect(getComputedView(document)).toEqual({
      actors: [documentActor],
      subscriptionState: 'all',
    })
    expect(getComputedView(recommendation)).toEqual({
      actors: [recommendation.actors['did:plc:recommender']],
    })
    expect(Object.keys(getComputedView(document) ?? {}).sort()).toEqual([
      'actors',
      'subscriptionState',
    ])
  })

  it('aggregates document subscription state without retaining individual roots', () => {
    const author = actor('did:plc:author', 'author.test')
    const buildGroup = (subscribed: boolean[]): ActivityGroupRowItem => ({
      type: 'group',
      key: subscribed.join('-'),
      group: {
        $type: 'app.bsky.unspecced.getAtmosphereTimeline#activityGroup',
        id: subscribed.join('-'),
        groupBy: 'actor',
        collection: activityCollections.document,
        indexedAt: '2026-09-09T00:00:00.000Z',
        actor: 'did:plc:author',
        items: subscribed.map((value, index) =>
          activity(
            `at://did:plc:author/site.standard.document/${index}`,
            activityCollections.document,
            value,
          ),
        ),
      },
      actors: {'did:plc:author': author},
    })

    expect(getComputedView(buildGroup([true, true]))?.subscriptionState).toBe(
      'all',
    )
    expect(getComputedView(buildGroup([true, false]))?.subscriptionState).toBe(
      'some',
    )
    expect(getComputedView(buildGroup([false, false]))?.subscriptionState).toBe(
      'none',
    )
  })

  it('omits standalone and grouped rows with no usable hydrated actor', () => {
    const standalone: ActivityRowItem = {
      type: 'activity',
      key: 'standalone',
      activity: activity('at://did:plc:ghost/site.standard.document/1'),
      actors: {},
    }
    const group: ActivityGroupRowItem = {
      type: 'group',
      key: 'group',
      group: {
        $type: 'app.bsky.unspecced.getAtmosphereTimeline#activityGroup',
        id: 'group',
        groupBy: 'actor',
        collection: activityCollections.document,
        indexedAt: '2026-09-09T00:00:00.000Z',
        actor: 'did:plc:bad',
        items: [
          activity('at://did:plc:bad/site.standard.document/1'),
          activity('at://did:plc:bad/site.standard.document/2'),
        ],
      },
      actors: {'did:plc:bad': actor('did:plc:bad', 'handle.invalid')},
    }

    expect(buildActivityPresentationListItems([standalone])).toEqual([
      {item: {type: 'empty', key: 'empty'}, computedItemView: undefined},
    ])
    expect(buildActivityPresentationListItems([group])).toEqual([
      {item: {type: 'empty', key: 'empty'}, computedItemView: undefined},
    ])
  })
  it('passes overflow through before and between visible activities without inventing computed data', () => {
    const overflow = {
      type: 'overflow' as const,
      key: 'overflow:0:0',
      overflow: {
        count: 3,
        collection: activityCollections.document,
        associatedProfiles: [],
      },
    }
    const row: ActivityRowItem = {
      type: 'activity',
      key: 'article',
      activity: activity('at://did:plc:author/site.standard.document/article'),
      actors: {'did:plc:author': actor('did:plc:author', 'author.test')},
    }
    const result = buildActivityPresentationListItems([
      overflow,
      row,
      {...overflow, key: 'overflow:0:2'},
    ])
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({item: overflow, computedItemView: undefined})
    expect(result[1].item).toBe(row)
    expect(result[2].computedItemView).toBeUndefined()
  })

  it('does not resolve handle authorities, missing profiles, or mismatched profile index keys', () => {
    const author = actor('did:plc:author', 'author.test')
    const actors = {'did:plc:author': author, 'did:plc:wrong': author}
    expect(
      getRecordActor(
        'at://did:plc:author/site.standard.document/article',
        actors,
      ),
    ).toBe(author)
    expect(
      getRecordActor(
        'at://did:plc:missing/site.standard.document/article',
        actors,
      ),
    ).toBeUndefined()
    expect(
      getRecordActor(
        'at://did:plc:wrong/site.standard.document/article',
        actors,
      ),
    ).toBeUndefined()
    expect(
      getRecordActor('at://author.test/site.standard.document/article', actors),
    ).toBeUndefined()
  })
})
