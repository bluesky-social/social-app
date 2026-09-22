import {createContext} from 'react'
import {type PressableProps} from 'react-native'
import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {act, fireEvent, render} from '@testing-library/react-native'

import {sanitizeHandle} from '#/lib/strings/handles'
import {AtmosphereScreen} from './index'
import {
  createActivity,
  createActor,
  createDocumentRecords,
  createRecord,
  createShareRecord,
  documentUri,
  publicationUri,
  recordCid,
} from './testFixtures'
import {type ActivityTimelineListItem} from './timeline'
import {activityCollections} from './types'

jest.unmock('multiformats/cid')

const mockUseAtmosphereQuery = jest.fn()
const mockUseAtmosphereRawQuery = jest.fn()
const mockQueryUpdates = createContext(0)
let mockQueryRevision = 0
const mockListFooter = jest.fn((_props: unknown) => null)
const mockAvatarStack = jest.fn()
const mockInlineLinkText = jest.fn()
const mockPublicationCard = jest.fn((_props: unknown) => null)
const mockStandardSiteEmbed = jest.fn((_props: unknown) => null)
const mockTimeElapsed = jest.fn()
let latestListProps: ListProps | undefined
let mockNow = new Date(2026, 8, 11, 12).getTime()
jest.mock('./useTimelineNow', () => ({useTimelineNow: () => new Date(mockNow)}))

type ChildrenProps = {children?: React.ReactNode; testID?: string}
type EmptyStateProps = {
  message: string
  button?: {
    label: string
    onPress?: PressableProps['onPress']
    text: string
  }
  testID?: string
}
type ListItem = Record<string, unknown>
type ListProps = {
  testID?: string
  data: ListItem[]
  renderItem: (args: {item: ListItem; index: number}) => React.ReactNode
  keyExtractor: (item: ListItem) => string
  ListFooterComponent?: React.ReactNode
  onEndReached?: () => Promise<void> | void
  onRefresh?: () => Promise<void> | void
  refreshing?: boolean
}

jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  utils: {rgbToHex: () => '#000000'},
  web: (styles: object) => styles,
  useTheme: () => ({
    atoms: {
      border_contrast_low: {},
      text: {color: '#111111'},
      text_inverted: {color: '#ffffff'},
      text_contrast_medium: {color: '#667788'},
      text_link: {color: '#0a7aff'},
      bg: {backgroundColor: '#ffffff'},
    },
    palette: {
      primary_100: '#CCE1FF',
      primary_600: '#0059D6',
      primary_500: '#006aff',
      primary_800: '#004299',
      positive_500: '#168a45',
    },
  }),
}))
jest.mock('./components/ShareSnippets', () => ({ShareSnippets: () => null}))
jest.mock('#/components/images/Gallery', () => ({
  Gallery: () => null,
  GalleryBleed: ({children}: React.PropsWithChildren) => <>{children}</>,
}))
jest.mock('#/components/images/AutoSizedImage', () => ({
  AutoSizedImage: () => null,
}))
jest.mock('#/components/Post/Embed/ImageContextMenu', () => ({
  ImageContextMenu: ({children}: React.PropsWithChildren) => <>{children}</>,
}))
jest.mock('#/components/Lightbox/state', () => ({
  useLightboxControls: () => ({openLightbox: jest.fn()}),
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
jest.mock('#/components/icons/Atom', () => ({
  Atom_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/view/com/pager/Pager', () => {
  const React = jest.requireActual<typeof import('react')>('react')
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Pager: ({
      children,
      initialPage = 0,
      renderTabBar,
      testID,
    }: React.PropsWithChildren<{
      initialPage?: number
      renderTabBar: (props: {
        selectedPage: number
        onSelect: (index: number) => void
        dragProgress: {value: number}
        dragState: {value: 'idle'}
      }) => React.ReactNode
      testID?: string
    }>) => {
      const [selectedPage, setSelectedPage] = React.useState(initialPage)
      const pages = React.Children.toArray(children)
      const onSelect = (index: number) => setSelectedPage(index)
      return (
        <View testID={testID}>
          {renderTabBar({
            selectedPage,
            onSelect,
            dragProgress: {value: selectedPage},
            dragState: {value: 'idle'},
          })}
          {pages[selectedPage]}
        </View>
      )
    },
  }
})
jest.mock('#/view/com/pager/TabBar', () => {
  const {Pressable, Text, View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    TabBar: ({
      items,
      onSelect,
      selectedPage,
      testID,
    }: {
      items: string[]
      onSelect?: (index: number) => void
      selectedPage: number
      testID?: string
    }) => (
      <View testID={testID}>
        {items.map((item, index) => (
          <Pressable
            key={item}
            accessibilityHint=""
            accessibilityLabel={item}
            accessibilityRole="tab"
            accessibilityState={{selected: selectedPage === index}}
            onPress={() => onSelect?.(index)}>
            <Text>{item}</Text>
          </Pressable>
        ))}
      </View>
    ),
  }
})
jest.mock('#/components/Layout', () => {
  const {Text, View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Screen: ({children, testID}: ChildrenProps) => (
      <View testID={testID}>{children}</View>
    ),
    Center: ({children}: ChildrenProps) => <View>{children}</View>,
    Header: {
      Outer: ({children}: ChildrenProps) => <>{children}</>,
      BackButton: () => null,
      Content: ({children}: ChildrenProps) => <>{children}</>,
      TitleText: ({children}: ChildrenProps) => <Text>{children}</Text>,
      Slot: () => null,
    },
  }
})
jest.mock('#/components/Link', () => {
  const {Text, View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Link: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <View {...props}>{children}</View>
    ),
    InlineLinkText: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => {
      mockInlineLinkText({children, ...props})
      return <Text {...props}>{children}</Text>
    },
  }
})
jest.mock('#/components/Lists', () => ({
  ListFooter: (props: unknown) => {
    mockListFooter(props)
    return null
  },
}))
jest.mock('#/components/Loader', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Loader: () => <Text>loader</Text>}
})
jest.mock('#/components/Post/Embed/StandardSiteEmbed', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    PublicationCard: (props: unknown) => {
      mockPublicationCard(props)
      return <View testID="atmospherePublicationCard" />
    },
    StandardSiteEmbed: (props: unknown) => {
      mockStandardSiteEmbed(props)
      return <View testID="atmosphereStandardSiteEmbed" />
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
jest.mock('#/lib/hooks/useInitialNumToRender', () => ({
  useInitialNumToRender: () => 1,
}))
jest.mock('#/view/com/util/EmptyState', () => {
  const {Pressable, Text, View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    EmptyState: ({button, message, testID}: EmptyStateProps) => (
      <View testID={testID}>
        <Text>{message}</Text>
        {button ? (
          <Pressable
            accessibilityHint=""
            accessibilityLabel={button.label}
            accessibilityRole="button"
            onPress={button.onPress}>
            <Text>{button.text}</Text>
          </Pressable>
        ) : null}
      </View>
    ),
  }
})
jest.mock('#/view/com/util/List', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    List: (props: ListProps) => {
      latestListProps = props
      return (
        <View testID={props.testID}>
          {props.data.map((item, index) => (
            <View key={props.keyExtractor(item)}>
              {props.renderItem({item, index})}
            </View>
          ))}
          {props.ListFooterComponent ? (
            <View key="footer">{props.ListFooterComponent}</View>
          ) : null}
        </View>
      )
    },
  }
})
jest.mock('./components/DocumentMenu', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    DocumentMenu: () => null,
    DocumentMenuPlaceholder: () => (
      <View testID="atmosphereDocumentMenuPlaceholder" />
    ),
  }
})
jest.mock('./query', () => {
  const {use} = jest.requireActual<typeof import('react')>('react')
  return {
    useAtmosphereQuery: () => {
      // Model the query subscription even when React Compiler reuses the screen child.
      use(mockQueryUpdates)
      return mockUseAtmosphereQuery()
    },
    useAtmosphereRawQuery: () => {
      use(mockQueryUpdates)
      return mockUseAtmosphereRawQuery()
    },
  }
})

i18n.loadAndActivate({locale: 'en', messages: {}})

beforeEach(() => {
  mockNow = new Date(2026, 8, 11, 12).getTime()
  latestListProps = undefined
  mockAvatarStack.mockClear()
  mockInlineLinkText.mockClear()
  mockListFooter.mockClear()
  mockPublicationCard.mockClear()
  mockStandardSiteEmbed.mockClear()
  mockTimeElapsed.mockClear()
  mockUseAtmosphereQuery.mockReset()
  mockUseAtmosphereRawQuery.mockReset()
})

