import {createContext} from 'react'
import {type PressableProps, type View as NativeView} from 'react-native'
import {toDatetimeString} from '@atproto/syntax'
import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {act, fireEvent, render} from '@testing-library/react-native'

import {AtmosphereScreen} from './index'
import {
  createActivity,
  createActor,
  createArticleView,
  createGalleryView,
  createLivestreamView,
  createPostView,
  createPublicationView,
  documentUri,
} from './testFixtures'
import {type ActivityTimelineListItem} from './timeline'
import {activityCollections, type AtmosphereActivityPage} from './types'

jest.unmock('multiformats/cid')

const mockUseAtmosphereQuery = jest.fn()
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

jest.mock('expo-image', () => {
  const {View} = jest.requireActual<{View: typeof NativeView}>('react-native')
  return {Image: (props: object) => <View {...props} />}
})
jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  tokens: {borderRadius: {md: 12}},
  utils: {rgbToHex: () => '#000000'},
  web: (styles: object) => styles,
  useBreakpoints: () => ({gtPhone: true}),
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
jest.mock('./ExploreTab', () => {
  const {View} = jest.requireActual('react-native')
  return {
    AtmosphereExploreTab: () => <View testID="atmosphereExploreTab" />,
  }
})
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
    expect(screen.queryByTestId('atmosphereExploreTab')).toBeNull()

    fireEvent.press(screen.getByRole('tab', {name: 'Explore'}))

    expect(
      screen.getByRole('tab', {name: 'Explore'}).props.accessibilityState,
    ).toEqual({selected: true})
    expect(screen.getByTestId('atmosphereExploreTab')).toBeTruthy()
    expect(screen.queryByTestId('atmosphereList')).toBeNull()
  })

  it('renders hydrated standalone, grouped, and unknown collections without JSON diagnostics', () => {
    const first = createActivity({did: 'did:plc:group-author', rkey: 'one'})
    const second = createActivity({did: 'did:plc:group-author', rkey: 'two'})
    const group = {
      $type: 'app.bsky.unspecced.getAtmosphereTimeline#activityGroup' as const,
      id: 'opaque-group-id',
      groupBy: 'actor' as const,
      collection: activityCollections.document,
      indexedAt: first.record.indexedAt,
      actor: 'did:plc:group-author',
      items: [first, second],
    } satisfies AtmosphereActivityPage['feed'][number]
    const document = createActivity()
    const query = basicQuery([
      group,
      document,
      createActivity({
        collection: activityCollections.publication,
        view: createPublicationView(),
      }),
      createActivity({
        collection: activityCollections.recommendation,
        view: createArticleView(),
      }),
      createActivity({
        collection: activityCollections.subscription,
        view: createPublicationView(),
      }),
      createActivity({
        collection: activityCollections.livestream,
        view: createLivestreamView(),
      }),
      createActivity({
        collection: activityCollections.grainGallery,
        view: createGalleryView(),
      }),
      createActivity({
        collection: activityCollections.grainFavorite,
        view: createGalleryView(),
      }),
      createActivity({
        collection: activityCollections.share,
        view: createPostView(),
      }),
      createActivity({collection: 'example.unknown.collection'}),
    ])
    query.data.pages[0].actors['did:plc:group-author'] = createActor(
      'did:plc:group-author',
    )
    mockUseAtmosphereQuery.mockReturnValue(query)

    const screen = renderScreen()

    expect(screen.getByTestId('atmosphereScreen')).toBeTruthy()
    expect(screen.getAllByTestId('atmosphereDocumentRow')).toHaveLength(2)
    for (const row of [
      'Publication',
      'Recommendation',
      'Subscription',
      'Livestream',
      'GrainGallery',
      'GrainFavorite',
      'Share',
      'Unknown',
    ]) {
      expect(screen.getByTestId(`atmosphere${row}Row`)).toBeTruthy()
    }
    expect(mockInlineLinkText).toHaveBeenCalledWith(
      expect.objectContaining({to: '/profile/group-author.example'}),
    )
    expect(screen.queryByText(JSON.stringify(document))).toBeNull()
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
        pages: [{feed: [], actors: {}}],
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
    const query = basicQuery([createActivity({did: 'did:plc:ghost'})])
    query.data.pages[0].actors = {}
    mockUseAtmosphereQuery.mockReturnValue(query)

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
      ...basicQuery(),
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

  it.each([
    ...Object.values(activityCollections),
    'example.unknown.record' as const,
  ])(
    'shows server overflow count and profiles for %s without a timestamp',
    collection => {
      const profiles = [createActor('did:plc:one'), createActor('did:plc:two')]
      mockUseAtmosphereQuery.mockReturnValue(
        basicQuery([
          {
            $type:
              'app.bsky.unspecced.getAtmosphereTimeline#activityItemOverflow',
            count: 17,
            collection,
            associatedProfiles: profiles,
          },
        ]),
      )
      const screen = renderScreen()

      expect(screen.getByTestId('atmosphereOverflowRow')).toHaveTextContent(
        /\b17\b/,
      )
      for (const profile of profiles) {
        expect(mockInlineLinkText).toHaveBeenCalledWith(
          expect.objectContaining({to: `/profile/${profile.handle}`}),
        )
      }
      expect(screen.queryByTestId('atmosphereDateHeading')).toBeNull()
      expect(screen.queryByTestId('atmosphereEmptyState')).toBeNull()
      expect(mockTimeElapsed).not.toHaveBeenCalled()
    },
  )

  it('paginates an overflow-only page without inventing an activity timestamp', async () => {
    const query = basicQuery([
      {
        $type: 'app.bsky.unspecced.getAtmosphereTimeline#activityItemOverflow',
        count: 1,
        collection: activityCollections.grainGallery,
        associatedProfiles: [createActor('did:plc:author')],
      },
    ])
    mockUseAtmosphereQuery.mockReturnValue(query)
    const screen = renderScreen()
    expect(screen.getByTestId('atmosphereOverflowRow')).toBeTruthy()
    expect(mockListFooter).toHaveBeenCalledWith(
      expect.objectContaining({hasNextPage: true}),
    )
    await act(async () => {
      await latestListProps?.onEndReached?.()
    })
    expect(query.fetchNextPage).toHaveBeenCalledTimes(1)
    expect(mockTimeElapsed).not.toHaveBeenCalled()
  })
})

