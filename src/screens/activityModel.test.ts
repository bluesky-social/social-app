import {describe, expect, it} from '@jest/globals'

import {type AtmosphereActivityPage} from '#/state/queries/atmosphereActivityTypes'
import {
  type ActivityRowItem,
  buildActivityListItems,
  getActivityRowContent,
} from './activityModel'

const recommendationUri =
  'at://did:plc:recommender/site.standard.graph.recommend/one'
const documentUri = 'at://did:plc:author/site.standard.document/one'
const publicationUri = 'at://did:plc:publisher/site.standard.publication/one'
const subscriptionUri =
  'at://did:plc:subscriber/site.standard.graph.subscription/one'
const livestreamUri =
  'at://did:plc:streamer/place.stream.livestream/active-stream'
const photoUri = 'at://did:plc:photographer/social.grain.photo/one'

function activity(uri: string, subscribed = false) {
  return {
    record: {
      uri,
      cid: `bafy-${uri.at(-1)}`,
      indexedAt: '2026-09-03T00:00:00.000Z',
    },
    viewerState: {subscribed},
  }
}

function page(
  values: Partial<AtmosphereActivityPage> = {},
): AtmosphereActivityPage {
  return {
    feed: [],
    associatedRecords: {},
    actors: {},
    ...values,
  }
}

describe('Activity list model', () => {
  it('gives every row the same complete merged associated-record map', () => {
    const secondDocumentUri = 'at://did:plc:second/site.standard.document/two'
    const items = buildActivityListItems(
      {
        pages: [
          page({
            feed: [activity(documentUri)],
            associatedRecords: {
              [documentUri]: {
                uri: documentUri,
                cid: 'bafy-one',
                record: {title: 'One'},
              },
            },
          }),
          page({
            feed: [activity(secondDocumentUri)],
            associatedRecords: {
              [secondDocumentUri]: {
                uri: secondDocumentUri,
                cid: 'bafy-two',
                record: {title: 'Two'},
              },
            },
          }),
        ],
        pageParams: [undefined, 'cursor'],
      },
      undefined,
    ) as ActivityRowItem[]

    expect(items).toHaveLength(2)
    expect(items[0].associatedRecords).toBe(items[1].associatedRecords)
    expect(Object.keys(items[0].associatedRecords)).toEqual([
      documentUri,
      secondDocumentUri,
    ])
  })

  it('deduplicates activity URIs in first-seen order', () => {
    const items = buildActivityListItems(
      {
        pages: [
          page({feed: [activity(documentUri), activity(publicationUri)]}),
          page({feed: [activity(documentUri)]}),
        ],
        pageParams: [undefined, 'cursor'],
      },
      undefined,
    ) as ActivityRowItem[]

    expect(items.map(item => item.activity.record.uri)).toEqual([
      documentUri,
      publicationUri,
    ])
  })
})

