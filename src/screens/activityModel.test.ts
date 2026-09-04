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

function activity(uri: string) {
  return {
    uri,
    cid: `bafy-${uri.at(-1)}`,
    indexedAt: '2026-09-03T00:00:00.000Z',
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

    expect(items.map(item => item.activity.uri)).toEqual([
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
            title: 'Building a Small Web',
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