describe('Raw tab', () => {
  it('shows the original feed JSON including groups, overflow, related activity, and actorless entries', () => {
    const first = createActivity({
      subscribed: true,
      relatedActivity: [
        createActivity({
          collection: activityCollections.recommendation,
          rkey: 'related',
          view: createArticleView(),
        }),
      ],
    })
    const second = createActivity({rkey: 'second'})
    const group = {
      $type: 'app.bsky.unspecced.getAtmosphereTimeline#activityGroup' as const,
      id: 'raw-group',
      groupBy: 'actor' as const,
      actor: 'did:plc:author',
      collection: activityCollections.document,
      indexedAt: first.record.indexedAt,
      items: [first, second],
    } satisfies AtmosphereActivityPage['feed'][number]
    const overflow = {
      $type:
        'app.bsky.unspecced.getAtmosphereTimeline#activityItemOverflow' as const,
      collection: activityCollections.document,
      count: 17,
      associatedProfiles: [createActor('did:plc:author')],
    }
    const missingActor = createActivity({
      collection: 'example.unknown.record',
      did: 'did:plc:missing',
    })
    const query = basicQuery([first, group, overflow, missingActor])
    query.data.pages.push({feed: [first], actors: {}})
    mockUseAtmosphereQuery.mockReturnValue(query)
    const screen = renderScreen()
    fireEvent.press(screen.getByRole('tab', {name: 'Raw'}))

    expect(screen.getByTestId('atmosphereRawList')).toBeTruthy()
    expect(screen.queryByTestId('atmosphereList')).toBeNull()
    expect(screen.getAllByTestId('atmosphereRawRow')).toHaveLength(5)
    expect(
      screen
        .getAllByTestId('atmosphereRawEntry')
        .map(node => JSON.parse(node.props.children)),
    ).toEqual(query.data.pages.flatMap(page => page.feed))
    expect(screen.queryByTestId('atmosphereFootnote')).toBeNull()
    expect(screen.queryByTestId('atmosphereArticleCard')).toBeNull()
    expect(screen.queryByTestId('atmosphereOverflowRow')).toBeNull()
  })

  it('uses the shared query for raw loading, retry, and empty states', () => {
    const raw = {
      ...basicQuery(),
      data: undefined,
      error: undefined as Error | undefined,
    }
    mockUseAtmosphereQuery.mockReturnValue(raw)
    const screen = renderScreen()
    fireEvent.press(screen.getByRole('tab', {name: 'Raw'}))
    expect(screen.getByTestId('atmosphereRawLoading')).toBeTruthy()
    raw.error = new Error('Raw unavailable')
    screen.rerender(screenElement())
    expect(screen.getByTestId('atmosphereRawError')).toBeTruthy()
    fireEvent.press(screen.getByLabelText('Retry loading raw activity'))
    expect(raw.refetch).toHaveBeenCalledTimes(1)
    const empty = basicQuery()
    empty.data.pages[0].feed = []
    mockUseAtmosphereQuery.mockReturnValue(empty)
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
      mockUseAtmosphereQuery.mockReturnValue(raw)
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
    mockUseAtmosphereQuery.mockReturnValue(raw)
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

function basicQuery(feed?: AtmosphereActivityPage['feed']) {
  const entry = createActivity()
  entry.record.indexedAt = toDatetimeString(new Date(mockNow - 2 * 60 * 60_000))
  const page: AtmosphereActivityPage = {
    feed: feed ?? [entry],
    actors: {'did:plc:author': createActor('did:plc:author')},
  }
  return {
    data: {pages: [page], pageParams: [undefined]},
    error: undefined as Error | undefined,
    isFetching: false,
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
    view: createArticleView(),
  })
  const second = createActivity({
    collection: activityCollections.recommendation,
    did: 'did:plc:two',
    view: createArticleView(),
  })
  const query = basicQuery()
  const context = {
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
              $type: 'app.bsky.unspecced.getAtmosphereTimeline#activityGroup',
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
