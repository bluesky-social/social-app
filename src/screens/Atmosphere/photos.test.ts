import {CID} from 'multiformats/cid'

import {getGrainPhotos} from './photos'
import {type ActivityPresentationItem} from './presentation'
import {createActivity, createRecord, recordCid} from './testFixtures'
import {activityCollections, type AssociatedRecords} from './types'

jest.unmock('multiformats/cid')

const ownerDid = 'did:plc:photo-owner'

function createPhotoActivity(rkey: string) {
  return createActivity({
    collection: activityCollections.grainPhoto,
    did: ownerDid,
    rkey,
  })
}

function createPhotoRecord(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    $type: activityCollections.grainPhoto,
    alt: 'A real alt text',
    photo: {
      ref: recordCid,
      mimeType: 'image/jpeg',
    },
    ...overrides,
  }
}

function createItem(
  activities: ReturnType<typeof createPhotoActivity>[],
  records: Record<string, Record<string, unknown>>,
): ActivityPresentationItem {
  const associatedRecords: AssociatedRecords = Object.fromEntries(
    Object.entries(records).map(([uri, record]) => [
      uri,
      createRecord(uri, record),
    ]),
  )
  if (activities.length === 1) {
    return {
      type: 'activity',
      key: activities[0].record.uri,
      activity: activities[0],
      associatedRecords,
      actors: {},
    }
  }
  return {
    type: 'group',
    key: 'photos',
    group: {
      $type: 'eric.bsky.atmosphere.getActivity#group',
      id: 'photos',
      groupBy: 'actor',
      collection: activityCollections.grainPhoto,
      actor: ownerDid,
      indexedAt: activities[0].record.indexedAt,
      items: activities,
    },
    associatedRecords,
    actors: {},
  }
}