function renderScreen() {
  const screen = render(screenElement())
  fireEvent.press(screen.getByRole('tab', {name: 'Activity'}))
  return screen
}

function screenElement() {
  return (
    <mockQueryUpdates.Provider value={++mockQueryRevision}>
      <I18nProvider i18n={i18n}>
        <AtmosphereScreen
          route={{key: 'Atmosphere', name: 'Atmosphere'}}
          navigation={{} as never}
        />
      </I18nProvider>
    </mockQueryUpdates.Provider>
  )
}

function handleLabel(handle: string) {
  return sanitizeHandle(handle, '@')
}

function activity({
  collection,
  uri,
  cid,
}: {
  collection: string
  uri: string
  cid: string
}) {
  return {
    $type: 'eric.bsky.atmosphere.getActivity#item' as const,
    record: {
      uri,
      cid,
      indexedAt: '2026-09-03T00:00:00.000Z',
    },
    collection,
    viewerState: {subscribed: true},
  }
}

function actor(did: string, handle: string) {
  return {
    did,
    handle,
    avatar: `https://example.com/${did}.jpg`,
  }
}

describe('AtmosphereScreen', () => {
  it('defaults to Activity and switches to Explore', () => {
    mockUseAtmosphereQuery.mockReturnValue(basicQuery())
    const screen = render(screenElement())

    expect(
      screen.getAllByRole('tab').map(tab => tab.props.accessibilityLabel),
    ).toEqual(['Activity', 'Raw', 'Explore'])
    expect(
      screen.getByRole('tab', {name: 'Activity'}).props.accessibilityState,
    ).toEqual({selected: true})
    expect(screen.getByTestId('atmosphereList')).toBeTruthy()
    expect(screen.queryByTestId('atmosphereExplore')).toBeNull()

    fireEvent.press(screen.getByRole('tab', {name: 'Explore'}))

    expect(
      screen.getByRole('tab', {name: 'Explore'}).props.accessibilityState,
    ).toEqual({selected: true})
    expect(screen.getByText('(╯°□°)╯︵ ┻━┻')).toBeTruthy()
    expect(screen.queryByTestId('atmosphereList')).toBeNull()
  })

  it('shows a blue text-only Beta badge next to the Atmosphere title', () => {
    mockUseAtmosphereQuery.mockReturnValue(basicQuery())
    const screen = render(screenElement())
    const badge = screen.getByTestId('atmosphereBetaBadge')

    expect(screen.getByText('Atmosphere')).toBeTruthy()
    expect(badge).toHaveTextContent('Beta')
    expect(badge).toHaveStyle({backgroundColor: '#CCE1FF'})
    expect(badge.children).toHaveLength(1)
    expect(screen.getByText('Beta')).toHaveStyle({color: '#0059D6'})
  })

  it('renders the Atmosphere screen with standalone, grouped, and unknown rows without JSON diagnostics', () => {
    const groupChildOne = activity({
      collection: activityCollections.document,
      uri: 'at://did:plc:group-author/site.standard.document/one',
      cid: 'bafy-group-one',
    })
    const groupChildTwo = activity({
      collection: activityCollections.document,
      uri: 'at://did:plc:group-author/site.standard.document/two',
      cid: 'bafy-group-two',
    })
    const group = {
      $type: 'eric.bsky.atmosphere.getActivity#group' as const,
      id: 'opaque-group-id',
      groupBy: 'actor' as const,
      collection: activityCollections.document,
      indexedAt: '2026-09-03T00:00:00.000Z',
      actor: 'did:plc:group-author',
      items: [groupChildOne, groupChildTwo],
    }
    const documentActivity = activity({
      collection: activityCollections.document,
      uri: 'at://did:plc:author/site.standard.document/three',
      cid: 'bafy-document',
    })
    const publicationActivity = activity({
      collection: activityCollections.publication,
      uri: 'at://did:plc:author/site.standard.publication/one',
      cid: 'bafy-publication',
    })
    const recommendationActivity = activity({
      collection: activityCollections.recommendation,
      uri: 'at://did:plc:author/site.standard.graph.recommend/one',
      cid: 'bafy-recommendation',
    })
    const subscriptionActivity = activity({
      collection: activityCollections.subscription,
      uri: 'at://did:plc:author/site.standard.graph.subscription/one',
      cid: 'bafy-subscription',
    })
    const livestreamActivity = activity({
      collection: activityCollections.livestream,
      uri: 'at://did:plc:author/place.stream.livestream/one',
      cid: 'bafy-livestream',
    })
    const grainPhotoActivity = activity({
      collection: activityCollections.grainPhoto,
      uri: 'at://did:plc:author/social.grain.photo/one',
      cid: 'bafy-grain-photo',
    })
    const unknownCollectionActivity = activity({
      collection: 'example.unknown.collection',
      uri: 'at://did:plc:author/example.unknown.collection/one',
      cid: 'bafy-unknown',
    })

    mockUseAtmosphereQuery.mockReturnValue({
      data: {
        pages: [
          {
            feed: [
              group,
              documentActivity,
              publicationActivity,
              recommendationActivity,
              subscriptionActivity,
              livestreamActivity,
              grainPhotoActivity,
              unknownCollectionActivity,
            ],
            associatedRecords: {},
            actors: {
              'did:plc:author': actor('did:plc:author', 'author.test'),
              'did:plc:group-author': actor(
                'did:plc:group-author',
                'group-author.test',
              ),
            },
          },
        ],
        pageParams: [undefined],
      },
      error: undefined,
      isFetchingNextPage: false,
      hasNextPage: true,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    })

    const screen = renderScreen()

    expect(screen.getByTestId('atmosphereScreen')).toBeTruthy()
    expect(screen.getByText('Atmosphere')).toBeTruthy()
    expect(screen.getAllByTestId('atmosphereDocumentRow')).toHaveLength(2)
    expect(screen.getByTestId('atmospherePublicationRow')).toBeTruthy()
    expect(screen.getByTestId('atmosphereRecommendationRow')).toBeTruthy()
    expect(screen.getByTestId('atmosphereSubscriptionRow')).toBeTruthy()
    expect(screen.getByTestId('atmosphereLivestreamRow')).toBeTruthy()
    expect(screen.getByTestId('atmosphereGrainPhotoRow')).toBeTruthy()
    expect(screen.getByTestId('atmosphereUnknownRow')).toBeTruthy()
    expect(screen.queryByTestId('atmosphereDebugButton')).toBeNull()
    expect(
      screen
        .getAllByTestId('atmosphereFootnoteActor')
        .some(
          actorNode =>
            actorNode.props.children === handleLabel('group-author.test'),
        ),
    ).toBe(true)
    expect(
      screen.getByLabelText(
        `${handleLabel('author.test')} did something · elapsed:2026-09-03T00:00:00.000Z`,
      ),
    ).toBeTruthy()
    expect(screen.queryByText(JSON.stringify(documentActivity))).toBeNull()
    expect(screen.queryByText(JSON.stringify(group))).toBeNull()
    expect(mockListFooter).toHaveBeenCalledWith(
      expect.objectContaining({hasNextPage: true, isFetchingNextPage: false}),
    )
  })

  it('renders loading and empty states', () => {
    mockUseAtmosphereQuery.mockReturnValue({
      data: undefined,
      error: undefined,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    })

    const loadingScreen = renderScreen()
    expect(loadingScreen.getByText('loader')).toBeTruthy()

    mockUseAtmosphereQuery.mockReturnValue({
      data: {
        pages: [{feed: [], associatedRecords: {}, actors: {}}],
        pageParams: [undefined],
      },
      error: undefined,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    })

    const emptyScreen = renderScreen()
    expect(emptyScreen.getByTestId('atmosphereEmptyState')).toBeTruthy()
  })

  it('omits actorless successful rows and falls back to the empty state', () => {
    mockUseAtmosphereQuery.mockReturnValue({
      data: {
        pages: [
          {
            feed: [
              activity({
                collection: activityCollections.document,
                uri: 'at://did:plc:ghost/site.standard.document/one',
                cid: 'bafy-ghost',
              }),
            ],
            associatedRecords: {},
            actors: {},
          },
        ],
        pageParams: [undefined],
      },
      error: undefined,
      isFetchingNextPage: false,
      hasNextPage: true,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    })

    const screen = renderScreen()

    expect(screen.getByTestId('atmosphereEmptyState')).toBeTruthy()
    expect(mockListFooter).not.toHaveBeenCalled()
  })

  it('keeps the retry control wired for initial errors', () => {
    const refetch = jest.fn()
    mockUseAtmosphereQuery.mockReturnValue({
      data: undefined,
      error: new Error('boom'),
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      refetch,
    })

    const screen = renderScreen()
    fireEvent.press(screen.getByLabelText('Retry loading activity'))

    expect(refetch).toHaveBeenCalled()
    expect(screen.getByTestId('atmosphereErrorState')).toBeTruthy()
  })

  it('keeps refresh and pagination wired through the list callbacks', async () => {
    const refetch = jest.fn().mockResolvedValue(undefined)
    const fetchNextPage = jest.fn().mockResolvedValue(undefined)

    mockUseAtmosphereQuery.mockReturnValue({
      data: {
        pages: [
          {
            feed: [
              activity({
                collection: activityCollections.document,
                uri: 'at://did:plc:author/site.standard.document/one',
                cid: 'bafy-document',
              }),
            ],
            associatedRecords: {},
            actors: {
              'did:plc:author': actor('did:plc:author', 'author.test'),
            },
          },
        ],
        pageParams: [undefined],
      },
      error: undefined,
      isFetchingNextPage: false,
      hasNextPage: true,
      fetchNextPage,
      refetch,
    })

    renderScreen()

    await act(async () => {
      await latestListProps?.onRefresh?.()
    })
    await act(async () => {
      await latestListProps?.onEndReached?.()
    })

    expect(refetch).toHaveBeenCalledTimes(1)
    expect(fetchNextPage).toHaveBeenCalledTimes(1)
  })
})

