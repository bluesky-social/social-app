import {describe, expect, it} from '@jest/globals'

import {
  narrowActivityPage,
  narrowActors,
  narrowAssociatedRecords,
} from './types'

describe('ActivityV2 response narrowing', () => {
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
    }

    expect(
      narrowAssociatedRecords({[associatedRecord.uri]: associatedRecord}),
    ).toEqual({[associatedRecord.uri]: associatedRecord})
    expect(narrowActors({[actor.did]: actor})).toEqual({[actor.did]: actor})
  })

  it('preserves grouped items and their viewer state', () => {
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
              viewerState: {subscribed: true},
            },
            {
              $type: 'eric.bsky.atmosphere.getActivity#item',
              record: {
                uri: secondUri,
                cid: 'bafy-two',
                indexedAt: '2026-09-02T23:55:00.000Z',
              },
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
    expect(group.items.map(item => item.viewerState.subscribed)).toEqual([
      true,
      false,
    ])
  })
})
