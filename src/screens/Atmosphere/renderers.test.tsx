import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {fireEvent, render} from '@testing-library/react-native'

import {sanitizeHandle} from '#/lib/strings/handles'
import {ActivityPresentationRow} from './components/ActivityPresentationRow'
import {ACTIVITY_ROW_AVATAR_SIZE} from './constants'
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
const mockPublicationCard = jest.fn()
const mockStandardSiteEmbed = jest.fn()
const mockStandardSiteCompactDocumentCard = jest.fn()
const mockTimeElapsed = jest.fn()

jest.mock('expo-image', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Image: (props: Record<string, unknown>) => <View {...props} />,
  }
})

jest.mock('./debug', () => ({
  ...jest.requireActual('./debug'),
  isAtmosphereDebugEnabled: () => true,
}))

jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  utils: {rgbToHex: () => '#000000'},
  web: (styles: object) => styles,
  useTheme: () => ({
    atoms: {
      border_contrast_low: {},
      text: {color: '#111111'},
      text_inverted: {color: '#ffffff'},
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
      return <View testID="atmosphereAvatarStack" />
    },
  }
})
jest.mock('#/components/Button', () => {
  const {Pressable, View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Button: ({
      children,
      label,
      onPress,
      testID,
    }: React.PropsWithChildren<{
      label: string
      onPress: () => void
      testID?: string
    }>) => (
      <Pressable
        accessibilityHint=""
        accessibilityLabel={label}
        onPress={onPress}
        testID={testID}>
        {children}
      </Pressable>
    ),
    ButtonIcon: () => <View />,
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
jest.mock('#/components/Post/Embed/StandardSiteEmbed', () => {
  const {Text, View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    PublicationCard: ({themeColors, view}: Record<string, unknown>) => {
      mockPublicationCard({themeColors, view})
      const title =
        (view as {source?: {title?: string}} | undefined)?.source?.title ??
        'unknown-publication'
      return <View testID={`publication-${title}`} />
    },
    StandardSiteEmbed: ({view}: Record<string, unknown>) => {
      mockStandardSiteEmbed({view})
      const title = (view as {title?: string} | undefined)?.title ?? 'unknown'
      return <View testID={`full-document-${title}`} />
    },
    StandardSiteCompactDocumentCard: ({view}: Record<string, unknown>) => {
      mockStandardSiteCompactDocumentCard({view})
      const title = (view as {title?: string} | undefined)?.title ?? 'unknown'
      return (
        <View testID={`compact-document-${title}`}>
          <Text>{title}</Text>
        </View>
      )
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
  mockPublicationCard.mockClear()
  mockStandardSiteEmbed.mockClear()
  mockStandardSiteCompactDocumentCard.mockClear()
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
  if (
    !presentationItem?.computedItemView ||
    (presentationItem.item.type !== 'activity' &&
      presentationItem.item.type !== 'group')
  ) {
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

function activityHeaderLabel(
  action: string,
  timestamp = '2026-09-09T00:00:00.000Z',
) {
  return `${action} · elapsed:${timestamp}`
}

function buildActivity({
  collection,
  uri,
  indexedAt = '2026-09-09T00:00:00.000Z',
  subscribed = false,
}: {
  collection: string
  uri: string
  indexedAt?: string
  subscribed?: boolean
}) {
  return {
    $type: 'eric.bsky.atmosphere.getActivity#item' as const,
    record: {
      uri,
      cid: `cid-${uri.split('/').at(-1)}`,
      indexedAt,
    },
    collection,
    viewerState: {subscribed},
  }
}

function buildActor(did: string, handle: string, following?: string) {
  return {
    did,
    handle,
    avatar: `https://example.com/${did}.jpg`,
    viewer: following ? {following} : undefined,
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
  subscribed = false,
}: {
  collection: string
  actorDid: string
  associatedRecords?: AssociatedRecords
  actors?: ActivityActors
  indexedAt?: string
  rkey?: string
  subscribed?: boolean
}): ActivityRowItem {
  return {
    type: 'activity',
    key: `at://${actorDid}/${collection}/${rkey}`,
    activity: buildActivity({
      collection,
      uri: `at://${actorDid}/${collection}/${rkey}`,
      indexedAt,
      subscribed,
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
  associatedRecords = {},
  groupIndexedAt = '2026-09-09T00:00:00.000Z',
  itemIndexedAt = '2026-09-09T00:00:00.000Z',
  subscribedStates,
}: {
  collection: string
  actorDid: string
  count: number
  actors?: ActivityActors
  associatedRecords?: AssociatedRecords
  groupIndexedAt?: string
  itemIndexedAt?: string
  subscribedStates?: boolean[]
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
          subscribed: subscribedStates?.[index] ?? false,
        }),
      ),
    },
    associatedRecords,
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

describe('Atmosphere collection renderers', () => {
  it('renders a standalone row with the configured avatar stack, sanitized linked handle, action, and timestamp', () => {
    const actorDid = 'did:plc:chef'
    const row = buildActivityRow({
      collection: activityCollections.document,
      actorDid,
      actors: {
        [actorDid]: buildActor(actorDid, 'chef.example'),
      },
    })

    const screen = renderRow(row)

    expect(screen.getByTestId('atmosphereDocumentRow')).toBeTruthy()
    const headerText = screen.getByLabelText(
      activityHeaderLabel(
        `${handleLabel('chef.example')} published an article`,
      ),
    )

    expect(headerText).toBeTruthy()
    expect(headerText.props.numberOfLines).toBe(2)
    expect(screen.getByText(handleLabel('chef.example'))).toBeTruthy()
    expect(mockAvatarStack).toHaveBeenLastCalledWith(
      expect.objectContaining({
        size: ACTIVITY_ROW_AVATAR_SIZE,
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

  it('logs only the row-reachable objects while preserving their references', () => {
    const actorDid = 'did:plc:debug-chef'
    const publicationDid = 'did:plc:debug-publication'
    const irrelevantDid = 'did:plc:irrelevant'
    const rootUri = `at://${actorDid}/${activityCollections.document}/debug-document`
    const publicationUri = `at://${publicationDid}/${activityCollections.publication}/debug-publication`
    const irrelevantUri = `at://${irrelevantDid}/${activityCollections.document}/irrelevant`
    const rootRecord = buildAssociatedRecord(rootUri, {
      $type: activityCollections.document,
      site: publicationUri,
      title: 'Debug document',
      publishedAt: '2026-09-09T00:00:00.000Z',
    })
    const publicationRecord = buildAssociatedRecord(publicationUri, {
      $type: activityCollections.publication,
      name: 'Debug publication',
      url: 'https://debug.example',
    })
    const row = buildActivityRow({
      collection: activityCollections.document,
      actorDid,
      rkey: 'debug-document',
      associatedRecords: {
        [rootUri]: rootRecord,
        [publicationUri]: publicationRecord,
        [irrelevantUri]: buildAssociatedRecord(irrelevantUri, {
          $type: activityCollections.document,
        }),
      },
      actors: {
        [actorDid]: buildActor(actorDid, 'debug-chef.example'),
        [publicationDid]: buildActor(
          publicationDid,
          'debug-publication.example',
        ),
        [irrelevantDid]: buildActor(irrelevantDid, 'irrelevant.example'),
      },
    })
    const consoleLog = jest.spyOn(console, 'log').mockImplementation()

    const screen = renderRow(row)
    fireEvent.press(screen.getByTestId('atmosphereDebugButton'))

    const firstCall = consoleLog.mock.calls[0] as [ActivityRowItem] | undefined
    const loggedItem = firstCall?.[0]
    expect(loggedItem).not.toBe(row)
    expect(loggedItem?.activity).toBe(row.activity)
    expect(loggedItem?.associatedRecords).toEqual({
      [rootUri]: rootRecord,
      [publicationUri]: publicationRecord,
    })
    expect(loggedItem?.associatedRecords[rootUri]).toBe(rootRecord)
    expect(loggedItem?.associatedRecords[publicationUri]).toBe(
      publicationRecord,
    )
    expect(loggedItem?.actors).toEqual({
      [actorDid]: row.actors[actorDid],
      [publicationDid]: row.actors[publicationDid],
    })
    expect(loggedItem?.actors[actorDid]).toBe(row.actors[actorDid])
    consoleLog.mockRestore()
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
        activityHeaderLabel(
          `${handleLabel('alpha.test')} and 5 others recommended ${handleLabel('author.test')}’s article`,
        ),
      ),
    ).toBeTruthy()
    expect(mockAvatarStack).toHaveBeenLastCalledWith(
      expect.objectContaining({
        size: ACTIVITY_ROW_AVATAR_SIZE,
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
      ]),
    )
  })

  it('renders a publication-root body with the existing PublicationCard using computed theme colors', () => {
    const actorDid = 'did:plc:publication-owner'
    const publicationUri = `at://${actorDid}/${activityCollections.publication}/1`
    const row = buildActivityRow({
      collection: activityCollections.publication,
      actorDid,
      actors: {
        [actorDid]: buildActor(actorDid, 'publication-owner.test'),
      },
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
      rkey: '1',
    })

    const screen = renderRow(row)

    expect(screen.getByTestId('publication-Orbit Weekly')).toBeTruthy()
    expect(mockPublicationCard).toHaveBeenCalledWith(
      expect.objectContaining({
        view: expect.objectContaining({
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
        activityHeaderLabel(
          `${handleLabel('subscriber.test')} subscribed to Orbit Weekly`,
        ),
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

  it('renders full or compact document cards based on standalone subscription state', () => {
    const actorDid = 'did:plc:doc-body'
    const documentUri = `at://${actorDid}/${activityCollections.document}/1`
    const publicationUri = `at://did:plc:publication/${activityCollections.publication}/1`
    const subscribedRow = buildActivityRow({
      collection: activityCollections.document,
      actorDid,
      subscribed: true,
      actors: {
        [actorDid]: buildActor(actorDid, 'doc-body.test'),
        'did:plc:publication': buildActor(
          'did:plc:publication',
          'publication.test',
        ),
      },
      associatedRecords: {
        [documentUri]: buildAssociatedRecord(documentUri, {
          $type: activityCollections.document,
          site: publicationUri,
          path: 'essay',
          title: 'Body essay',
          publishedAt: '2026-09-09T00:00:00.000Z',
        }),
        [publicationUri]: buildAssociatedRecord(publicationUri, {
          $type: activityCollections.publication,
          name: 'Orbit Weekly',
          url: 'https://example.com/publications/orbit-weekly',
        }),
      },
      rkey: '1',
    })
    const unsubscribedRow = buildActivityRow({
      collection: activityCollections.document,
      actorDid: 'did:plc:doc-no-body',
      subscribed: false,
      actors: {
        'did:plc:doc-no-body': buildActor(
          'did:plc:doc-no-body',
          'doc-no-body.test',
        ),
      },
      associatedRecords: {
        'at://did:plc:doc-no-body/site.standard.document/1':
          buildAssociatedRecord(
            'at://did:plc:doc-no-body/site.standard.document/1',
            {
              $type: activityCollections.document,
              site: 'https://example.com',
              path: '/hidden',
              title: 'Hidden essay',
              publishedAt: '2026-09-09T00:00:00.000Z',
            },
          ),
      },
      rkey: '1',
    })

    const subscribedScreen = renderRow(subscribedRow)
    const unsubscribedScreen = renderRow(unsubscribedRow)

    expect(
      subscribedScreen.getByTestId('full-document-Body essay'),
    ).toBeTruthy()
    expect(
      unsubscribedScreen.queryByTestId('full-document-Hidden essay'),
    ).toBeNull()
    expect(
      unsubscribedScreen.getByTestId('compact-document-Hidden essay'),
    ).toBeTruthy()
    expect(
      unsubscribedScreen.getByLabelText(
        activityHeaderLabel(
          `${handleLabel('doc-no-body.test')} published an article`,
        ),
      ),
    ).toBeTruthy()
    expect(
      unsubscribedScreen.queryByLabelText(
        `${handleLabel('doc-no-body.test')} published an article Hidden essay`,
      ),
    ).toBeNull()
    expect(unsubscribedScreen.getByText('Hidden essay')).toBeTruthy()
    expect(mockStandardSiteEmbed).toHaveBeenCalledWith(
      expect.objectContaining({
        view: expect.objectContaining({
          title: 'Body essay',
          uri: 'https://example.com/publications/orbit-weekly/essay',
        }),
      }),
    )
  })

  it('renders only the first document from actor groups using aggregate subscription state', () => {
    const actorDid = 'did:plc:doc-group'
    const publicationUri = `at://did:plc:publication/${activityCollections.publication}/1`
    const allSubscribedRow = buildActorGroupRow({
      collection: activityCollections.document,
      actorDid,
      count: 2,
      subscribedStates: [true, true],
      actors: {
        [actorDid]: buildActor(actorDid, 'doc-group.test'),
        'did:plc:publication': buildActor(
          'did:plc:publication',
          'publication.test',
        ),
      },
      associatedRecords: {
        [`at://${actorDid}/${activityCollections.document}/1`]:
          buildAssociatedRecord(
            `at://${actorDid}/${activityCollections.document}/1`,
            {
              $type: activityCollections.document,
              site: publicationUri,
              path: 'one',
              title: 'Doc one',
              publishedAt: '2026-09-09T00:00:00.000Z',
            },
          ),
        [`at://${actorDid}/${activityCollections.document}/2`]:
          buildAssociatedRecord(
            `at://${actorDid}/${activityCollections.document}/2`,
            {
              $type: activityCollections.document,
              site: publicationUri,
              path: 'two',
              title: 'Doc two',
              publishedAt: '2026-09-09T00:00:00.000Z',
            },
          ),
        [publicationUri]: buildAssociatedRecord(publicationUri, {
          $type: activityCollections.publication,
          name: 'Orbit Weekly',
          url: 'https://example.com/publications/orbit-weekly',
        }),
      },
    })
    const mixedSubscriptionRow = buildActorGroupRow({
      collection: activityCollections.document,
      actorDid: 'did:plc:doc-group-mixed',
      count: 2,
      subscribedStates: [true, false],
      actors: {
        'did:plc:doc-group-mixed': buildActor(
          'did:plc:doc-group-mixed',
          'doc-group-mixed.test',
        ),
      },
      associatedRecords: {
        'at://did:plc:doc-group-mixed/site.standard.document/1':
          buildAssociatedRecord(
            'at://did:plc:doc-group-mixed/site.standard.document/1',
            {
              $type: activityCollections.document,
              site: 'https://example.com',
              path: '/one',
              title: 'Mixed one',
              publishedAt: '2026-09-09T00:00:00.000Z',
            },
          ),
        'at://did:plc:doc-group-mixed/site.standard.document/2':
          buildAssociatedRecord(
            'at://did:plc:doc-group-mixed/site.standard.document/2',
            {
              $type: activityCollections.document,
              site: 'https://example.com',
              path: '/two',
              title: 'Mixed two',
              publishedAt: '2026-09-09T00:00:00.000Z',
            },
          ),
      },
    })

    const noSubscriptionRow: ActivityGroupRowItem = {
      ...mixedSubscriptionRow,
      key: 'document-group-none',
      group: {
        ...mixedSubscriptionRow.group,
        id: 'document-group-none',
        items: mixedSubscriptionRow.group.items.map(item => ({
          ...item,
          viewerState: {subscribed: false},
        })),
      },
    }
    const allSubscribedScreen = renderRow(allSubscribedRow)
    const mixedScreen = renderRow(mixedSubscriptionRow)
    const noSubscriptionScreen = renderRow(noSubscriptionRow)

    expect(
      allSubscribedScreen.getByTestId('full-document-Doc one'),
    ).toBeTruthy()
    expect(
      allSubscribedScreen.queryByTestId('full-document-Doc two'),
    ).toBeNull()
    expect(mixedScreen.queryByTestId('full-document-Mixed one')).toBeNull()
    expect(
      noSubscriptionScreen.queryByTestId('full-document-Mixed one'),
    ).toBeNull()
    expect(mixedScreen.getByTestId('compact-document-Mixed one')).toBeTruthy()
    expect(mixedScreen.queryByTestId('compact-document-Mixed two')).toBeNull()
    expect(
      noSubscriptionScreen.getByTestId('compact-document-Mixed one'),
    ).toBeTruthy()
    expect(
      noSubscriptionScreen.queryByTestId('compact-document-Mixed two'),
    ).toBeNull()
    expect(
      mockStandardSiteEmbed.mock.calls.map(
        ([props]) => (props as {view: {title: string}}).view.title,
      ),
    ).toEqual(['Doc one'])
    expect(
      mockStandardSiteCompactDocumentCard.mock.calls.map(
        ([props]) => (props as {view: {title: string}}).view.title,
      ),
    ).toEqual(['Mixed one', 'Mixed one'])
  })

  it('renders at most one publication card body from the first valid hydrated publication view', () => {
    const actorDid = 'did:plc:subscriber-group'
    const firstRootUri = `at://${actorDid}/${activityCollections.subscription}/1`
    const secondRootUri = `at://${actorDid}/${activityCollections.subscription}/2`
    const thirdRootUri = `at://${actorDid}/${activityCollections.subscription}/3`
    const validPublicationUri = `at://did:plc:publication/${activityCollections.publication}/good`
    const laterPublicationUri = `at://did:plc:publication/${activityCollections.publication}/later`
    const row = buildActorGroupRow({
      collection: activityCollections.subscription,
      actorDid,
      count: 3,
      actors: {
        [actorDid]: buildActor(actorDid, 'subscriber-group.test'),
        'did:plc:publication': buildActor(
          'did:plc:publication',
          'publication.test',
        ),
      },
    })
    row.associatedRecords = {
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
    }

    const screen = renderRow(row)

    expect(screen.getByTestId('publication-Valid publication')).toBeTruthy()
    expect(screen.queryByTestId('publication-Later publication')).toBeNull()
    expect(mockPublicationCard).toHaveBeenCalledTimes(1)
    expect(mockPublicationCard).toHaveBeenCalledWith(
      expect.objectContaining({
        view: expect.objectContaining({
          uri: 'https://example.com/publications/valid',
        }),
      }),
    )
  })

  it('uses target-author following to choose compact or title-only standalone recommendation presentation', () => {
    const actorDid = 'did:plc:recommender-body'
    const documentAuthorDid = 'did:plc:document-author'
    const rootUri = `at://${actorDid}/${activityCollections.recommendation}/1`
    const documentUri = `at://${documentAuthorDid}/${activityCollections.document}/1`
    const row = buildActivityRow({
      collection: activityCollections.recommendation,
      actorDid,
      subscribed: false,
      actors: {
        [actorDid]: buildActor(actorDid, 'recommender-body.test'),
        [documentAuthorDid]: buildActor(
          documentAuthorDid,
          'document-author.test',
        ),
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
          path: '/essay',
          title: 'Referenced essay',
          publishedAt: '2026-09-09T00:00:00.000Z',
        }),
      },
      rkey: '1',
    })

    const followedRow: ActivityRowItem = {
      ...row,
      key: `${row.key}-followed`,
      actors: {
        ...row.actors,
        [documentAuthorDid]: buildActor(
          documentAuthorDid,
          'document-author.test',
          'at://did:plc:viewer/app.bsky.graph.follow/document-author',
        ),
      },
    }
    const unfollowedScreen = renderRow(row)
    const followedScreen = renderRow(followedRow)

    expect(
      unfollowedScreen.queryByTestId('full-document-Referenced essay'),
    ).toBeNull()
    expect(
      unfollowedScreen.queryByTestId('compact-document-Referenced essay'),
    ).toBeNull()
    expect(
      unfollowedScreen.getByLabelText(
        activityHeaderLabel(
          `${handleLabel('recommender-body.test')} recommended ${handleLabel('document-author.test')}’s article “Referenced essay”`,
        ),
      ),
    ).toBeTruthy()
    expect(
      followedScreen.getByTestId('compact-document-Referenced essay'),
    ).toBeTruthy()
    expect(
      followedScreen.getByLabelText(
        activityHeaderLabel(
          `${handleLabel('recommender-body.test')} recommended ${handleLabel('document-author.test')}’s article`,
        ),
      ),
    ).toBeTruthy()
    expect(
      followedScreen.queryByLabelText(
        activityHeaderLabel(
          `${handleLabel('recommender-body.test')} recommended ${handleLabel('document-author.test')}’s article “Referenced essay”`,
        ),
      ),
    ).toBeNull()
    expect(followedScreen.getByText('Referenced essay')).toBeTruthy()
    expect(mockStandardSiteEmbed).not.toHaveBeenCalled()
    expect(mockStandardSiteCompactDocumentCard).toHaveBeenCalledWith(
      expect.objectContaining({
        view: expect.objectContaining({
          title: 'Referenced essay',
          uri: 'https://example.com/essay',
        }),
      }),
    )
  })

  it('renders one full article card only for multi-person recommendation subject groups', () => {
    const documentAuthorDid = 'did:plc:shared-author'
    const documentUri = `at://${documentAuthorDid}/${activityCollections.document}/shared`
    const subjectGroup = buildSubjectGroupRow({
      collection: activityCollections.recommendation,
      subject: documentUri,
      actorDids: ['did:plc:alpha', 'did:plc:beta'],
      actors: {
        'did:plc:alpha': buildActor('did:plc:alpha', 'alpha.test'),
        'did:plc:beta': buildActor('did:plc:beta', 'beta.test'),
        [documentAuthorDid]: buildActor(
          documentAuthorDid,
          'shared-author.test',
        ),
      },
      associatedRecords: {
        [documentUri]: buildAssociatedRecord(documentUri, {
          $type: activityCollections.document,
          site: 'https://example.com',
          path: '/shared',
          title: 'Shared article',
          publishedAt: '2026-09-09T00:00:00.000Z',
        }),
      },
    })
    const fallbackRootUri = `at://did:plc:alpha/${activityCollections.recommendation}/1`
    const fallbackSubjectGroup: ActivityGroupRowItem = {
      ...subjectGroup,
      key: 'recommendation-subject-group-fallback',
      group: {
        ...subjectGroup.group,
        id: 'recommendation-subject-group-fallback',
        subject: undefined,
      },
      associatedRecords: {
        ...subjectGroup.associatedRecords,
        [fallbackRootUri]: buildAssociatedRecord(fallbackRootUri, {
          $type: activityCollections.recommendation,
          document: documentUri,
          createdAt: '2026-09-09T00:00:00.000Z',
        }),
      },
    }
    const oneChildSubjectGroup = buildSubjectGroupRow({
      collection: activityCollections.recommendation,
      subject: documentUri,
      actorDids: ['did:plc:alpha'],
      actors: {
        'did:plc:alpha': buildActor('did:plc:alpha', 'alpha.test'),
        [documentAuthorDid]: buildActor(
          documentAuthorDid,
          'shared-author.test',
        ),
      },
      associatedRecords: {
        [documentUri]: buildAssociatedRecord(documentUri, {
          $type: activityCollections.document,
          site: 'https://example.com',
          path: '/shared',
          title: 'Shared article',
          publishedAt: '2026-09-09T00:00:00.000Z',
        }),
      },
    })
    const followedOneChildSubjectGroup: ActivityGroupRowItem = {
      ...oneChildSubjectGroup,
      key: 'recommendation-subject-group-followed',
      actors: {
        ...oneChildSubjectGroup.actors,
        [documentAuthorDid]: buildActor(
          documentAuthorDid,
          'shared-author.test',
          'at://did:plc:viewer/app.bsky.graph.follow/shared-author',
        ),
      },
    }
    const actorGroup = buildActorGroupRow({
      collection: activityCollections.recommendation,
      actorDid: 'did:plc:recommender',
      count: 2,
      actors: {
        'did:plc:recommender': buildActor(
          'did:plc:recommender',
          'recommender.test',
        ),
      },
    })

    const subjectGroupScreen = renderRow(subjectGroup)
    const fallbackSubjectGroupScreen = renderRow(fallbackSubjectGroup)
    const oneChildSubjectGroupScreen = renderRow(oneChildSubjectGroup)
    const followedOneChildSubjectGroupScreen = renderRow(
      followedOneChildSubjectGroup,
    )
    const actorGroupScreen = renderRow(actorGroup)

    expect(
      subjectGroupScreen.getByTestId('full-document-Shared article'),
    ).toBeTruthy()
    expect(
      fallbackSubjectGroupScreen.getByTestId('full-document-Shared article'),
    ).toBeTruthy()
    expect(
      oneChildSubjectGroupScreen.queryByTestId('full-document-Shared article'),
    ).toBeNull()
    expect(
      oneChildSubjectGroupScreen.queryByTestId(
        'compact-document-Shared article',
      ),
    ).toBeNull()
    expect(
      followedOneChildSubjectGroupScreen.getByTestId(
        'compact-document-Shared article',
      ),
    ).toBeTruthy()
    expect(
      actorGroupScreen.queryByTestId('full-document-Shared article'),
    ).toBeNull()
    expect(
      actorGroupScreen.queryByTestId('compact-document-Shared article'),
    ).toBeNull()
    expect(
      actorGroupScreen.getByLabelText(
        activityHeaderLabel(
          `${handleLabel('recommender.test')} recommended 2 articles`,
        ),
      ),
    ).toBeTruthy()
    expect(mockStandardSiteEmbed).toHaveBeenCalledTimes(2)
    expect(mockStandardSiteCompactDocumentCard).toHaveBeenCalledWith(
      expect.objectContaining({
        view: expect.objectContaining({
          title: 'Shared article',
          uri: 'https://example.com/shared',
        }),
      }),
    )
    expect(mockStandardSiteEmbed).toHaveBeenCalledWith(
      expect.objectContaining({
        view: expect.objectContaining({
          title: 'Shared article',
          uri: 'https://example.com/shared',
        }),
      }),
    )
  })

  it('renders inline header timestamps from standalone and group indexedAt values', () => {
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
      standaloneScreen.getByText(` · elapsed:${standaloneTimestamp}`),
    ).toBeTruthy()
    expect(groupScreen.getByText(` · elapsed:${groupTimestamp}`)).toBeTruthy()
    expect(
      standaloneScreen.getByLabelText(
        activityHeaderLabel(
          `${handleLabel('footer-standalone.test')} published an article`,
          standaloneTimestamp,
        ),
      ),
    ).toBeTruthy()
    expect(
      groupScreen.getByLabelText(
        activityHeaderLabel(
          `${handleLabel('footer-group.test')} published 2 articles`,
          groupTimestamp,
        ),
      ),
    ).toBeTruthy()
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

    expect(screen.getByTestId('atmospherePublicationRow')).toBeTruthy()
    expect(
      screen.getByLabelText(
        activityHeaderLabel(
          `${handleLabel('pub-owner.test')} created 2 publications`,
        ),
      ),
    ).toBeTruthy()
    expect(screen.queryByText(/and .*others/)).toBeNull()
    expect(mockAvatarStack).toHaveBeenLastCalledWith(
      expect.objectContaining({
        size: ACTIVITY_ROW_AVATAR_SIZE,
        profiles: [expect.objectContaining({did: actorDid})],
      }),
    )
  })

  it('renders Grain photos in API order using their recorded aspect ratios', () => {
    const actorDid = 'did:plc:grain-photographer'
    const firstUri = `at://${actorDid}/${activityCollections.grainPhoto}/1`
    const secondUri = `at://${actorDid}/${activityCollections.grainPhoto}/2`
    const row = buildActorGroupRow({
      collection: activityCollections.grainPhoto,
      actorDid,
      count: 2,
      actors: {
        [actorDid]: buildActor(actorDid, 'grain-photographer.test'),
      },
      associatedRecords: {
        [firstUri]: buildAssociatedRecord(firstUri, {
          $type: activityCollections.grainPhoto,
          alt: 'Wide field of flowers',
          photo: {
            ref: {$link: 'bafywidephoto'},
            mimeType: 'image/jpeg',
          },
          aspectRatio: {width: 3, height: 2},
        }),
        [secondUri]: buildAssociatedRecord(secondUri, {
          $type: activityCollections.grainPhoto,
          alt: 'Tall stone arch',
          photo: {
            ref: {$link: 'bafytallphoto'},
            mimeType: 'image/png',
          },
          aspectRatio: {width: 4, height: 5},
        }),
      },
    })

    const screen = renderRow(row)
    const photos = screen.getAllByTestId('atmosphereGrainPhotoImage')

    expect(photos).toHaveLength(2)
    expect(photos[0].props.source).toEqual({
      uri: `https://cdn.bsky.app/img/feed_fullsize/plain/${actorDid}/bafywidephoto@jpeg`,
    })
    expect(photos[0].props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({aspectRatio: 3 / 2})]),
    )
    expect(photos[0].props.accessibilityLabel).toBe('Wide field of flowers')
    expect(photos[1].props.source).toEqual({
      uri: `https://cdn.bsky.app/img/feed_fullsize/plain/${actorDid}/bafytallphoto@png`,
    })
    expect(photos[1].props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({aspectRatio: 4 / 5})]),
    )
    expect(photos[1].props.accessibilityLabel).toBe('Tall stone arch')
  })

  it('renders only appview-provided livestream thumbnails at up to 200px wide', () => {
    const actorDid = 'did:plc:thumbnail-streamer'
    const rootUri = `at://${actorDid}/${activityCollections.livestream}/live`
    const row = buildActivityRow({
      collection: activityCollections.livestream,
      actorDid,
      rkey: 'live',
      actors: {
        [actorDid]: buildActor(actorDid, 'thumbnail-streamer.test'),
      },
      associatedRecords: {
        [rootUri]: buildAssociatedRecord(rootUri, {
          $type: activityCollections.livestream,
          title: 'Building in public',
          thumb: {
            ref: {$link: 'bafy-raw-thumb'},
            mimeType: 'image/jpeg',
          },
          createdAt: '2026-09-11T00:00:00.000Z',
        }),
      },
    })
    row.activity.view = {
      $type: 'eric.bsky.atmosphere.getActivity#livestreamView',
      thumb:
        'https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:thumbnail-streamer/bafy-view-thumb',
    }
    const withoutThumbnail = {
      ...row,
      key: `${row.key}-without-thumbnail`,
      activity: {
        ...row.activity,
        view: {
          $type: 'eric.bsky.atmosphere.getActivity#livestreamView' as const,
        },
      },
    }

    const screen = renderRow(row)
    const thumbnail = screen.getByTestId('atmosphereLivestreamThumbnail')
    const screenWithoutThumbnail = renderRow(withoutThumbnail)

    expect(thumbnail.props.source).toEqual({
      uri: 'https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:thumbnail-streamer/bafy-view-thumb',
    })
    expect(thumbnail.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({aspectRatio: 16 / 9, maxWidth: 200}),
      ]),
    )
    expect(thumbnail.props.accessibilityLabel).toBe('Building in public')
    expect(
      screenWithoutThumbnail.queryByTestId('atmosphereLivestreamThumbnail'),
    ).toBeNull()
  })

  it.each<{
    collection: KnownActivityCollection
    testID: string
    build: () => ActivityPresentationItem
    label: string
  }>([
    {
      collection: activityCollections.document,
      testID: 'atmosphereDocumentRow',
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
      testID: 'atmospherePublicationRow',
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
      testID: 'atmosphereRecommendationRow',
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
      testID: 'atmosphereSubscriptionRow',
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
      testID: 'atmosphereLivestreamRow',
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
      testID: 'atmosphereGrainPhotoRow',
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
    expect(screen.getByLabelText(activityHeaderLabel(label))).toBeTruthy()
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

    expect(screen.getByTestId('atmosphereUnknownRow')).toBeTruthy()
    expect(
      screen.getByLabelText(
        activityHeaderLabel(
          `${handleLabel('unknown-actor.test')} did something`,
        ),
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
        activityHeaderLabel(
          `${handleLabel('glitch-rec.test')} recommended an article`,
        ),
      ),
    ).toBeTruthy()
    expect(
      recommendationScreen.getByText(' · elapsed:2026-09-09T00:00:00.000Z'),
    ).toBeTruthy()
    expect(
      recommendationScreen.queryByTestId('compact-document-unknown'),
    ).toBeNull()
    expect(
      subscriptionScreen.getByLabelText(
        activityHeaderLabel(
          `${handleLabel('glitch-sub.test')} subscribed to a publication`,
        ),
      ),
    ).toBeTruthy()
    expect(mockStandardSiteEmbed).not.toHaveBeenCalled()
    expect(mockStandardSiteCompactDocumentCard).not.toHaveBeenCalled()
  })
})