describe('Raw tab', () => {
  it('renders each raw root as a footnote without cards, grouping, or related rows', () => {
    const document = createActivity({
      subscribed: true,
      relatedActivity: [
        createActivity({
          collection: activityCollections.recommendation,
          rkey: 'related',
        }),
      ],
    })
    const recommend = createActivity({
      collection: activityCollections.recommendation,
    })
    const secondRecommend = createActivity({
      collection: activityCollections.recommendation,
      rkey: 'second',
    })
    const subscription = createActivity({
      collection: activityCollections.subscription,
    })
    const stream = createActivity({collection: activityCollections.livestream})
    const photo = createActivity({collection: activityCollections.grainPhoto})
    const share = createActivity({collection: activityCollections.share})
    const publication = createActivity({
      collection: activityCollections.publication,
      did: 'did:plc:publisher',
      rkey: 'site',
    })
    const unknown = createActivity({
      collection: 'example.unknown.record',
      did: 'did:plc:missing',
    })
    const rawQuery = basicQuery()
    rawQuery.data.pages[0] = {
      feed: [
        document,
        recommend,
        secondRecommend,
        subscription,
        stream,
        photo,
        share,
        publication,
        unknown,
      ],
      actors: {'did:plc:author': createActor()},
      associatedRecords: {
        ...createDocumentRecords(),
        [recommend.record.uri]: createRecord(recommend.record.uri, {
          document: documentUri,
          createdAt: document.record.indexedAt,
        }),
        [secondRecommend.record.uri]: createRecord(secondRecommend.record.uri, {
          document: documentUri,
          createdAt: document.record.indexedAt,
        }),
        [subscription.record.uri]: createRecord(subscription.record.uri, {
          publication: publicationUri,
        }),
        [stream.record.uri]: createRecord(stream.record.uri, {
          title: 'Live stream',
          url: 'https://stream.place/author',
          createdAt: stream.record.indexedAt,
        }),
        [photo.record.uri]: createRecord(photo.record.uri, {
          photo: {ref: recordCid, mimeType: 'image/jpeg'},
          alt: 'A capybara',
        }),
        [share.record.uri]: createRecord(share.record.uri, createShareRecord()),
      },
    }
    mockUseAtmosphereQuery.mockReturnValue(basicQuery())
    mockUseAtmosphereRawQuery.mockReturnValue(rawQuery)
    const screen = renderScreen()
    expect(mockUseAtmosphereRawQuery).not.toHaveBeenCalled()
    fireEvent.press(screen.getByRole('tab', {name: 'Raw'}))

    expect(screen.getByTestId('atmosphereRawList')).toBeTruthy()
    expect(screen.queryByTestId('atmosphereList')).toBeNull()
    expect(screen.getAllByTestId('atmosphereRawRow')).toHaveLength(9)
    expect(screen.getAllByTestId('atmosphereFootnote')).toHaveLength(9)
    expect(latestListProps?.data.map(item => item.key)).toEqual(
      rawQuery.data.pages[0].feed.map(item => item.record.uri),
    )
    expect(screen.queryByTestId('atmosphereArticleCard')).toBeNull()
    expect(screen.queryByTestId('atmosphereSubscriptionCard')).toBeNull()
    expect(screen.queryByTestId('atmosphereActiveLivestream')).toBeNull()
    expect(screen.queryByTestId('atmospherePhotoCard')).toBeNull()
    expect(screen.queryByTestId('atmosphereShareCard')).toBeNull()
    expect(screen.queryByTestId('atmosphereArticleRecommendations')).toBeNull()
    expect(screen.queryByTestId('atmosphereFootnoteThumbnail')).toBeNull()
    expect(
      screen
        .getAllByTestId('atmosphereFootnoteTitle')
        .map(node => node.props.to),
    ).toContain('/profile/author.example/post/article')
  })

  it('keeps raw loading, empty, and retry states independent of Activity', () => {
    const activityQuery = basicQuery()
    const raw = {
      ...basicQuery(),
      data: undefined,
      error: undefined as Error | undefined,
    }
    mockUseAtmosphereQuery.mockReturnValue(activityQuery)
    mockUseAtmosphereRawQuery.mockReturnValue(raw)
    const screen = renderScreen()
    fireEvent.press(screen.getByRole('tab', {name: 'Raw'}))
    expect(screen.getByTestId('atmosphereRawLoading')).toBeTruthy()
    raw.error = new Error('Raw unavailable')
    screen.rerender(screenElement())
    expect(screen.getByTestId('atmosphereRawError')).toBeTruthy()
    fireEvent.press(screen.getByLabelText('Retry loading raw activity'))
    expect(raw.refetch).toHaveBeenCalledTimes(1)
    expect(activityQuery.refetch).not.toHaveBeenCalled()
    const empty = basicQuery()
    empty.data.pages[0].feed = []
    mockUseAtmosphereRawQuery.mockReturnValue(empty)
    screen.rerender(screenElement())
    expect(screen.getByTestId('atmosphereRawEmpty')).toBeTruthy()
  })

  it.each(['fetching', 'last-page'] as const)(
    'does not fetch another raw page when %s',
    reason => {
      const raw = {
        ...basicQuery(),
        isFetching: reason === 'fetching',
        hasNextPage: reason !== 'last-page',
      }
      mockUseAtmosphereQuery.mockReturnValue(basicQuery())
      mockUseAtmosphereRawQuery.mockReturnValue(raw)
      const screen = renderScreen()
      fireEvent.press(screen.getByRole('tab', {name: 'Raw'}))
      act(() => {
        void latestListProps?.onEndReached?.()
      })
      expect(raw.fetchNextPage).not.toHaveBeenCalled()
    },
  )

  it('wires raw refresh and pagination and stops automatic pagination after an error', async () => {
    const raw = basicQuery()
    mockUseAtmosphereQuery.mockReturnValue(basicQuery())
    mockUseAtmosphereRawQuery.mockReturnValue(raw)
    const screen = renderScreen()
    fireEvent.press(screen.getByRole('tab', {name: 'Raw'}))
    await act(async () => {
      await latestListProps?.onRefresh?.()
    })
    act(() => {
      void latestListProps?.onEndReached?.()
    })
    expect(raw.refetch).toHaveBeenCalledTimes(1)
    expect(raw.fetchNextPage).toHaveBeenCalledWith({cancelRefetch: false})
    raw.error = new Error('Next page failed')
    screen.rerender(screenElement())
    act(() => {
      void latestListProps?.onEndReached?.()
    })
    expect(raw.fetchNextPage).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('atmosphereRawRow')).toBeTruthy()
    expect(mockListFooter).toHaveBeenLastCalledWith(
      expect.objectContaining({
        error: 'Next page failed',
        onRetry: expect.any(Function),
      }),
    )
  })
})

