import {describe, expect, it} from '@jest/globals'

import {type ActivityGroupRowItem, type ActivityRowItem} from './model'
import {buildActivityPresentationListItems} from './presentation'
import {activityCollections} from './types'

function activity(
  uri: string,
  collection: string = activityCollections.document,
  subscribed = false,
) {
  return {
    $type: 'eric.bsky.atmosphere.getActivity#item' as const,
    record: {
      uri,
      cid: `cid-${uri.split('/').at(-1)}`,
      indexedAt: '2026-09-09T00:00:00.000Z',
    },
    collection,
    viewerState: {subscribed},
  }
}

function actor(did: string, handle: string) {
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

describe('ActivityV2 presentation', () => {
  it('normalizes usable actors in API order while retaining hydrated actor object references', () => {
    const alice = actor('did:plc:alice', 'alice.test')
    const bob = actor('did:plc:bob', 'bob.test')
    const row: ActivityGroupRowItem = {
      type: 'group',
      key: 'subject-group',
      group: {
        $type: 'eric.bsky.atmosphere.getActivity#group',
        id: 'subject-group',
        groupBy: 'subject',
        collection: activityCollections.grainPhoto,
        indexedAt: '2026-09-09T00:00:00.000Z',
        subject: 'at://did:plc:subject/social.grain.photo/subject',
        items: [
          activity(
            'at://did:plc:alice/social.grain.photo/1',
            activityCollections.grainPhoto,
          ),
          activity(
            'at://did:plc:ghost/social.grain.photo/2',
            activityCollections.grainPhoto,
          ),
          activity(
            'at://did:plc:bob/social.grain.photo/3',
            activityCollections.grainPhoto,
          ),
          activity(
            'at://did:plc:alice/social.grain.photo/4',
            activityCollections.grainPhoto,
          ),
          activity(
            'at://did:plc:bad/social.grain.photo/5',
            activityCollections.grainPhoto,
          ),
        ],
      },
      associatedRecords: {},
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
      associatedRecords: {},
      actors: {'did:plc:author': documentActor},
    }
    const recommendationUri =
      'at://did:plc:recommender/site.standard.graph.recommend/1'
    const recommendation: ActivityRowItem = {
      type: 'activity',
      key: recommendationUri,
      activity: activity(recommendationUri, activityCollections.recommendation),
      associatedRecords: {},
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
        $type: 'eric.bsky.atmosphere.getActivity#group',
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
      associatedRecords: {},
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
      associatedRecords: {},
      actors: {},
    }
    const group: ActivityGroupRowItem = {
      type: 'group',
      key: 'group',
      group: {
        $type: 'eric.bsky.atmosphere.getActivity#group',
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
      associatedRecords: {},
      actors: {'did:plc:bad': actor('did:plc:bad', 'handle.invalid')},
    }

    expect(buildActivityPresentationListItems([standalone])).toEqual([
      {item: {type: 'empty', key: 'empty'}, computedItemView: undefined},
    ])
    expect(buildActivityPresentationListItems([group])).toEqual([
      {item: {type: 'empty', key: 'empty'}, computedItemView: undefined},
    ])
  })
})
