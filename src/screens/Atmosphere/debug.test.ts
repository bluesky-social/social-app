import {
  createActivity,
  createActor,
  createDocumentRecords,
  createRecord,
  createRow,
  createShareRecord,
  documentUri,
  publicationUri,
} from '#/screens/Atmosphere/testFixtures'
import {activityCollections} from '#/screens/Atmosphere/types'
import {createAtmosphereDebugItem, hasAtmosphereDebugParam} from './debug'

// The global CID mock cannot validate real strong-reference CIDs.
jest.unmock('multiformats/cid')

describe('Atmosphere debug mode', () => {
  it.each([false, true])(
    'follows standalone shares to documents and publications without cloning objects (recordWithMedia=%s)',
    wrapped => {
      const activity = createActivity({
        collection: activityCollections.share,
        did: 'did:plc:sharer',
      })
      const records = createDocumentRecords()
      records[activity.record.uri] = createRecord(
        activity.record.uri,
        createShareRecord(documentUri, wrapped),
      )
      const irrelevantUri =
        'at://did:plc:irrelevant/site.standard.document/other'
      records[irrelevantUri] = createRecord(irrelevantUri, {
        ...records[documentUri].record,
      })
      const actors = Object.fromEntries(
        ['sharer', 'author', 'publisher', 'irrelevant', 'quoted'].map(name => {
          const actor = createActor(`did:plc:${name}`)
          return [actor.did, actor]
        }),
      )
      const item = createRow([activity], {associatedRecords: records, actors})
      const result = createAtmosphereDebugItem(item)
      expect(Object.keys(result.associatedRecords)).toEqual([
        activity.record.uri,
        documentUri,
        publicationUri,
      ])
      expect(Object.keys(result.actors)).toEqual([
        'did:plc:sharer',
        'did:plc:author',
        'did:plc:publisher',
      ])
      expect(result.associatedRecords).not.toBe(records)
      expect(result.actors).not.toBe(actors)
      for (const [uri, record] of Object.entries(result.associatedRecords))
        expect(record).toBe(records[uri])
      for (const [did, actor] of Object.entries(result.actors))
        expect(actor).toBe(actors[did])
      if (result.type !== 'activity')
        throw new Error('Expected a standalone item')
      expect(result.activity).toBe(activity)
    },
  )

  it('preserves grouped documents and mixed children while excluding quoted and unrelated records', () => {
    const recommendation = createActivity({
      collection: activityCollections.recommendation,
      did: 'did:plc:recommender',
    })
    const share = createActivity({
      collection: activityCollections.share,
      did: 'did:plc:sharer',
    })
    const parent = createActivity({relatedActivity: [recommendation, share]})
    const second = createActivity({rkey: 'second'})
    const records = createDocumentRecords()
    records[second.record.uri] = createRecord(second.record.uri, {
      ...records[documentUri].record,
    })
    records[recommendation.record.uri] = createRecord(
      recommendation.record.uri,
      {document: documentUri, createdAt: recommendation.record.indexedAt},
    )
    records[share.record.uri] = createRecord(
      share.record.uri,
      createShareRecord(documentUri, true),
    )
    const quotedUri = 'at://did:plc:quoted/app.bsky.feed.post/quote'
    records[quotedUri] = createRecord(quotedUri, {
      text: 'A quote, not an external target',
    })
    const item = createRow([parent, second], {
      groupBy: 'actor',
      associatedRecords: records,
    })
    const result = createAtmosphereDebugItem(item)
    if (item.type !== 'group' || result.type !== 'group')
      throw new Error('Expected a group')
    expect(result.group).toBe(item.group)
    expect(result.group.items[0].relatedActivity).toBe(parent.relatedActivity)
    expect(Object.keys(result.associatedRecords)).toEqual(
      expect.arrayContaining([
        documentUri,
        publicationUri,
        recommendation.record.uri,
        share.record.uri,
        second.record.uri,
      ]),
    )
    expect(result.associatedRecords[quotedUri]).toBeUndefined()
    expect(Object.keys(result.associatedRecords)).toHaveLength(5)
  })

  it('requires the debug URL parameter', () => {
    expect(hasAtmosphereDebugParam('?debug')).toBe(true)
    expect(hasAtmosphereDebugParam('?before=one&debug&after=two')).toBe(true)
    expect(hasAtmosphereDebugParam('?before=one')).toBe(false)
    expect(hasAtmosphereDebugParam('')).toBe(false)
  })
})
