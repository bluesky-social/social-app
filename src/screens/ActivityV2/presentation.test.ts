import {describe, expect, it} from '@jest/globals'

import {type ActivityGroupRowItem, type ActivityRowItem} from './model'
import {buildActivityPresentationListItems} from './presentation'
import {activityCollections} from './types'

function activity(
  uri: string,
  collection: string = activityCollections.document,
  subscribed = false,
) {
  return {
    $type: 'eric.bsky.atmosphere.getActivity#item' as const,
    record: {
      uri,
      cid: `cid-${uri.split('/').at(-1)}`,
      indexedAt: '2026-09-09T00:00:00.000Z',
    },
    collection,
    viewerState: {subscribed},
  }
}

function actor(did: string, handle: string) {
  return {
    did,
    handle,
    avatar: `https://example.com/${did}.jpg`,
  }
}

function getComputedView(item: ActivityRowItem | ActivityGroupRowItem) {
  const [presentationItem] = buildActivityPresentationListItems([item])
  return presentationItem?.computedItemView
}

describe('ActivityV2 presentation', () => {
  it('excludes unknown and invalid actors from subject-group stacks and counts', () => {
    const row: ActivityGroupRowItem = {
      type: 'group',
      key: 'group-subject',
      group: {
        $type: 'eric.bsky.atmosphere.getActivity#group',
        id: 'group-subject',
        groupBy: 'subject',
        collection: activityCollections.grainPhoto,
        indexedAt: '2026-09-09T00:00:00.000Z',
        subject: 'at://did:plc:subject/social.grain.photo/subject',
        items: [
          activity(
            'at://did:plc:alice/social.grain.photo/1',
            activityCollections.grainPhoto,
          ),
          activity(
            'at://did:plc:ghost/social.grain.photo/2',
            activityCollections.grainPhoto,
          ),
          activity(
            'at://did:plc:bob/social.grain.photo/3',
            activityCollections.grainPhoto,
          ),
          activity(
            'at://did:plc:alice/social.grain.photo/4',
            activityCollections.grainPhoto,
          ),
          activity(
            'at://did:plc:bad/social.grain.photo/5',
            activityCollections.grainPhoto,
          ),
        ],
      },
      associatedRecords: {},
      actors: {
        'did:plc:alice': actor('did:plc:alice', 'alice.test'),
        'did:plc:bob': actor('did:plc:bob', 'bob.test'),
        'did:plc:bad': actor('did:plc:bad', 'handle.invalid'),
      },
    }

    const computedItemView = getComputedView(row)

    expect(computedItemView?.actorPresentation.primary.did).toBe(
      'did:plc:alice',
    )
    expect(
      computedItemView?.actorPresentation.usableActors.map(value => value.did),
    ).toEqual(['did:plc:alice', 'did:plc:bob'])
    expect(computedItemView?.actorPresentation.othersCount).toBe(1)
    expect(
      computedItemView?.actorPresentation.profiles.map(profile => profile.did),
    ).toEqual(['did:plc:alice', 'did:plc:bob'])
  })

  it('hoists timestamp, relationship data, and explicit subscription summary into computedItemView', () => {
    const rootUri = 'at://did:plc:recommender/site.standard.graph.recommend/1'
    const documentUri = 'at://did:plc:author/site.standard.document/1'
    const row: ActivityRowItem = {
      type: 'activity',
      key: rootUri,
      activity: activity(rootUri, activityCollections.recommendation, true),
      associatedRecords: {
        [rootUri]: {
          uri: rootUri,
          cid: 'cid-root',
          record: {
            $type: activityCollections.recommendation,
            document: documentUri,
            createdAt: '2026-09-09T00:00:00.000Z',
          },
        },
        [documentUri]: {
          uri: documentUri,
          cid: 'cid-document',
          record: {
            $type: activityCollections.document,
            site: 'https://example.com',
            path: '/essay',
            title: 'Essay',
            publishedAt: '2026-09-08T00:00:00.000Z',
          },
        },
      },
      actors: {
        'did:plc:recommender': actor('did:plc:recommender', 'recommender.test'),
        'did:plc:author': actor('did:plc:author', 'author.test'),
      },
    }
    const group: ActivityGroupRowItem = {
      type: 'group',
      key: 'subscription-group',
      group: {
        $type: 'eric.bsky.atmosphere.getActivity#group',
        id: 'subscription-group',
        groupBy: 'actor',
        collection: activityCollections.subscription,
        indexedAt: '2026-09-09T04:00:00.000Z',
        actor: 'did:plc:subscriber',
        items: [
          activity(
            'at://did:plc:subscriber/site.standard.graph.subscription/1',
            activityCollections.subscription,
            true,
          ),
          activity(
            'at://did:plc:subscriber/site.standard.graph.subscription/2',
            activityCollections.subscription,
            false,
          ),
        ],
      },
      associatedRecords: {},
      actors: {
        'did:plc:subscriber': actor('did:plc:subscriber', 'subscriber.test'),
      },
    }

    const rowComputedView = getComputedView(row)
    const groupComputedView = getComputedView(group)

    expect(rowComputedView).toEqual(
      expect.objectContaining({
        rootCollection: activityCollections.recommendation,
        timestamp: '2026-09-09T00:00:00.000Z',
        group: {kind: 'standalone', count: 1},
        subscriptionState: 'all',
        roots: [
          expect.objectContaining({
            uri: rootUri,
            isSubscribed: true,
          }),
        ],
        relationships: {
          recommendation: {
            document: expect.objectContaining({
              uri: documentUri,
              title: 'Essay',
              url: 'https://example.com/essay',
              author: expect.objectContaining({
                did: 'did:plc:author',
                href: '/profile/author.test',
              }),
            }),
          },
          subscription: undefined,
        },
      }),
    )
    expect(groupComputedView).toEqual(
      expect.objectContaining({
        rootCollection: activityCollections.subscription,
        timestamp: '2026-09-09T04:00:00.000Z',
        group: {kind: 'actor', count: 2},
        subscriptionState: 'some',
        roots: [
          expect.objectContaining({isSubscribed: true}),
          expect.objectContaining({isSubscribed: false}),
        ],
      }),
    )
  })

  it('omits standalone and grouped rows that have no usable actors', () => {
    const standalone: ActivityRowItem = {
      type: 'activity',
      key: 'standalone',
      activity: activity('at://did:plc:ghost/site.standard.document/1'),
      associatedRecords: {},
      actors: {},
    }
    const group: ActivityGroupRowItem = {
      type: 'group',
      key: 'group',
      group: {
        $type: 'eric.bsky.atmosphere.getActivity#group',
        id: 'group',
        groupBy: 'actor',
        collection: activityCollections.document,
        indexedAt: '2026-09-09T00:00:00.000Z',
        actor: 'did:plc:ghost',
        items: [
          activity('at://did:plc:ghost/site.standard.document/1'),
          activity('at://did:plc:ghost/site.standard.document/2'),
        ],
      },
      associatedRecords: {},
      actors: {},
    }

    expect(buildActivityPresentationListItems([standalone])).toEqual([
      {item: {type: 'empty', key: 'empty'}, computedItemView: undefined},
    ])
    expect(buildActivityPresentationListItems([group])).toEqual([
      {item: {type: 'empty', key: 'empty'}, computedItemView: undefined},
    ])
  })
})
