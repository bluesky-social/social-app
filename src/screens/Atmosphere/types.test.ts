import {describe, expect, it} from '@jest/globals'

import {
  activityCollections,
  narrowActivityPage,
  narrowActors,
  narrowAssociatedRecords,
} from './types'

describe('Atmosphere response narrowing', () => {
  it('narrows associated records and actors', () => {
    const associatedRecord = {
      uri: 'at://did:plc:author/site.standard.document/one',
      cid: 'bafy-record',
      record: {
        $type: 'site.standard.document',
        site: 'at://did:plc:author/site.standard.publication/one',
        title: 'A document',
        publishedAt: '2026-09-03T00:00:00.000Z',
      },
    }
    const actor = {
      did: 'did:plc:author',
      handle: 'author.example',
      avatar: 'https://example.com/avatar.jpg',
      viewer: {following: 'at://did:plc:viewer/app.bsky.graph.follow/author'},
    }

    expect(
      narrowAssociatedRecords({[associatedRecord.uri]: associatedRecord}),
    ).toEqual({[associatedRecord.uri]: associatedRecord})
    expect(narrowActors({[actor.did]: actor})).toEqual({[actor.did]: actor})
  })

  it('preserves required standalone item collection', () => {
    const uri = 'at://did:plc:author/site.standard.document/standalone'
    const page = narrowActivityPage({
      feed: [
        {
          $type: 'eric.bsky.atmosphere.getActivity#item',
          record: {
            uri,
            cid: 'bafy-standalone',
            indexedAt: '2026-09-03T00:00:00.000Z',
          },
          collection: activityCollections.document,
          viewerState: {subscribed: true},
        },
      ],
      associatedRecords: {},
      actors: {},
    })

    expect(page.feed).toHaveLength(1)
    const item = page.feed[0]
    expect(item.$type).toBe('eric.bsky.atmosphere.getActivity#item')
    if (item.$type !== 'eric.bsky.atmosphere.getActivity#item') return
    expect(item.collection).toBe(activityCollections.document)
  })

  it('preserves appview-derived livestream thumbnail views', () => {
    const uri = 'at://did:plc:streamer/place.stream.livestream/with-thumbnail'
    const page = narrowActivityPage({
      feed: [
        {
          $type: 'eric.bsky.atmosphere.getActivity#item',
          record: {
            uri,
            cid: 'bafy-livestream',
            indexedAt: '2026-09-11T00:00:00.000Z',
          },
          collection: activityCollections.livestream,
          viewerState: {subscribed: false},
          view: {
            $type: 'eric.bsky.atmosphere.getActivity#livestreamView',
            thumb:
              'https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:streamer/bafy-thumb',
          },
        },
      ],
      associatedRecords: {},
      actors: {},
    })

    const item = page.feed[0]
    expect(item.$type).toBe('eric.bsky.atmosphere.getActivity#item')
    if (item.$type !== 'eric.bsky.atmosphere.getActivity#item') return
    expect(item.view).toEqual({
      $type: 'eric.bsky.atmosphere.getActivity#livestreamView',
      thumb:
        'https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:streamer/bafy-thumb',
    })
  })

  it('preserves non-recursive recommendation activity related to documents', () => {
    const documentUri =
      'at://did:plc:author/site.standard.document/with-related'
    const recommendationUri =
      'at://did:plc:recommender/site.standard.graph.recommend/one'
    const nestedRecommendationUri =
      'at://did:plc:nested/site.standard.graph.recommend/two'
    const recommendation = {
      $type: 'eric.bsky.atmosphere.getActivity#item',
      record: {
        uri: recommendationUri,
        cid: 'bafy-recommendation',
        indexedAt: '2026-09-03T00:01:00.000Z',
      },
      collection: activityCollections.recommendation,
      viewerState: {subscribed: false},
      relatedActivity: [
        {
          $type: 'eric.bsky.atmosphere.getActivity#item',
          record: {
            uri: nestedRecommendationUri,
            cid: 'bafy-nested',
            indexedAt: '2026-09-03T00:02:00.000Z',
          },
          collection: activityCollections.recommendation,
          viewerState: {subscribed: false},
        },
      ],
    }
    const page = narrowActivityPage({
      feed: [
        {
          $type: 'eric.bsky.atmosphere.getActivity#item',
          record: {
            uri: documentUri,
            cid: 'bafy-document',
            indexedAt: '2026-09-03T00:00:00.000Z',
          },
          collection: activityCollections.document,
          viewerState: {subscribed: false},
          relatedActivity: [
            recommendation,
            {
              ...recommendation,
              collection: activityCollections.subscription,
            },
          ],
        },
      ],
      associatedRecords: {},
      actors: {},
    })

    const item = page.feed[0]
    expect(item.$type).toBe('eric.bsky.atmosphere.getActivity#item')
    if (item.$type !== 'eric.bsky.atmosphere.getActivity#item') return
    expect(item.relatedActivity).toEqual([
      expect.objectContaining({
        collection: activityCollections.recommendation,
        relatedActivity: undefined,
        record: expect.objectContaining({uri: recommendationUri}),
      }),
    ])
  })

  it('preserves grouped items and their collection and viewer state', () => {
    const firstUri = 'at://did:plc:author/site.standard.document/one'
    const secondUri = 'at://did:plc:author/site.standard.document/two'
    const page = narrowActivityPage({
      feed: [
        {
          $type: 'eric.bsky.atmosphere.getActivity#group',
          id: 'opaque-group-id',
          groupBy: 'actor',
          collection: 'site.standard.document',
          indexedAt: '2026-09-03T00:00:00.000Z',
          actor: 'did:plc:author',
          items: [
            {
              $type: 'eric.bsky.atmosphere.getActivity#item',
              record: {
                uri: firstUri,
                cid: 'bafy-one',
                indexedAt: '2026-09-03T00:00:00.000Z',
              },
              collection: activityCollections.document,
              viewerState: {subscribed: true},
            },
            {
              $type: 'eric.bsky.atmosphere.getActivity#item',
              record: {
                uri: secondUri,
                cid: 'bafy-two',
                indexedAt: '2026-09-02T23:55:00.000Z',
              },
              collection: activityCollections.document,
              viewerState: {subscribed: false},
            },
          ],
        },
      ],
      associatedRecords: {},
      actors: {},
    })

    const group = page.feed[0]
    expect(group.$type).toBe('eric.bsky.atmosphere.getActivity#group')
    if (group.$type !== 'eric.bsky.atmosphere.getActivity#group') return
    expect(group.id).toBe('opaque-group-id')
    expect(group.items.map(item => item.record.uri)).toEqual([
      firstUri,
      secondUri,
    ])
    expect(group.items.map(item => item.collection)).toEqual([
      activityCollections.document,
      activityCollections.document,
    ])
    expect(group.items.map(item => item.viewerState.subscribed)).toEqual([
      true,
      false,
    ])
  })

  it('drops items that do not include the required collection field', () => {
    const page = narrowActivityPage({
      feed: [
        {
          $type: 'eric.bsky.atmosphere.getActivity#item',
          record: {
            uri: 'at://did:plc:author/site.standard.document/missing-collection',
            cid: 'bafy-missing-collection',
            indexedAt: '2026-09-03T00:00:00.000Z',
          },
          viewerState: {subscribed: true},
        },
      ],
      associatedRecords: {},
      actors: {},
    })

    expect(page.feed).toEqual([])
  })
})
