import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {render} from '@testing-library/react-native'

import {sanitizeHandle} from '#/lib/strings/handles'
import {ActivityPresentationRow} from './components/ActivityPresentationRow'
import {type ActivityGroupRowItem, type ActivityRowItem} from './model'
import {
  type ActivityPresentationItem,
  type ActivityPresentationProps,
  buildActivityPresentationListItems,
} from './presentation'
import {
  type ActivityActors,
  activityCollections,
  type AssociatedRecords,
  type KnownActivityCollection,
} from './types'

const mockAvatarStack = jest.fn()
const mockInlineLinkText = jest.fn()
const mockTimeElapsed = jest.fn()

jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  useTheme: () => ({
    atoms: {
      border_contrast_low: {},
      text: {},
      text_contrast_medium: {},
      text_link: {color: '#0a7aff'},
      bg: {backgroundColor: '#ffffff'},
    },
  }),
}))
jest.mock('#/components/AvatarStack', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    AvatarStack: (props: unknown) => {
      mockAvatarStack(props)
      return <View testID="activityV2AvatarStack" />
    },
  }
})
jest.mock('#/components/Link', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    InlineLinkText: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => {
      mockInlineLinkText({children, ...props})
      return <Text {...props}>{children}</Text>
    },
  }
})
jest.mock('#/components/Typography', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Text}
})
jest.mock('#/view/com/util/TimeElapsed', () => ({
  TimeElapsed: ({
    children,
    timestamp,
  }: {
    timestamp: string
    children: (value: {timeElapsed: string}) => React.ReactNode
  }) => {
    mockTimeElapsed({timestamp})
    return children({timeElapsed: `elapsed:${timestamp}`})
  },
}))

i18n.loadAndActivate({locale: 'en', messages: {}})

beforeEach(() => {
  mockAvatarStack.mockClear()
  mockInlineLinkText.mockClear()
  mockTimeElapsed.mockClear()
})

function renderRow(item: ActivityPresentationItem) {
  const presentationItem = buildSinglePresentationItem(item)

  return render(
    <I18nProvider i18n={i18n}>
      <ActivityPresentationRow
        item={presentationItem.item}
        computedItemView={presentationItem.computedItemView}
        hideTopBorder={false}
      />
    </I18nProvider>,
  )
}

function buildSinglePresentationItem(
  item: ActivityPresentationItem,
): ActivityPresentationProps {
  const [presentationItem] = buildActivityPresentationListItems([item])
  if (!presentationItem?.computedItemView) {
    throw new Error('Expected usable computed view for row test')
  }

  return {
    item: presentationItem.item,
    computedItemView: presentationItem.computedItemView,
  }
}

function handleLabel(handle: string) {
  return sanitizeHandle(handle, '@')
}

function buildActivity({
  collection,
  uri,
  indexedAt = '2026-09-09T00:00:00.000Z',
}: {
  collection: string
  uri: string
  indexedAt?: string
}) {
  return {
    $type: 'eric.bsky.atmosphere.getActivity#item' as const,
    record: {
      uri,
      cid: `cid-${uri.split('/').at(-1)}`,
      indexedAt,
    },
    collection,
    viewerState: {subscribed: false},
  }
}

