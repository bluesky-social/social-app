import {describe, expect, it} from '@jest/globals'

import {getActivityRowKind} from './rowLayout'
import {
  createActivity,
  createActor,
  createDocumentRecords,
  createRecord,
  createRow,
  createShareRecord,
  documentUri,
  present,
  publicationUri,
  recordCid,
} from './testFixtures'
import {activityCollections} from './types'

jest.unmock('multiformats/cid')

function kind(item: ReturnType<typeof createRow>) {
  return getActivityRowKind(present(item))
}

function publicationItem() {
  const activity = createActivity({
    collection: activityCollections.publication,
    did: 'did:plc:publisher',
    rkey: 'site',
  })
  return {
    activity,
    row: createRow([activity], {
      associatedRecords: {
        [activity.record.uri]: createRecord(activity.record.uri, {
          $type: activityCollections.publication,
          name: 'A publication',
          url: 'https://publication.example/',
        }),
      },
    }),
  }
}

describe('Atmosphere row layout classification', () => {
  it('requires a renderable document fallback, not only a card signal', () => {
    const valid = createDocumentRecords()
    const subscribed = createActivity({subscribed: true})
    expect(
      kind(
        createRow([subscribed], {
          associatedRecords: valid,
        }),
      ),
    ).toBe('card')

    const emptyTitle = createDocumentRecords()
    emptyTitle[documentUri].record.title = '  '
    expect(
      kind(
        createRow([subscribed], {
          associatedRecords: emptyTitle,
        }),
      ),
    ).toBe('footnote')

    const invalidUrl = createDocumentRecords()
    invalidUrl[publicationUri].record.url = 'not a URL'
    expect(
      kind(
        createRow([subscribed], {
          associatedRecords: invalidUrl,
        }),
      ),
    ).toBe('footnote')
  })

  it('requires a renderable publication fallback for subscription cards', () => {
    const first = createActivity({
      collection: activityCollections.subscription,
      did: 'did:plc:one',
      rkey: 'one',
    })
    const second = createActivity({
      collection: activityCollections.subscription,
      did: 'did:plc:two',
      rkey: 'two',
    })
    const associatedRecords = {
      [first.record.uri]: createRecord(first.record.uri, {
        $type: activityCollections.subscription,
        publication: publicationUri,
      }),
      [second.record.uri]: createRecord(second.record.uri, {
        $type: activityCollections.subscription,
        publication: publicationUri,
      }),
      [publicationUri]: createRecord(publicationUri, {
        $type: activityCollections.publication,
        name: 'A publication',
        url: 'https://publication.example/',
      }),
    }
    const row = createRow([first, second], {
      associatedRecords,
    })
    if (row.type !== 'group') throw new Error('Expected subscription group')
    row.group.subject = publicationUri

    expect(kind(row)).toBe('card')

    associatedRecords[publicationUri].record.name = ''
    expect(kind(row)).toBe('footnote')

    associatedRecords[publicationUri].record.name = 'A publication'
    associatedRecords[publicationUri].record.url = 'javascript:bad'
    expect(kind(row)).toBe('footnote')
  })

  it('falls back when a photo signal has no usable photo record', () => {
    const activity = createActivity({
      collection: activityCollections.grainPhoto,
    })
    const row = createRow([activity], {
      associatedRecords: {},
    })
    expect(kind(row)).toBe('footnote')

    const withPhoto = createRow([activity], {
      associatedRecords: {
        [activity.record.uri]: createRecord(activity.record.uri, {
          $type: activityCollections.grainPhoto,
          photo: {ref: recordCid, mimeType: 'image/jpeg'},
        }),
      },
    })
    expect(kind(withPhoto)).toBe('card')
  })

  it('promotes a valid share but falls back for an invalid share', () => {
    const valid = createActivity({collection: activityCollections.share})
    const validRecords = {
      [valid.record.uri]: createRecord(
        valid.record.uri,
        createShareRecord(documentUri),
      ),
    }
    expect(kind(createRow([valid], {associatedRecords: validRecords}))).toBe(
      'card',
    )

    const invalid = createActivity({
      collection: activityCollections.share,
      rkey: 'invalid',
    })
    expect(
      kind(
        createRow([invalid], {
          associatedRecords: {
            [invalid.record.uri]: createRecord(invalid.record.uri, {
              $type: activityCollections.share,
              text: 'No embed',
              createdAt: invalid.record.indexedAt,
            }),
          },
        }),
      ),
    ).toBe('footnote')
  })

  it('does not promote shares whose external targets are unrelated to the row subject', () => {
    const first = createActivity({
      collection: activityCollections.share,
      did: 'did:plc:first-sharer',
      rkey: 'first',
    })
    const second = createActivity({
      collection: activityCollections.share,
      did: 'did:plc:second-sharer',
      rkey: 'second',
    })
    const row = createRow([first, second], {
      associatedRecords: {
        [first.record.uri]: createRecord(
          first.record.uri,
          createShareRecord('at://did:plc:other/site.standard.document/other'),
        ),
        [second.record.uri]: createRecord(
          second.record.uri,
          createShareRecord(
            'at://did:plc:other/site.standard.document/other-2',
          ),
        ),
      },
    })
    expect(kind(row)).toBe('footnote')
  })

  it('requires an active, non-actor-group livestream for a card', () => {
    const active = createActivity({collection: activityCollections.livestream})
    const ended = createActivity({
      collection: activityCollections.livestream,
      rkey: 'ended',
    })
    const activeRecord = {
      $type: activityCollections.livestream,
      title: 'Live now',
      createdAt: active.record.indexedAt,
    }
    const endedRecord = {
      ...activeRecord,
      endedAt: '2026-09-10T13:00:00.000Z',
    }

    expect(
      kind(
        createRow([active], {
          associatedRecords: {
            [active.record.uri]: createRecord(active.record.uri, activeRecord),
          },
        }),
      ),
    ).toBe('card')
    expect(
      kind(
        createRow([ended], {
          associatedRecords: {
            [ended.record.uri]: createRecord(ended.record.uri, endedRecord),
          },
        }),
      ),
    ).toBe('footnote')

    const groupedFirst = createActivity({
      collection: activityCollections.livestream,
      did: 'did:plc:streamer',
      rkey: 'grouped-first',
    })
    const groupedSecond = createActivity({
      collection: activityCollections.livestream,
      did: 'did:plc:streamer',
      rkey: 'grouped-second',
    })
    const records = {
      [groupedFirst.record.uri]: createRecord(
        groupedFirst.record.uri,
        activeRecord,
      ),
      [groupedSecond.record.uri]: createRecord(
        groupedSecond.record.uri,
        activeRecord,
      ),
    }
    expect(
      kind(
        createRow([groupedFirst, groupedSecond], {
          groupBy: 'actor',
          associatedRecords: records,
        }),
      ),
    ).toBe('footnote')
  })

  it('promotes a renderable root publication and keeps unknown collections compact', () => {
    const {row} = publicationItem()
    expect(kind(row)).toBe('card')

    const unknown = createActivity({
      collection: 'example.unknown.collection',
      did: 'did:plc:unknown',
      rkey: 'unknown',
    })
    expect(
      kind(
        createRow([unknown], {
          actors: {'did:plc:unknown': createActor('did:plc:unknown')},
        }),
      ),
    ).toBe('footnote')
  })
})
