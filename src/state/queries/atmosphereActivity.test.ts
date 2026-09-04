import {describe, expect, it} from '@jest/globals'

import {
  narrowActivityPage,
  narrowActors,
  narrowAssociatedRecords,
} from './atmosphereActivityTypes'

describe('Atmosphere activity response narrowing', () => {
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

  it('turns invalid map containers and entries into empty maps', () => {
    expect(narrowAssociatedRecords(null)).toEqual({})
    expect(narrowAssociatedRecords({bad: {uri: 1}})).toEqual({})
    expect(narrowActors([])).toEqual({})
    expect(narrowActors({bad: {did: 'did:plc:bad'}})).toEqual({})
  })

  it('preserves feed order and cursor while narrowing a page', () => {
    const page = narrowActivityPage({
      feed: [
        {
          record: {
            uri: 'at://did:plc:author/site.standard.document/one',
            cid: 'bafy-one',
            indexedAt: '2026-09-03T00:00:00.000Z',
          },
          viewerState: {subscribed: true},
        },
      ],
      associatedRecords: null,
      actors: null,
      cursor: 'opaque-cursor',
    })

    expect(page.feed.map(item => item.record.uri)).toEqual([
      'at://did:plc:author/site.standard.document/one',
    ])
    expect(page.feed[0].viewerState.subscribed).toBe(true)
    expect(page.associatedRecords).toEqual({})
    expect(page.actors).toEqual({})
    expect(page.cursor).toBe('opaque-cursor')
  })
})
