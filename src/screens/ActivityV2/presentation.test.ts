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

function buildAssociatedRecord(uri: string, record: Record<string, unknown>) {
  return {
    uri,
    cid: `cid-${uri.split('/').at(-1)}`,
    record,
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

  it('hoists initial article body eligibility and body-ready external views into computedItemView', () => {
    const publicationUri = `at://did:plc:publication/${activityCollections.publication}/1`
    const subscribedDocumentUri = `at://did:plc:author/${activityCollections.document}/subscribed`
    const unsubscribedDocumentUri = `at://did:plc:author/${activityCollections.document}/unsubscribed`
    const subscribedRow: ActivityRowItem = {
      type: 'activity',
      key: subscribedDocumentUri,
      activity: activity(
        subscribedDocumentUri,
        activityCollections.document,
        true,
      ),
      associatedRecords: {
        [subscribedDocumentUri]: buildAssociatedRecord(subscribedDocumentUri, {
          $type: activityCollections.document,
          site: publicationUri,
          path: 'subscribed',
          title: 'Subscribed essay',
          publishedAt: '2026-09-09T00:00:00.000Z',
        }),
        [publicationUri]: buildAssociatedRecord(publicationUri, {
          $type: activityCollections.publication,
          name: 'Orbit Weekly',
          url: 'https://example.com/publications/orbit-weekly',
        }),
      },
      actors: {
        'did:plc:author': actor('did:plc:author', 'author.test'),
        'did:plc:publication': actor('did:plc:publication', 'publication.test'),
      },
    }
    const unsubscribedRow: ActivityRowItem = {
      type: 'activity',
      key: unsubscribedDocumentUri,
      activity: activity(
        unsubscribedDocumentUri,
        activityCollections.document,
        false,
      ),
      associatedRecords: {
        [unsubscribedDocumentUri]: buildAssociatedRecord(
          unsubscribedDocumentUri,
          {
            $type: activityCollections.document,
            site: 'https://example.com',
            path: '/unsubscribed',
            title: 'Unsubscribed essay',
            publishedAt: '2026-09-09T00:00:00.000Z',
          },
        ),
      },
      actors: {
        'did:plc:author': actor('did:plc:author', 'author.test'),
      },
    }
    const subscribedGroup: ActivityGroupRowItem = {
      type: 'group',
      key: 'subscribed-group',
      group: {
        $type: 'eric.bsky.atmosphere.getActivity#group',
        id: 'subscribed-group',
        groupBy: 'actor',
        collection: activityCollections.document,
        indexedAt: '2026-09-09T04:00:00.000Z',
        actor: 'did:plc:author',
        items: [
          activity(
            `at://did:plc:author/${activityCollections.document}/1`,
            activityCollections.document,
            true,
          ),
          activity(
            `at://did:plc:author/${activityCollections.document}/2`,
            activityCollections.document,
            true,
          ),
        ],
      },
      associatedRecords: {
        [`at://did:plc:author/${activityCollections.document}/1`]:
          buildAssociatedRecord(
            `at://did:plc:author/${activityCollections.document}/1`,
            {
              $type: activityCollections.document,
              site: publicationUri,
              path: 'one',
              title: 'First grouped essay',
              publishedAt: '2026-09-09T00:00:00.000Z',
            },
          ),
        [`at://did:plc:author/${activityCollections.document}/2`]:
          buildAssociatedRecord(
            `at://did:plc:author/${activityCollections.document}/2`,
            {
              $type: activityCollections.document,
              site: publicationUri,
              path: 'two',
              title: 'Second grouped essay',
              publishedAt: '2026-09-09T00:00:00.000Z',
            },
          ),
        [publicationUri]: buildAssociatedRecord(publicationUri, {
          $type: activityCollections.publication,
          name: 'Orbit Weekly',
          url: 'https://example.com/publications/orbit-weekly',
        }),
      },
      actors: {
        'did:plc:author': actor('did:plc:author', 'author.test'),
        'did:plc:publication': actor('did:plc:publication', 'publication.test'),
      },
    }
    const mixedGroup: ActivityGroupRowItem = {
      ...subscribedGroup,
      key: 'mixed-group',
      group: {
        ...subscribedGroup.group,
        id: 'mixed-group',
        items: [
          activity(
            `at://did:plc:author/${activityCollections.document}/1`,
            activityCollections.document,
            true,
          ),
          activity(
            `at://did:plc:author/${activityCollections.document}/2`,
            activityCollections.document,
            false,
          ),
        ],
      },
    }

    expect(getComputedView(subscribedRow)?.body).toEqual(
      expect.objectContaining({
        kind: 'article-embeds',
        views: [
          expect.objectContaining({
            title: 'Subscribed essay',
            uri: 'https://example.com/publications/orbit-weekly/subscribed',
          }),
        ],
      }),
    )
    expect(getComputedView(unsubscribedRow)?.body).toBeUndefined()
    expect(getComputedView(subscribedGroup)?.body).toEqual(
      expect.objectContaining({
        kind: 'article-embeds',
        views: [
          expect.objectContaining({title: 'First grouped essay'}),
          expect.objectContaining({title: 'Second grouped essay'}),
        ],
      }),
    )
    expect(getComputedView(mixedGroup)?.body).toBeUndefined()
  })

  it('hoists publication-root body views, theme colors, refs, and profiles into computedItemView', () => {
    const actorDid = 'did:plc:publication-owner'
    const publicationUri = `at://${actorDid}/${activityCollections.publication}/1`
    const row: ActivityRowItem = {
      type: 'activity',
      key: publicationUri,
      activity: activity(
        publicationUri,
        activityCollections.publication,
        false,
      ),
      associatedRecords: {
        [publicationUri]: buildAssociatedRecord(publicationUri, {
          $type: activityCollections.publication,
          name: 'Orbit Weekly',
          url: 'https://example.com/publications/orbit-weekly',
          basicTheme: {
            accent: {r: 1, g: 2, b: 3},
            accentForeground: {r: 254, g: 253, b: 252},
          },
        }),
      },
      actors: {
        [actorDid]: actor(actorDid, 'publication-owner.test'),
      },
    }
    const invalidRow: ActivityRowItem = {
      ...row,
      key: `${publicationUri}-invalid`,
      activity: activity(
        publicationUri,
        activityCollections.publication,
        false,
      ),
      associatedRecords: {
        [publicationUri]: buildAssociatedRecord(publicationUri, {
          $type: activityCollections.publication,
          name: 'Broken publication',
          url: 'notaurl',
        }),
      },
    }

    expect(getComputedView(row)?.body).toEqual(
      expect.objectContaining({
        kind: 'publication-card',
        view: expect.objectContaining({
          title: 'Orbit Weekly',
          uri: 'https://example.com/publications/orbit-weekly',
          associatedRefs: [expect.objectContaining({uri: publicationUri})],
          associatedProfiles: [expect.objectContaining({did: actorDid})],
        }),
        themeColors: {
          custom: true,
          accent: '#010203',
          accentForeground: '#fefdfc',
        },
      }),
    )
    expect(getComputedView(invalidRow)?.body).toBeUndefined()
  })

  it('keeps recommendation bodies empty even when a referenced document is hydrated, because article bodies are document-root only', () => {
    const actorDid = 'did:plc:recommender'
    const documentAuthorDid = 'did:plc:author'
    const rootUri = `at://${actorDid}/${activityCollections.recommendation}/1`
    const documentUri = `at://${documentAuthorDid}/${activityCollections.document}/1`
    const row: ActivityRowItem = {
      type: 'activity',
      key: rootUri,
      activity: activity(rootUri, activityCollections.recommendation, false),
      associatedRecords: {
        [rootUri]: buildAssociatedRecord(rootUri, {
          $type: activityCollections.recommendation,
          document: documentUri,
          createdAt: '2026-09-09T00:00:00.000Z',
        }),
        [documentUri]: buildAssociatedRecord(documentUri, {
          $type: activityCollections.document,
          site: 'https://example.com',
          path: 'essay',
          title: 'Referenced essay',
          publishedAt: '2026-09-09T00:00:00.000Z',
        }),
      },
      actors: {
        [actorDid]: actor(actorDid, 'recommender.test'),
        [documentAuthorDid]: actor(documentAuthorDid, 'author.test'),
      },
    }

    expect(getComputedView(row)?.body).toBeUndefined()
  })

  it('hoists initial publication body selection into computedItemView using the first valid hydrated target in API order', () => {
    const actorDid = 'did:plc:subscriber'
    const firstRootUri = `at://${actorDid}/${activityCollections.subscription}/1`
    const secondRootUri = `at://${actorDid}/${activityCollections.subscription}/2`
    const thirdRootUri = `at://${actorDid}/${activityCollections.subscription}/3`
    const validPublicationUri = `at://did:plc:publication/${activityCollections.publication}/good`
    const laterPublicationUri = `at://did:plc:publication/${activityCollections.publication}/later`
    const row: ActivityGroupRowItem = {
      type: 'group',
      key: 'subscription-group',
      group: {
        $type: 'eric.bsky.atmosphere.getActivity#group',
        id: 'subscription-group',
        groupBy: 'actor',
        collection: activityCollections.subscription,
        indexedAt: '2026-09-09T04:00:00.000Z',
        actor: actorDid,
        items: [
          activity(firstRootUri, activityCollections.subscription, false),
          activity(secondRootUri, activityCollections.subscription, false),
          activity(thirdRootUri, activityCollections.subscription, false),
        ],
      },
      associatedRecords: {
        [firstRootUri]: buildAssociatedRecord(firstRootUri, {
          $type: activityCollections.subscription,
          publication:
            'at://did:plc:publication/site.standard.publication/missing',
        }),
        [secondRootUri]: buildAssociatedRecord(secondRootUri, {
          $type: activityCollections.subscription,
          publication: validPublicationUri,
        }),
        [thirdRootUri]: buildAssociatedRecord(thirdRootUri, {
          $type: activityCollections.subscription,
          publication: laterPublicationUri,
        }),
        [validPublicationUri]: buildAssociatedRecord(validPublicationUri, {
          $type: activityCollections.publication,
          name: 'Valid publication',
          url: 'https://example.com/publications/valid',
        }),
        [laterPublicationUri]: buildAssociatedRecord(laterPublicationUri, {
          $type: activityCollections.publication,
          name: 'Later publication',
          url: 'https://example.com/publications/later',
        }),
      },
      actors: {
        [actorDid]: actor(actorDid, 'subscriber.test'),
        'did:plc:publication': actor('did:plc:publication', 'publication.test'),
      },
    }

    expect(getComputedView(row)?.body).toEqual(
      expect.objectContaining({
        kind: 'publication-card',
        view: expect.objectContaining({
          title: 'Valid publication',
          uri: 'https://example.com/publications/valid',
        }),
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