function basicQuery() {
  const entry = createActivity()
  entry.record.indexedAt = new Date(mockNow - 2 * 60 * 60_000).toISOString()
  return {
    data: {
      pages: [
        {
          feed: [entry],
          associatedRecords: {},
          actors: {'did:plc:author': createActor()},
        },
      ],
      pageParams: [undefined],
    },
    error: undefined as Error | undefined,
    isFetchingNextPage: false,
    hasNextPage: true,
    fetchNextPage: jest.fn().mockResolvedValue(undefined),
    refetch: jest.fn().mockResolvedValue(undefined),
  }
}

it.each(['fetching', 'last-page', 'error'] as const)(
  'does not request another page when %s',
  reason => {
    const query = basicQuery()
    if (reason === 'fetching') query.isFetchingNextPage = true
    if (reason === 'last-page') query.hasNextPage = false
    if (reason === 'error') query.error = new Error('Next page failed')
    mockUseAtmosphereQuery.mockReturnValue(query)
    const screen = renderScreen()
    act(() => {
      void latestListProps?.onEndReached?.()
    })
    expect(query.fetchNextPage).not.toHaveBeenCalled()
    expect(screen.getByTestId('atmosphereDocumentRow')).toBeTruthy()
    if (reason === 'error') {
      expect(mockListFooter).toHaveBeenLastCalledWith(
        expect.objectContaining({
          error: 'Next page failed',
          onRetry: query.fetchNextPage,
        }),
      )
    }
  },
)

