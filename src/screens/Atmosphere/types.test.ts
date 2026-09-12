import {describe, expect, it} from '@jest/globals'

import {
  createActivity,
  createDocumentRecords,
  createRecord,
  createShareRecord,
  createShareView,
  documentUri,
} from '#/screens/Atmosphere/testFixtures'
import {
  activityCollections,
  isKnownActivityCollection,
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

  it('preserves standalone and grouped shares, raw records, and typed views', () => {
    const first = createActivity({collection: activityCollections.share})
    const second = createActivity({
      collection: activityCollections.share,
      rkey: 'second',
    })
    const raw = createShareRecord()
    const view = createShareView()
    const page = narrowActivityPage({
      feed: [
        {...first, view},
        ...(['subject', 'actor'] as const).map(groupBy => ({
          $type: 'eric.bsky.atmosphere.getActivity#group',
          id: groupBy,
          groupBy,
          collection: activityCollections.share,
          subject: groupBy === 'subject' ? documentUri : undefined,
          actor: groupBy === 'actor' ? 'did:plc:author' : undefined,
          indexedAt: first.record.indexedAt,
          items: [first, second],
        })),
      ],
      associatedRecords: {
        [first.record.uri]: createRecord(first.record.uri, raw),
      },
      actors: {},
      cursor: 'opaque-cursor',
    })
    expect(isKnownActivityCollection(activityCollections.share)).toBe(true)
    expect(page.feed).toHaveLength(3)
    expect(page.feed[0]).toMatchObject({...first, view})
    expect(page.associatedRecords[first.record.uri].record).toBe(raw)
    expect(page.cursor).toBe('opaque-cursor')
    for (const group of page.feed.slice(1)) {
      if (group.$type !== 'eric.bsky.atmosphere.getActivity#group')
        throw new Error('Expected a group')
      expect(group.items.map(item => item.record.uri)).toEqual([
        first.record.uri,
        second.record.uri,
      ])
    }
  })

  it.each([
    undefined,
    {$type: 'eric.bsky.atmosphere.getActivity#shareView'},
    {
      ...createShareView(),
      likeCount: -1,
    },
    {
      ...createShareView(),
      replyCount: 1.5,
    },
  ])('safely omits malformed or wrong share views (%j)', view => {
    const activity = createActivity({collection: activityCollections.share})
    const page = narrowActivityPage({
      feed: [{...activity, view}],
      associatedRecords: {},
      actors: {},
    })
    const narrowed = page.feed[0]
    if (narrowed.$type !== 'eric.bsky.atmosphere.getActivity#item') {
      throw new Error('Expected an activity')
    }
    expect(narrowed.view).toBeUndefined()
  })

  it('keeps mixed recommendation/share children in API order on grouped documents without recursion', () => {
    const nested = createActivity({
      collection: activityCollections.share,
      rkey: 'nested',
    })
    const recommendation = createActivity({
      collection: activityCollections.recommendation,
      relatedActivity: [nested],
    })
    const share = createActivity({
      collection: activityCollections.share,
      view: createShareView(),
      relatedActivity: [nested],
    })
    const parent = {
      ...createActivity(),
      relatedActivity: [
        recommendation,
        share,
        createActivity({collection: activityCollections.subscription}),
        null,
      ],
    }
    const second = createActivity({rkey: 'second'})
    const page = narrowActivityPage({
      feed: [
        {
          $type: 'eric.bsky.atmosphere.getActivity#group',
          id: 'documents',
          groupBy: 'actor',
          actor: 'did:plc:author',
          collection: activityCollections.document,
          indexedAt: parent.record.indexedAt,
          items: [parent, second],
        },
        {...share, relatedActivity: [recommendation]},
      ],
      associatedRecords: createDocumentRecords(),
      actors: {},
    })
    const group = page.feed[0]
    if (group.$type !== 'eric.bsky.atmosphere.getActivity#group')
      throw new Error('Expected a group')
    expect(group.items[0].relatedActivity).toEqual([
      {...recommendation, relatedActivity: undefined},
      {...share, relatedActivity: undefined},
    ])
    expect(group.items[1].relatedActivity).toBeUndefined()
    expect(page.feed[1]).toMatchObject({...share, relatedActivity: undefined})
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