describe('getGrainPhotos', () => {
  it('returns one or many photos in API order with real fullsize URLs', () => {
    const first = createPhotoActivity('first')
    const second = createPhotoActivity('second')
    const photos = getGrainPhotos(
      createItem([first, second], {
        [first.record.uri]: createPhotoRecord({alt: 'first'}),
        [second.record.uri]: createPhotoRecord({alt: 'second'}),
      }),
    )

    expect(photos).toHaveLength(2)
    expect(photos.map(photo => photo.alt)).toEqual(['first', 'second'])
    expect(photos[0].thumb).toBe(photos[0].fullsize)
    expect(photos[0].fullsize).toBe(
      `https://cdn.bsky.app/img/feed_fullsize/plain/${ownerDid}/${recordCid}@jpeg`,
    )
  })

  it.each([9, 10, 11, 87])(
    'caps %s photos at ten in API order without changing the group',
    count => {
      const activities = Array.from({length: count}, (_, i) =>
        createPhotoActivity(`photo${i}`),
      )
      const records = Object.fromEntries(
        activities.map((activity, i) => [
          activity.record.uri,
          createPhotoRecord({alt: `Photo ${i}`}),
        ]),
      )
      const item = createItem(activities, records)
      const photos = getGrainPhotos(item)
      expect(photos.map(photo => photo.alt)).toEqual(
        Array.from({length: Math.min(count, 10)}, (_, i) => `Photo ${i}`),
      )
      if (item.type !== 'group') throw new Error('Expected group')
      expect(item.group.items).toBe(activities)
      expect(item.group.items).toHaveLength(count)
      expect(Object.keys(item.associatedRecords)).toHaveLength(count)
      expect(item.associatedRecords[activities.at(-1)!.record.uri].record).toBe(
        records[activities.at(-1)!.record.uri],
      )
    },
  )

  it('applies the ten-photo cap after filtering unusable images', () => {
    const activities = Array.from({length: 13}, (_, i) =>
      createPhotoActivity(`photo${i}`),
    )
    const records = Object.fromEntries(
      activities
        .slice(2)
        .map((activity, i) => [
          activity.record.uri,
          createPhotoRecord({alt: `Photo ${i + 2}`}),
        ]),
    )
    const photos = getGrainPhotos(createItem(activities, records))
    expect(photos.map(photo => photo.alt)).toEqual(
      Array.from({length: 10}, (_, i) => `Photo ${i + 2}`),
    )
  })

  it('preserves source records and uses an empty alt when absent', () => {
    const activity = createPhotoActivity('unchanged')
    const source = createPhotoRecord()
    delete source.alt
    const before = structuredClone(source)

    const photos = getGrainPhotos(
      createItem([activity], {[activity.record.uri]: source}),
    )

    expect(photos[0].alt).toBe('')
    expect(source).toEqual(before)
  })

  it('skips unusable records while compacting returned indexes', () => {
    const missing = createPhotoActivity('missing')
    const malformed = createPhotoActivity('malformed')
    const valid = createPhotoActivity('valid')
    const photos = getGrainPhotos(
      createItem([missing, malformed, valid], {
        [malformed.record.uri]: createPhotoRecord({
          photo: {ref: 'not-a-cid', mimeType: 'image/jpeg'},
        }),
        [valid.record.uri]: createPhotoRecord({alt: 'kept'}),
      }),
    )

    expect(photos).toHaveLength(1)
    expect(photos[0].alt).toBe('kept')
  })

  it.each([
    {ref: 'not-a-cid', mimeType: 'image/jpeg'},
    {ref: `${recordCid}/path`, mimeType: 'image/jpeg'},
    {ref: {$link: 'not-a-cid'}, mimeType: 'image/jpeg'},
    {ref: recordCid, mimeType: 'image/svg+xml'},
    {ref: undefined, mimeType: 'image/jpeg'},
    {ref: recordCid},
    {mimeType: 'image/jpeg'},
    {
      ref: {'/': 'bad', bytes: 'bad', version: 1, code: 85, multihash: {}},
      mimeType: 'image/jpeg',
    },
  ])('skips malformed blob data %j', photo => {
    const activity = createPhotoActivity('bad-blob')
    expect(
      getGrainPhotos(
        createItem([activity], {
          [activity.record.uri]: createPhotoRecord({photo}),
        }),
      ),
    ).toEqual([])
  })

  it('accepts real CID object and link forms', () => {
    const stringPhoto = createPhotoActivity('string')
    const cidPhoto = createPhotoActivity('cid')
    const linkPhoto = createPhotoActivity('link')
    const photos = getGrainPhotos(
      createItem([stringPhoto, cidPhoto, linkPhoto], {
        [stringPhoto.record.uri]: createPhotoRecord(),
        [cidPhoto.record.uri]: createPhotoRecord({
          photo: {ref: CID.parse(recordCid), mimeType: 'image/png'},
        }),
        [linkPhoto.record.uri]: createPhotoRecord({
          photo: {ref: {$link: recordCid}, mimeType: 'image/webp'},
        }),
      }),
    )

    expect(photos).toHaveLength(3)
    expect(photos.map(photo => photo.thumb)).toEqual([
      expect.stringContaining('@jpeg'),
      expect.stringContaining('@png'),
      expect.stringContaining('@webp'),
    ])
  })

  it('uses portrait, square, landscape, and safe fallback ratios', () => {
    const activities = ['portrait', 'square', 'landscape', 'fallback'].map(
      createPhotoActivity,
    )
    const photos = getGrainPhotos(
      createItem(
        activities,
        Object.fromEntries([
          [
            activities[0].record.uri,
            createPhotoRecord({aspectRatio: {width: 2, height: 4}}),
          ],
          [
            activities[1].record.uri,
            createPhotoRecord({aspectRatio: {width: 1, height: 1}}),
          ],
          [
            activities[2].record.uri,
            createPhotoRecord({aspectRatio: {width: 4, height: 2}}),
          ],
          [
            activities[3].record.uri,
            createPhotoRecord({aspectRatio: {width: 0, height: -1}}),
          ],
        ]),
      ),
    )

    expect(photos.map(photo => photo.aspectRatio)).toEqual([
      {width: 2, height: 4},
      {width: 1, height: 1},
      {width: 4, height: 2},
      {width: 1, height: 1},
    ])
  })

  it('uses a square fallback when ratio division overflows or underflows', () => {
    const overflow = createPhotoActivity('overflow')
    const underflow = createPhotoActivity('underflow')
    const photos = getGrainPhotos(
      createItem([overflow, underflow], {
        [overflow.record.uri]: createPhotoRecord({
          aspectRatio: {width: Number.MAX_VALUE, height: Number.MIN_VALUE},
        }),
        [underflow.record.uri]: createPhotoRecord({
          aspectRatio: {width: Number.MIN_VALUE, height: Number.MAX_VALUE},
        }),
      }),
    )

    expect(photos.map(photo => photo.aspectRatio)).toEqual([
      {width: 1, height: 1},
      {width: 1, height: 1},
    ])
  })

  it('rejects malformed owners and MIME, safely omitting invalid alt', () => {
    const badOwner = createPhotoActivity('bad-owner')
    badOwner.record.uri = 'at://not-a-did/social.grain.photo/bad-owner'
    const badAlt = createPhotoActivity('bad-alt')
    const badMime = createPhotoActivity('bad-mime')
    const records = {
      [badOwner.record.uri]: createPhotoRecord(),
      [badAlt.record.uri]: createPhotoRecord({alt: 42}),
      [badMime.record.uri]: createPhotoRecord({
        photo: {ref: recordCid, mimeType: 42},
      }),
    }
    const before = structuredClone(records)

    const photos = getGrainPhotos(
      createItem([badOwner, badAlt, badMime], records),
    )
    expect(photos).toHaveLength(1)
    expect(photos[0].alt).toBe('')
    expect(records).toEqual(before)
  })
})