function buildActor(did: string, handle: string) {
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

function buildActivityRow({
  collection,
  actorDid,
  associatedRecords = {},
  actors = {},
  indexedAt = '2026-09-09T00:00:00.000Z',
  rkey = '1',
}: {
  collection: string
  actorDid: string
  associatedRecords?: AssociatedRecords
  actors?: ActivityActors
  indexedAt?: string
  rkey?: string
}): ActivityRowItem {
  return {
    type: 'activity',
    key: `at://${actorDid}/${collection}/${rkey}`,
    activity: buildActivity({
      collection,
      uri: `at://${actorDid}/${collection}/${rkey}`,
      indexedAt,
    }),
    associatedRecords,
    actors,
  }
}

function buildActorGroupRow({
  collection,
  actorDid,
  count,
  actors = {},
  groupIndexedAt = '2026-09-09T00:00:00.000Z',
  itemIndexedAt = '2026-09-09T00:00:00.000Z',
}: {
  collection: string
  actorDid: string
  count: number
  actors?: ActivityActors
  groupIndexedAt?: string
  itemIndexedAt?: string
}): ActivityGroupRowItem {
  return {
    type: 'group',
    key: `${collection}-actor-group`,
    group: {
      $type: 'eric.bsky.atmosphere.getActivity#group',
      id: `${collection}-actor-group`,
      groupBy: 'actor',
      collection,
      indexedAt: groupIndexedAt,
      actor: actorDid,
      items: Array.from({length: count}, (_, index) =>
        buildActivity({
          collection,
          uri: `at://${actorDid}/${collection}/${index + 1}`,
          indexedAt: itemIndexedAt,
        }),
      ),
    },
    associatedRecords: {},
    actors,
  }
}

function buildSubjectGroupRow({
  collection,
  subject,
  actorDids,
  actors = {},
  associatedRecords = {},
}: {
  collection: string
  subject: string
  actorDids: string[]
  actors?: ActivityActors
  associatedRecords?: AssociatedRecords
}): ActivityGroupRowItem {
  return {
    type: 'group',
    key: `${collection}-subject-group`,
    group: {
      $type: 'eric.bsky.atmosphere.getActivity#group',
      id: `${collection}-subject-group`,
      groupBy: 'subject',
      collection,
      indexedAt: '2026-09-09T00:00:00.000Z',
      subject,
      items: actorDids.map((actorDid, index) =>
        buildActivity({
          collection,
          uri: `at://${actorDid}/${collection}/${index + 1}`,
        }),
      ),
    },
    associatedRecords,
    actors,
  }
}

describe('ActivityV2 collection renderers', () => {
  it('renders a standalone row with a 36px avatar stack, sanitized linked handle, and configured action', () => {
    const actorDid = 'did:plc:chef'
    const row = buildActivityRow({
      collection: activityCollections.document,
      actorDid,
      actors: {
        [actorDid]: buildActor(actorDid, 'chef.example'),
      },
    })

    const screen = renderRow(row)

    expect(screen.getByTestId('activityV2DocumentRow')).toBeTruthy()
    const headerText = screen.getByLabelText(
      `${handleLabel('chef.example')} published an article`,
    )

    expect(headerText).toBeTruthy()
    expect(headerText.props.numberOfLines).toBe(2)
    expect(screen.getByText(handleLabel('chef.example'))).toBeTruthy()
    expect(screen.getByText('elapsed:2026-09-09T00:00:00.000Z')).toBeTruthy()
    expect(mockAvatarStack).toHaveBeenLastCalledWith(
      expect.objectContaining({
        size: 36,
        profiles: [expect.objectContaining({did: actorDid})],
      }),
    )
    expect(mockInlineLinkText).toHaveBeenLastCalledWith(
      expect.objectContaining({
        to: '/profile/chef.example',
        children: handleLabel('chef.example'),
        style: expect.arrayContaining([
          expect.objectContaining({color: 'white'}),
        ]),
      }),
    )
  })

  it('renders subject groups with up to five usable actor avatars in API order and counts all usable others', () => {
    const documentAuthorDid = 'did:plc:document-author'
    const documentUri = `at://${documentAuthorDid}/${activityCollections.document}/target`
    const row = buildSubjectGroupRow({
      collection: activityCollections.recommendation,
      subject: documentUri,
      actorDids: [
        'did:plc:alpha',
        'did:plc:beta',
        'did:plc:gamma',
        'did:plc:delta',
        'did:plc:epsilon',
        'did:plc:zeta',
        'did:plc:ghost',
        'did:plc:alpha',
      ],
      actors: {
        'did:plc:alpha': buildActor('did:plc:alpha', 'alpha.test'),
        'did:plc:beta': buildActor('did:plc:beta', 'beta.test'),
        'did:plc:gamma': buildActor('did:plc:gamma', 'gamma.test'),
        'did:plc:delta': buildActor('did:plc:delta', 'delta.test'),
        'did:plc:epsilon': buildActor('did:plc:epsilon', 'epsilon.test'),
        'did:plc:zeta': buildActor('did:plc:zeta', 'zeta.test'),
        [documentAuthorDid]: buildActor(documentAuthorDid, 'author.test'),
      },
      associatedRecords: {
        [documentUri]: buildAssociatedRecord(documentUri, {
          $type: activityCollections.document,
          site: 'https://example.com',
          path: '/spiral-tide',
          title: 'Spiral tide',
          publishedAt: '2026-09-09T00:00:00.000Z',
        }),
      },
    })

    const screen = renderRow(row)

    expect(
      screen.getByLabelText(
        `${handleLabel('alpha.test')} and 5 others recommended ${handleLabel('author.test')}’s article “Spiral tide”`,
      ),
    ).toBeTruthy()
    expect(mockAvatarStack).toHaveBeenLastCalledWith(
      expect.objectContaining({
        size: 36,
        profiles: [
          expect.objectContaining({did: 'did:plc:alpha'}),
          expect.objectContaining({did: 'did:plc:beta'}),
          expect.objectContaining({did: 'did:plc:gamma'}),
          expect.objectContaining({did: 'did:plc:delta'}),
          expect.objectContaining({did: 'did:plc:epsilon'}),
        ],
      }),
    )

    const linkProps = mockInlineLinkText.mock.calls.map(([props]) => props)
    expect(linkProps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          to: '/profile/alpha.test',
          children: handleLabel('alpha.test'),
          style: expect.arrayContaining([
            expect.objectContaining({color: 'white'}),
          ]),
        }),
        expect.objectContaining({
          to: '/profile/author.test',
          children: handleLabel('author.test'),
          style: expect.arrayContaining([
            expect.objectContaining({color: 'white'}),
          ]),
        }),
        expect.objectContaining({
          to: 'https://example.com/spiral-tide',
          children: 'Spiral tide',
          disableMismatchWarning: true,
          style: expect.arrayContaining([
            expect.objectContaining({color: 'white'}),
          ]),
        }),
      ]),
    )
  })

  it('links publication titles in subscription activity with the shared link styling', () => {
    const actorDid = 'did:plc:subscriber'
    const rootUri = `at://${actorDid}/${activityCollections.subscription}/1`
    const publicationUri = `at://did:plc:publication/${activityCollections.publication}/1`
    const row = buildActivityRow({
      collection: activityCollections.subscription,
      actorDid,
      actors: {
        [actorDid]: buildActor(actorDid, 'subscriber.test'),
      },
      associatedRecords: {
        [rootUri]: buildAssociatedRecord(rootUri, {
          $type: activityCollections.subscription,
          publication: publicationUri,
          createdAt: '2026-09-09T00:00:00.000Z',
        }),
        [publicationUri]: buildAssociatedRecord(publicationUri, {
          $type: activityCollections.publication,
          name: 'Orbit Weekly',
          url: 'https://example.com/publications/orbit-weekly',
        }),
      },
      rkey: '1',
    })

    const screen = renderRow(row)

    expect(
      screen.getByLabelText(
        `${handleLabel('subscriber.test')} subscribed to Orbit Weekly`,
      ),
    ).toBeTruthy()

    const linkProps = mockInlineLinkText.mock.calls.map(([props]) => props)
    expect(linkProps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          to: '/profile/subscriber.test',
          children: handleLabel('subscriber.test'),
          style: expect.arrayContaining([
            expect.objectContaining({color: 'white'}),
          ]),
        }),
        expect.objectContaining({
          to: 'https://example.com/publications/orbit-weekly',
          children: 'Orbit Weekly',
          disableMismatchWarning: true,
          style: expect.arrayContaining([
            expect.objectContaining({color: 'white'}),
          ]),
        }),
      ]),
    )
  })

  it('renders footer timestamps from standalone and group indexedAt values using TimeElapsed formatting', () => {
    const standaloneTimestamp = '2026-09-09T03:00:00.000Z'
    const groupTimestamp = '2026-09-09T04:00:00.000Z'
    const row = buildActivityRow({
      collection: activityCollections.document,
      actorDid: 'did:plc:footer-standalone',
      indexedAt: standaloneTimestamp,
      actors: {
        'did:plc:footer-standalone': buildActor(
          'did:plc:footer-standalone',
          'footer-standalone.test',
        ),
      },
    })
    const group = buildActorGroupRow({
      collection: activityCollections.document,
      actorDid: 'did:plc:footer-group',
      count: 2,
      groupIndexedAt: groupTimestamp,
      itemIndexedAt: '2026-09-09T05:00:00.000Z',
      actors: {
        'did:plc:footer-group': buildActor(
          'did:plc:footer-group',
          'footer-group.test',
        ),
      },
    })

    const standaloneScreen = renderRow(row)
    const groupScreen = renderRow(group)

    expect(
      standaloneScreen.getByText(`elapsed:${standaloneTimestamp}`),
    ).toBeTruthy()
    expect(groupScreen.getByText(`elapsed:${groupTimestamp}`)).toBeTruthy()
    expect(
      groupScreen.queryByText('elapsed:2026-09-09T05:00:00.000Z'),
    ).toBeNull()
    expect(mockTimeElapsed.mock.calls).toEqual([
      [{timestamp: standaloneTimestamp}],
      [{timestamp: groupTimestamp}],
    ])
  })

  it('renders actor groups with one actor, no others phrase, and pluralized action from group.items.length', () => {
    const actorDid = 'did:plc:pub-owner'
    const row = buildActorGroupRow({
      collection: activityCollections.publication,
      actorDid,
      count: 2,
      actors: {
        [actorDid]: buildActor(actorDid, 'pub-owner.test'),
      },
    })

    const screen = renderRow(row)

    expect(screen.getByTestId('activityV2PublicationRow')).toBeTruthy()
    expect(
      screen.getByLabelText(
        `${handleLabel('pub-owner.test')} created 2 publications`,
      ),
    ).toBeTruthy()
    expect(screen.queryByText(/and .*others/)).toBeNull()
    expect(mockAvatarStack).toHaveBeenLastCalledWith(
      expect.objectContaining({
        size: 36,
        profiles: [expect.objectContaining({did: actorDid})],
      }),
    )
  })

  it.each<{
    collection: KnownActivityCollection
    testID: string
    build: () => ActivityPresentationItem
    label: string
  }>([
    {
      collection: activityCollections.document,
      testID: 'activityV2DocumentRow',
      build: () =>
        buildActivityRow({
          collection: activityCollections.document,
          actorDid: 'did:plc:doc-author',
          actors: {
            'did:plc:doc-author': buildActor(
              'did:plc:doc-author',
              'doc-author.test',
            ),
          },
        }),
      label: `${handleLabel('doc-author.test')} published an article`,
    },
    {
      collection: activityCollections.publication,
      testID: 'activityV2PublicationRow',
      build: () =>
        buildActivityRow({
          collection: activityCollections.publication,
          actorDid: 'did:plc:publication-author',
          actors: {
            'did:plc:publication-author': buildActor(
              'did:plc:publication-author',
              'publication-author.test',
            ),
          },
        }),
      label: `${handleLabel('publication-author.test')} created a publication`,
    },
    {
      collection: activityCollections.recommendation,
      testID: 'activityV2RecommendationRow',
      build: () => {
        const actorDid = 'did:plc:recommender'
        const documentAuthorDid = 'did:plc:recommendation-target'
        const rootUri = `at://${actorDid}/${activityCollections.recommendation}/1`
        const documentUri = `at://${documentAuthorDid}/${activityCollections.document}/1`
        return buildActivityRow({
          collection: activityCollections.recommendation,
          actorDid,
          actors: {
            [actorDid]: buildActor(actorDid, 'recommender.test'),
            [documentAuthorDid]: buildActor(documentAuthorDid, 'target.test'),
          },
          associatedRecords: {
            [rootUri]: buildAssociatedRecord(rootUri, {
              $type: activityCollections.recommendation,
              document: documentUri,
              createdAt: '2026-09-09T00:00:00.000Z',
            }),
            [documentUri]: buildAssociatedRecord(documentUri, {
              $type: activityCollections.document,
              site: 'https://example.com',
              title: 'Article tide',
              publishedAt: '2026-09-09T00:00:00.000Z',
            }),
          },
          rkey: '1',
        })
      },
      label: `${handleLabel('recommender.test')} recommended ${handleLabel('target.test')}’s article “Article tide”`,
    },
    {
      collection: activityCollections.subscription,
      testID: 'activityV2SubscriptionRow',
      build: () => {
        const actorDid = 'did:plc:subscriber'
        const rootUri = `at://${actorDid}/${activityCollections.subscription}/1`
        const publicationUri = `at://did:plc:publication/${activityCollections.publication}/1`
        return buildActivityRow({
          collection: activityCollections.subscription,
          actorDid,
          actors: {
            [actorDid]: buildActor(actorDid, 'subscriber.test'),
          },
          associatedRecords: {
            [rootUri]: buildAssociatedRecord(rootUri, {
              $type: activityCollections.subscription,
              publication: publicationUri,
              createdAt: '2026-09-09T00:00:00.000Z',
            }),
            [publicationUri]: buildAssociatedRecord(publicationUri, {
              $type: activityCollections.publication,
              name: 'Orbit Weekly',
              url: 'https://example.com',
            }),
          },
          rkey: '1',
        })
      },
      label: `${handleLabel('subscriber.test')} subscribed to Orbit Weekly`,
    },
    {
      collection: activityCollections.livestream,
      testID: 'activityV2LivestreamRow',
      build: () => {
        const actorDid = 'did:plc:streamer'
        const rootUri = `at://${actorDid}/${activityCollections.livestream}/1`
        return buildActivityRow({
          collection: activityCollections.livestream,
          actorDid,
          actors: {
            [actorDid]: buildActor(actorDid, 'streamer.test'),
          },
          associatedRecords: {
            [rootUri]: buildAssociatedRecord(rootUri, {
              $type: activityCollections.livestream,
              createdAt: '2026-09-09T00:00:00.000Z',
              endedAt: '2026-09-09T01:00:00.000Z',
            }),
          },
          rkey: '1',
        })
      },
      label: `${handleLabel('streamer.test')} started a livestream`,
    },
    {
      collection: activityCollections.grainPhoto,
      testID: 'activityV2GrainPhotoRow',
      build: () =>
        buildActivityRow({
          collection: activityCollections.grainPhoto,
          actorDid: 'did:plc:photographer',
          actors: {
            'did:plc:photographer': buildActor(
              'did:plc:photographer',
              'photographer.test',
            ),
          },
        }),
      label: `${handleLabel('photographer.test')} posted a photo`,
    },
  ])('uses the $collection renderer', ({build, label, testID}) => {
    const screen = renderRow(build())

    expect(screen.getByTestId(testID)).toBeTruthy()
    expect(screen.getByLabelText(label)).toBeTruthy()
  })

  it('uses a safe generic fallback action for unknown collections', () => {
    const actorDid = 'did:plc:unknown-actor'
    const screen = renderRow(
      buildActivityRow({
        collection: 'example.unknown.collection',
        actorDid,
        actors: {
          [actorDid]: buildActor(actorDid, 'unknown-actor.test'),
        },
      }),
    )

    expect(screen.getByTestId('activityV2UnknownRow')).toBeTruthy()
    expect(
      screen.getByLabelText(
        `${handleLabel('unknown-actor.test')} did something`,
      ),
    ).toBeTruthy()
    expect(screen.queryByText('example.unknown.collection')).toBeNull()
  })

  it('degrades malformed recommendation and subscription sidecars safely', () => {
    const recommendationActorDid = 'did:plc:glitch-rec'
    const recommendationRootUri = `at://${recommendationActorDid}/${activityCollections.recommendation}/1`
    const recommendationScreen = renderRow(
      buildActivityRow({
        collection: activityCollections.recommendation,
        actorDid: recommendationActorDid,
        actors: {
          [recommendationActorDid]: buildActor(
            recommendationActorDid,
            'glitch-rec.test',
          ),
        },
        associatedRecords: {
          [recommendationRootUri]: buildAssociatedRecord(
            recommendationRootUri,
            {
              $type: activityCollections.recommendation,
              document: 'not-an-at-uri',
              createdAt: '2026-09-09T00:00:00.000Z',
            },
          ),
        },
        rkey: '1',
      }),
    )
    const subscriptionActorDid = 'did:plc:glitch-sub'
    const subscriptionRootUri = `at://${subscriptionActorDid}/${activityCollections.subscription}/1`
    const subscriptionScreen = renderRow(
      buildActivityRow({
        collection: activityCollections.subscription,
        actorDid: subscriptionActorDid,
        actors: {
          [subscriptionActorDid]: buildActor(
            subscriptionActorDid,
            'glitch-sub.test',
          ),
        },
        associatedRecords: {
          [subscriptionRootUri]: buildAssociatedRecord(subscriptionRootUri, {
            $type: activityCollections.subscription,
            publication: 'at://did:plc:publication/site.standard.publication/1',
            createdAt: '2026-09-09T00:00:00.000Z',
          }),
        },
        rkey: '1',
      }),
    )

    expect(
      recommendationScreen.getByLabelText(
        `${handleLabel('glitch-rec.test')} recommended an article`,
      ),
    ).toBeTruthy()
    expect(
      subscriptionScreen.getByLabelText(
        `${handleLabel('glitch-sub.test')} subscribed to a publication`,
      ),
    ).toBeTruthy()
  })
})