it('keeps refresh feedback until refetch resolves', async () => {
  const query = basicQuery()
  let resolve!: () => void
  const pending = new Promise<void>(done => {
    resolve = done
  })
  query.refetch.mockReturnValue(pending)
  mockUseAtmosphereQuery.mockReturnValue(query)
  renderScreen()
  act(() => {
    void latestListProps?.onRefresh?.()
  })
  expect(latestListProps?.refreshing).toBe(true)
  await act(async () => {
    resolve()
    await pending
  })
  expect(latestListProps?.refreshing).toBe(false)
})

it('moves a row across the recent cutoff without changing its key', () => {
  const query = basicQuery()
  mockUseAtmosphereQuery.mockReturnValue(query)
  const screen = renderScreen()
  expect(screen.queryByTestId('atmosphereDateHeading')).toBeNull()
  const keys = latestListProps!.data.map(latestListProps!.keyExtractor)
  mockNow += 2 * 60 * 60_000
  screen.rerender(screenElement())
  expect(screen.getByTestId('atmosphereDateHeading')).toHaveTextContent(
    'Earlier today',
  )
  expect(latestListProps!.data.map(latestListProps!.keyExtractor)).toEqual(keys)
})

it('recomputes presentation and spacing after a refresh crosses the recommendation threshold', async () => {
  const first = createActivity({
    collection: activityCollections.recommendation,
    did: 'did:plc:one',
  })
  const second = createActivity({
    collection: activityCollections.recommendation,
    did: 'did:plc:two',
  })
  const associatedRecords = createDocumentRecords()
  for (const activity of [first, second]) {
    associatedRecords[activity.record.uri] = createRecord(activity.record.uri, {
      document: documentUri,
      createdAt: activity.record.indexedAt,
    })
  }
  const query = basicQuery()
  const context = {
    associatedRecords,
    actors: {
      'did:plc:one': createActor('did:plc:one'),
      'did:plc:two': createActor('did:plc:two'),
    },
  }
  mockUseAtmosphereQuery.mockReturnValue({
    ...query,
    data: {pages: [{...context, feed: [first]}], pageParams: [undefined]},
  })
  const screen = renderScreen()
  expect(
    (latestListProps!.data as ActivityTimelineListItem[])[0].layout?.kind,
  ).toBe('footnote')
  await act(async () => {
    await latestListProps?.onRefresh?.()
  })
  mockUseAtmosphereQuery.mockReturnValue({
    ...query,
    data: {
      pages: [
        {
          ...context,
          feed: [
            {
              $type: 'eric.bsky.atmosphere.getActivity#group',
              id: 'recommendation-cluster',
              collection: activityCollections.recommendation,
              groupBy: 'subject',
              subject: documentUri,
              indexedAt: first.record.indexedAt,
              items: [first, second],
            },
          ],
        },
      ],
      pageParams: [undefined],
    },
  })
  screen.rerender(screenElement())
  expect(
    (latestListProps!.data as ActivityTimelineListItem[])[0].layout?.kind,
  ).toBe('card')
  expect(screen.getByTestId('atmosphereArticleCard')).toBeTruthy()
  expect(screen.queryByTestId('atmosphereTimelineSeparator')).toBeNull()
})