describe('Activity row content', () => {
  it('traverses a recommendation to its document and author', () => {
    const item: ActivityRowItem = {
      type: 'activity',
      key: recommendationUri,
      activity: activity(recommendationUri),
      associatedRecords: {
        [recommendationUri]: {
          uri: recommendationUri,
          cid: 'bafy-recommendation',
          record: {
            $type: 'site.standard.graph.recommend',
            document: documentUri,
            createdAt: '2026-09-03T00:00:00.000Z',
          },
        },
        [documentUri]: {
          uri: documentUri,
          cid: 'bafy-document',
          record: {
            $type: 'site.standard.document',
            site: publicationUri,
            path: '/posts/building-a-small-web',
            title: 'Building a Small Web',
          },
        },
        [publicationUri]: {
          uri: publicationUri,
          cid: 'bafy-publication',
          record: {
            $type: 'site.standard.publication',
            name: 'Small Web Journal',
            url: 'https://small.example/',
          },
        },
      },
      actors: {
        'did:plc:recommender': {
          did: 'did:plc:recommender',
          handle: 'alice.example',
        },
        'did:plc:author': {
          did: 'did:plc:author',
          handle: 'bob.example',
        },
      },
    }

    expect(getActivityRowContent(item)).toEqual({
      type: 'recommendation',
      actorDid: 'did:plc:recommender',
      actor: item.actors['did:plc:recommender'],
      subjectDid: 'did:plc:author',
      subjectActor: item.actors['did:plc:author'],
      title: 'Building a Small Web',
      href: 'https://small.example/posts/building-a-small-web',
    })
  })

  it('constructs publication and document links', () => {
    const document = getActivityRowContent({
      type: 'activity',
      key: documentUri,
      activity: activity(documentUri),
      associatedRecords: {
        [documentUri]: {
          uri: documentUri,
          cid: 'bafy-document',
          record: {
            $type: 'site.standard.document',
            site: 'https://writing.example/blog',
            path: '/posts/hello',
            title: 'Hello',
          },
        },
      },
      actors: {},
    })
    const publication = getActivityRowContent({
      type: 'activity',
      key: publicationUri,
      activity: activity(publicationUri),
      associatedRecords: {
        [publicationUri]: {
          uri: publicationUri,
          cid: 'bafy-publication',
          record: {
            $type: 'site.standard.publication',
            name: 'A Publication',
            url: 'https://publication.example',
          },
        },
      },
      actors: {},
    })
    const subscription = getActivityRowContent({
      type: 'activity',
      key: subscriptionUri,
      activity: activity(subscriptionUri),
      associatedRecords: {
        [subscriptionUri]: {
          uri: subscriptionUri,
          cid: 'bafy-subscription',
          record: {
            $type: 'site.standard.graph.subscription',
            publication: publicationUri,
          },
        },
        [publicationUri]: {
          uri: publicationUri,
          cid: 'bafy-publication',
          record: {
            $type: 'site.standard.publication',
            name: 'A Publication',
            url: 'https://publication.example',
          },
        },
      },
      actors: {},
    })

    expect(document).toMatchObject({
      type: 'document',
      href: 'https://writing.example/posts/hello',
    })
    expect(publication).toMatchObject({
      type: 'publication',
      href: 'https://publication.example/',
    })
    expect(subscription).toMatchObject({
      type: 'subscription',
      href: 'https://publication.example/',
    })
  })

  it('distinguishes active and ended livestreams', () => {
    const baseItem: ActivityRowItem = {
      type: 'activity',
      key: livestreamUri,
      activity: activity(livestreamUri),
      associatedRecords: {
        [livestreamUri]: {
          uri: livestreamUri,
          cid: 'bafy-livestream',
          record: {
            $type: 'place.stream.livestream',
            title: 'Building in public',
            createdAt: '2026-09-04T15:00:00.000Z',
          },
        },
      },
      actors: {
        'did:plc:streamer': {
          did: 'did:plc:streamer',
          handle: 'streamer.example',
        },
      },
    }

    expect(getActivityRowContent(baseItem)).toMatchObject({
      type: 'livestream',
      title: 'Building in public',
      ended: false,
    })

    baseItem.associatedRecords[livestreamUri].record.endedAt =
      '2026-09-04T16:30:00.000Z'
    expect(getActivityRowContent(baseItem)).toMatchObject({
      type: 'livestream',
      title: 'Building in public',
      ended: true,
      durationInMinutes: 90,
    })
  })

  it('constructs a CDN image for a Grain photo', () => {
    const item: ActivityRowItem = {
      type: 'activity',
      key: photoUri,
      activity: activity(photoUri),
      associatedRecords: {
        [photoUri]: {
          uri: photoUri,
          cid: 'bafy-photo-record',
          record: {
            $type: 'social.grain.photo',
            alt: 'A bird perched on a branch.',
            photo: {
              ref: {
                $link:
                  'bafkreibflar7atvm5upuycojb4aiheylfqz5a5yxusx7m2ubyzuwncjug4',
              },
              mimeType: 'image/jpeg',
            },
            aspectRatio: {width: 2000, height: 1333},
            createdAt: '2026-06-11T14:49:07.509Z',
          },
        },
      },
      actors: {},
    }

    expect(getActivityRowContent(item)).toEqual({
      type: 'photo',
      actorDid: 'did:plc:photographer',
      actor: undefined,
      imageUri:
        'https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:photographer/bafkreibflar7atvm5upuycojb4aiheylfqz5a5yxusx7m2ubyzuwncjug4@jpeg',
      alt: 'A bird perched on a branch.',
      aspectRatio: 2000 / 1333,
    })
  })

  it('keeps unsupported and malformed records as generic rows', () => {
    const item: ActivityRowItem = {
      type: 'activity',
      key: 'at://did:plc:author/example.unknown/one',
      activity: activity('at://did:plc:author/example.unknown/one'),
      associatedRecords: {
        'at://did:plc:author/example.unknown/one': {
          uri: 'at://did:plc:author/example.unknown/one',
          cid: 'bafy-unknown',
          record: {$type: 'example.unknown'},
        },
      },
      actors: {},
    }

    expect(getActivityRowContent(item)).toEqual({
      type: 'generic',
      actorDid: 'did:plc:author',
      actor: undefined,
    })
  })
})
