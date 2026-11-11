import {type l} from '@atproto/lex'

import {type app} from '#/lexicons'
import {getGrainPhotos} from './photos'
import {createActivity, createGalleryView, createRow} from './testFixtures'
import {activityCollections, type ActivityItem} from './types'

function gallery(
  items: app.bsky.embed.external.ViewGallery['items'],
  collection: ActivityItem['collection'] = activityCollections.grainGallery,
) {
  return createActivity({collection, view: createGalleryView({items})})
}

function image(
  alt: string,
  aspectRatio?: {width: number; height: number},
): app.bsky.embed.external.ViewGalleryImage & {
  $type: 'app.bsky.embed.external#viewGalleryImage'
} {
  return {
    $type: 'app.bsky.embed.external#viewGalleryImage' as const,
    fullsize: `https://images.example/full/${alt}.png`,
    thumbnail: `https://images.example/thumb/${alt}.png`,
    alt,
    aspectRatio,
  }
}

describe('getGrainPhotos', () => {
  it('uses only the newest actor-group gallery, never unhydrated older galleries', () => {
    const first = image('first', {width: 3, height: 2})
    const second = image('second')
    const favorite = image('favorite')
    const photos = getGrainPhotos(
      createRow(
        [
          gallery([first, second]),
          gallery([favorite], activityCollections.grainFavorite),
        ],
        {groupBy: 'actor'},
      ),
    )
    expect(photos.map(photo => photo.alt)).toEqual(['first', 'second'])
    expect(photos[0]).toEqual({
      fullsize: first.fullsize,
      thumb: first.thumbnail,
      alt: 'first',
      aspectRatio: first.aspectRatio,
    })
    expect(photos[0].aspectRatio).toBe(first.aspectRatio)
  })

  it('caps the supplied target at ten usable images and skips unknown media', () => {
    const activity = gallery([
      {$type: 'example.future#video' as l.Unknown$Type},
      ...Array.from({length: 13}, (_, i) => image(String(i))),
    ])
    const photos = getGrainPhotos(createRow([activity]))
    expect(photos.map(photo => photo.alt)).toEqual(
      Array.from({length: 10}, (_, i) => String(i)),
    )
  })

  it('does not search older group members when the rendered gallery is missing', () => {
    const missing = createActivity({
      collection: activityCollections.grainGallery,
    })
    expect(
      getGrainPhotos(
        createRow([missing, gallery([image('older')])], {groupBy: 'actor'}),
      ),
    ).toEqual([])
  })

  it('uses only the shared subject gallery for favorites', () => {
    const view = createGalleryView({items: [image('subject')]})
    const row = createRow(
      [
        createActivity({
          collection: activityCollections.grainFavorite,
          did: 'did:plc:one',
        }),
        createActivity({
          collection: activityCollections.grainFavorite,
          did: 'did:plc:two',
        }),
      ],
      {
        subject: {
          uri: 'at://did:plc:gallery/social.grain.gallery/subject',
          viewerState: {subscribed: false},
          view,
        },
      },
    )
    expect(getGrainPhotos(row).map(photo => photo.alt)).toEqual(['subject'])
  })

  it('preserves original views and uses empty alt when absent', () => {
    const source = {...image('source'), alt: undefined}
    const activity = gallery([source])
    const before = JSON.stringify(activity)
    const photos = getGrainPhotos(createRow([activity]))
    expect(photos[0].alt).toBe('')
    expect(JSON.stringify(activity)).toBe(before)
  })

  it.each([
    [
      {width: 2, height: 3},
      {width: 2, height: 3},
    ],
    [
      {width: 1, height: 1},
      {width: 1, height: 1},
    ],
    [
      {width: 3, height: 2},
      {width: 3, height: 2},
    ],
    [undefined, {width: 1, height: 1}],
    [
      {width: 0, height: 1},
      {width: 1, height: 1},
    ],
    [
      {width: -1, height: 1},
      {width: 1, height: 1},
    ],
    [
      {width: NaN, height: 1},
      {width: 1, height: 1},
    ],
    [
      {width: Infinity, height: 1},
      {width: 1, height: 1},
    ],
    [
      {width: Number.MAX_VALUE, height: Number.MIN_VALUE},
      {width: 1, height: 1},
    ],
    [
      {width: Number.MIN_VALUE, height: Number.MAX_VALUE},
      {width: 1, height: 1},
    ],
  ])('uses a safe display ratio for %j', (ratio, expected) => {
    expect(
      getGrainPhotos(createRow([gallery([image('ratio', ratio)])]))[0]
        .aspectRatio,
    ).toEqual(expected)
  })

  it('does not turn unrelated collections into galleries', () => {
    expect(
      getGrainPhotos(
        createRow([
          gallery([image('not-gallery')], activityCollections.document),
        ]),
      ),
    ).toEqual([])
  })
})
