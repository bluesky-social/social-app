import {type RefreshControlProps} from 'react-native'
import {createDeferrable} from '@atproto/common-web'
import {type ModerationOpts} from '@bsky/sdk/moderation'
import {act, fireEvent, render, screen} from '@testing-library/react-native'

import {PROD_DEFAULT_FEED} from '#/lib/constants'
import {exploreResponseFixture} from '#/screens/Atmosphere/__tests__/fixtures/exploreResponse'
import {livestreamPreviewFixture} from '#/screens/Atmosphere/__tests__/fixtures/livestreamPreview'
import {
  DISCOVER_FEEDBACK,
  EXPLORE_ARTICLES_FEEDBACK,
  EXPLORE_PHOTOS_FEEDBACK,
} from '#/screens/Atmosphere/const'
import {useAtmosphereExploreQuery} from '#/screens/Atmosphere/data/useAtmosphereExploreQuery'
import {AtmosphereExploreTab} from '#/screens/Atmosphere/ExploreTab'
import {type AtmosphereFeedbackForContent} from '#/screens/Atmosphere/feedback'
import {AtmosphereMetricsScope} from '#/screens/Atmosphere/metrics/context'
import {app} from '#/lexicons'

const FEED_URIS = {
  articles: PROD_DEFAULT_FEED('atmosphere-articles'),
  photos: PROD_DEFAULT_FEED('atmosphere-galleries'),
}
const defaultFeedUris = {
  discover: DISCOVER_FEEDBACK.feedUri,
  articles: EXPLORE_ARTICLES_FEEDBACK.feedUri,
  photos: EXPLORE_PHOTOS_FEEDBACK.feedUri,
}
const mockMetric = jest.fn()
const mockCall = jest.fn((..._args: unknown[]) => Promise.resolve())
const mockClient = {call: mockCall}
const mockLogger = {debug: jest.fn()}
let mockHasSession = true
const mockFeedback: Partial<
  Record<'articles' | 'photos', AtmosphereFeedbackForContent>
> = {}

jest.mock('#/state/session', () => ({
  useSession: () => ({hasSession: mockHasSession}),
  useAppviewClient: () => mockClient,
  useIsCurrentAppviewClient: () => () => mockHasSession,
}))
jest.mock('#/view/com/posts/PostFeed', () => ({getItemsForFeedback: () => []}))
jest.mock('#/state/queries/feed', () => ({isFeedSourceFeedInfo: () => false}))
jest.mock('#/analytics', () => ({
  useAnalytics: () => ({
    metric: mockMetric,
    logger: {useChild: () => mockLogger, Context: {FeedFeedback: 'feedback'}},
  }),
}))

jest.mock('@lingui/react', () => ({
  useLingui: () => ({
    _: (message: {message?: string} | string) =>
      typeof message === 'string' ? message : (message.message ?? ''),
  }),
}))

jest.mock('#/state/preferences/moderation-opts', () => ({
  useModerationOpts: () => mockModerationOpts,
}))

jest.mock('#/screens/Atmosphere/data/useAtmosphereExploreQuery', () => ({
  useAtmosphereExploreQuery: jest.fn(),
}))

jest.mock('#/components/Layout', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Content: View}
})

jest.mock('#/components/Loader', () => {
  const {View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {Loader: () => <View testID="loader" />}
})

jest.mock('#/view/com/util/error/ErrorMessage', () => {
  const {Pressable, Text, View} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    ErrorMessage: ({
      message,
      onPressTryAgain,
    }: {
      message: string
      onPressTryAgain: () => void
    }) => (
      <View>
        <Text>{message}</Text>
        <Pressable
          testID="retry"
          accessibilityRole="button"
          onPress={onPressTryAgain}
        />
      </View>
    ),
  }
})

jest.mock('#/screens/Atmosphere/components/AtmosphereNux', () => {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {AtmosphereNux: () => <Text>nux</Text>}
})

function mockSection(name: string, prop: string) {
  const {Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return (props: Record<string, unknown>) => {
    const items = props[prop] as {title: string}[]
    if (name === 'articles' || name === 'photos') {
      mockFeedback[name] = props.feedback as
        AtmosphereFeedbackForContent | undefined
    }
    return items.length ? (
      <Text>{`${name}:${items.map(item => item.title).join(',')}`}</Text>
    ) : null
  }
}

jest.mock('#/screens/Atmosphere/components/FeaturedArticles', () => ({
  FeaturedArticles: mockSection('articles', 'articles'),
}))
jest.mock('#/screens/Atmosphere/components/FeaturedPublications', () => ({
  FeaturedPublications: mockSection('publications', 'publications'),
}))
jest.mock('#/screens/Atmosphere/components/FeaturedApps', () => ({
  FeaturedApps: mockSection('apps', 'apps'),
}))
jest.mock('#/screens/Atmosphere/components/FeaturedLivestreams', () => ({
  FeaturedLivestreams: mockSection('livestreams', 'livestreams'),
}))
jest.mock('#/screens/Atmosphere/components/FeaturedPhotos', () => ({
  FeaturedPhotos: mockSection('photos', 'photos'),
}))

const defaultModerationOpts: ModerationOpts = {
  userDid: undefined,
  prefs: {
    adultContentEnabled: true,
    labels: {},
    labelers: [],
    mutedWords: [],
    hiddenPosts: [],
  },
}
let mockModerationOpts: ModerationOpts | undefined
const mockQuery = jest.mocked(useAtmosphereExploreQuery)
const refetch = jest.fn()

function getRefreshControlProps() {
  const {refreshControl} = screen.getByTestId('atmosphereExploreTab').props as {
    refreshControl: React.ReactElement<RefreshControlProps>
  }
  return refreshControl.props
}

function setQuery(
  result: Partial<ReturnType<typeof useAtmosphereExploreQuery>>,
) {
  mockQuery.mockReturnValue({
    data: undefined,
    isError: false,
    isPending: false,
    isRefetching: false,
    refetch,
    ...result,
  } as never)
}

const publisher: app.bsky.embed.external.ViewArticlePublication = {
  uri: 'https://example.com/publication',
  title: 'Publication',
  description: '',
}

const data: app.bsky.unspecced.getAtmosphereExploreTab.$OutputBody = {
  articles: {
    items: [
      {
        featured: true,
        view: {
          uri: 'https://example.com/article',
          title: 'Live article',
          description: '',
          publisher,
        },
      },
    ],
  },
  publications: {items: []},
  photos: {items: []},
  livestreams: {items: []},
  apps: [
    {
      id: 'app',
      title: 'Live app',
      url: 'https://example.com/app',
      backgroundImage: 'https://example.com/app-background.jpg',
    },
  ],
}

beforeEach(() => {
  jest.clearAllMocks()
  mockModerationOpts = defaultModerationOpts
  mockHasSession = true
  DISCOVER_FEEDBACK.feedUri = defaultFeedUris.discover
  EXPLORE_ARTICLES_FEEDBACK.feedUri = defaultFeedUris.articles
  EXPLORE_PHOTOS_FEEDBACK.feedUri = defaultFeedUris.photos
  delete mockFeedback.articles
  delete mockFeedback.photos
})

describe('AtmosphereExploreTab', () => {
  it('shows an accessible loader while the first request is pending', () => {
    setQuery({isPending: true})
    render(<AtmosphereExploreTab />)

    expect(screen.getByTestId('atmosphereExploreTab')).toBeTruthy()
    expect(screen.getByTestId('loader')).toBeTruthy()
    expect(screen.getByLabelText('Loading Atmosphere content')).toBeTruthy()
    expect(screen.queryByText('nux')).toBeNull()
  })

  it('shows a retryable error without raw error details on first load failure', () => {
    setQuery({isError: true, error: new Error('socket hang up')})
    render(<AtmosphereExploreTab />)

    expect(
      screen.getByText('Could not load Atmosphere content. Please try again.'),
    ).toBeTruthy()
    expect(screen.queryByText(/socket hang up/)).toBeNull()
    expect(screen.queryByTestId('loader')).toBeNull()

    fireEvent.press(screen.getByTestId('retry'))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('renders live content and hides empty sections without preview fallbacks', () => {
    setQuery({data})
    render(<AtmosphereExploreTab />)

    expect(screen.getByText('nux')).toBeTruthy()
    expect(screen.getByText('articles:Live article')).toBeTruthy()
    expect(screen.getByText('apps:Live app')).toBeTruthy()
    expect(screen.queryByText(/^livestreams:/)).toBeNull()
    expect(screen.queryByText(/^photos:/)).toBeNull()
    expect(
      screen.queryByText(livestreamPreviewFixture[0].view.title, {
        exact: false,
      }),
    ).toBeNull()
    expect(screen.queryByTestId('retry')).toBeNull()
  })

  it('withholds moderated sections until preferences are ready without hiding other sections', () => {
    mockModerationOpts = undefined
    setQuery({data: exploreResponseFixture})
    render(<AtmosphereExploreTab />)

    expect(screen.queryByText(/^articles:/)).toBeNull()
    expect(screen.queryByText(/^photos:/)).toBeNull()
    expect(screen.queryByText(/^publications:/)).toBeNull()
    expect(screen.getByText(/^apps:/)).toBeTruthy()
  })

  it('logs the first load once moderated sections can be counted', () => {
    mockModerationOpts = undefined
    setQuery({data})
    const tree = () => (
      <AtmosphereMetricsScope tab="explore" surface="tab" isActive>
        <AtmosphereExploreTab />
      </AtmosphereMetricsScope>
    )
    const {rerender} = render(tree())
    const loaded = () =>
      mockMetric.mock.calls.filter(
        ([name]) => name === 'atmosphere:content:loaded',
      )
    expect(loaded()).toEqual([])

    mockModerationOpts = defaultModerationOpts
    rerender(tree())
    expect(loaded()).toEqual([
      [
        'atmosphere:content:loaded',
        expect.objectContaining({state: 'populated', itemCount: 2}),
      ],
    ])
  })

  it('reapplies changed moderation preferences to cached views without refetching', () => {
    setQuery({data})
    const {rerender} = render(<AtmosphereExploreTab />)
    expect(screen.getByText('articles:Live article')).toBeTruthy()

    mockModerationOpts = {
      ...defaultModerationOpts,
      prefs: {
        ...defaultModerationOpts.prefs,
        mutedWords: [{value: 'Live article', targets: ['content']}],
      },
    }
    rerender(<AtmosphereExploreTab />)
    expect(screen.queryByText(/^articles:/)).toBeNull()
    expect(screen.getByText('apps:Live app')).toBeTruthy()
    expect(refetch).not.toHaveBeenCalled()

    mockModerationOpts = defaultModerationOpts
    rerender(<AtmosphereExploreTab />)
    expect(screen.getByText('articles:Live article')).toBeTruthy()
  })

  it('renders the first five nonfeatured recommendations in server order', () => {
    setQuery({
      data: {
        ...data,
        articles: {
          recIdStr: '18446744073709551615',
          items: ['Second', 'First', 'Third', 'Fourth', 'Fifth', 'Sixth'].map(
            title => ({
              featured: false,
              view: {
                uri: `https://example.com/${title}`,
                title,
                description: '',
                publisher,
              },
            }),
          ),
        },
      },
    })
    render(<AtmosphereExploreTab />)

    expect(
      screen.getByText('articles:Second,First,Third,Fourth,Fifth'),
    ).toBeTruthy()
    expect(screen.queryByText(/Sixth/)).toBeNull()
  })

  it('renders apps after the intro banner and before articles', () => {
    setQuery({data})
    render(<AtmosphereExploreTab />)

    expect(
      screen
        .getAllByText(/^(nux|apps:|articles:)/)
        .map(node => node.props.children),
    ).toEqual(['nux', 'apps:Live app', 'articles:Live article'])
  })

  it('hides only articles when recommendations are empty', () => {
    const populated =
      app.bsky.unspecced.getAtmosphereExploreTab.$output.schema.parse({
        ...exploreResponseFixture,
        articles: {items: [], recIdStr: '18446744073709551615'},
        livestreams: {items: livestreamPreviewFixture},
      })
    setQuery({data: populated})
    render(<AtmosphereExploreTab />)

    expect(screen.queryByText(/^articles:/)).toBeNull()
    expect(screen.getByText(/^photos:/)).toBeTruthy()
    expect(screen.getByText(/^livestreams:/)).toBeTruthy()
    expect(screen.getByText(/^apps:/)).toBeTruthy()
  })

  it('renders publications below photos', () => {
    setQuery({data: exploreResponseFixture})
    render(<AtmosphereExploreTab />)

    expect(
      screen
        .getAllByText(/^(articles|photos|publications):/)
        .map(section => (section.props.children as string).split(':')[0]),
    ).toEqual(['articles', 'photos', 'publications'])
  })

  it('renders publications from the response, even when articles are empty', () => {
    setQuery({
      data: {
        ...exploreResponseFixture,
        articles: {items: []},
        photos: {items: []},
        apps: [],
      },
    })
    render(<AtmosphereExploreTab />)

    expect(
      screen.getByText(
        `publications:${exploreResponseFixture.publications.items[0].view.title}`,
      ),
    ).toBeTruthy()
    expect(screen.queryByText(/^articles:/)).toBeNull()
  })

  it('renders a publication-only response and hides empty publications', () => {
    setQuery({data: {...exploreResponseFixture, publications: {items: []}}})
    render(<AtmosphereExploreTab />)

    expect(screen.queryByText(/^publications:/)).toBeNull()
    expect(screen.getByText(/^articles:/)).toBeTruthy()
  })

  it('renders the NUX only for an empty response without a banner', () => {
    setQuery({
      data: {
        articles: {items: []},
        publications: {items: []},
        photos: {items: []},
        livestreams: {items: []},
        apps: [],
      },
    })
    render(<AtmosphereExploreTab />)

    expect(screen.getByText('nux')).toBeTruthy()
    expect(screen.queryByText(/^banner:/)).toBeNull()
    expect(
      screen.queryByText(/^(articles|publications|apps|photos|livestreams):/),
    ).toBeNull()
  })

  it('keeps cached content and offers retry when a background refetch fails', () => {
    setQuery({data, isError: true})
    render(<AtmosphereExploreTab />)

    expect(screen.getByText('articles:Live article')).toBeTruthy()
    expect(
      screen.getByText('Could not load Atmosphere content. Please try again.'),
    ).toBeTruthy()
    fireEvent.press(screen.getByTestId('retry'))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['loading', {isPending: true}],
    ['error', {isError: true}],
    ['loaded', {data}],
  ])('shows the spinner only for a pull while %s', async (_name, result) => {
    const refresh = createDeferrable()
    refetch.mockReturnValueOnce(refresh.complete)
    setQuery({...result, isRefetching: true})
    render(<AtmosphereExploreTab />)

    expect(getRefreshControlProps().refreshing).toBe(false)
    act(() => {
      void getRefreshControlProps().onRefresh?.()
    })
    expect(refetch).toHaveBeenCalledTimes(1)
    expect(getRefreshControlProps().refreshing).toBe(true)

    await act(async () => {
      refresh.resolve()
      await refresh.complete
    })
    expect(getRefreshControlProps().refreshing).toBe(false)
  })

  it('clears the pull spinner when refetch rejects', async () => {
    const refresh = createDeferrable()
    refetch.mockReturnValueOnce(refresh.complete)
    setQuery({data})
    render(<AtmosphereExploreTab />)

    let completion: unknown
    act(() => {
      completion = getRefreshControlProps().onRefresh?.()
    })
    expect(getRefreshControlProps().refreshing).toBe(true)

    await act(async () => {
      refresh.reject(new Error('offline'))
      await expect(completion).rejects.toThrow('offline')
    })
    expect(getRefreshControlProps().refreshing).toBe(false)
    expect(screen.getByText('articles:Live article')).toBeTruthy()
  })
})

const ARTICLE_REQUEST = '18446744073709551615'
const PHOTO_REQUEST = '18446744073709551616'
const DOCUMENT_URI = 'at://did:web:writer.test/site.standard.document/1'
const GALLERY_URI = 'at://did:web:writer.test/social.grain.gallery/1'
const RECORD_CID = 'bafyreicl6ujc6ncfktctxxroxognfn7d2fqavvrryoc2lv6m4i6hpbkfti'

function recommendations(): app.bsky.unspecced.getAtmosphereExploreTab.$OutputBody {
  return {
    ...exploreResponseFixture,
    articles: {
      recIdStr: ARTICLE_REQUEST,
      items: [
        {
          featured: true,
          view: {
            ...exploreResponseFixture.articles.items[0].view,
            associatedRefs: [{uri: DOCUMENT_URI, cid: RECORD_CID}],
          },
        },
      ],
    },
    photos: {
      recIdStr: PHOTO_REQUEST,
      items: [
        {
          featured: true,
          view: {
            ...exploreResponseFixture.photos.items[0].view,
            associatedRefs: [
              {
                uri: 'at://did:web:writer.test/social.grain.photo/1',
                cid: RECORD_CID,
              },
              {uri: GALLERY_URI, cid: RECORD_CID},
            ],
          },
        },
      ],
    },
  }
}

function sectionContent(
  section: 'articles' | 'photos',
  response: ReturnType<typeof recommendations>,
) {
  return section === 'articles'
    ? {type: 'article' as const, view: response.articles.items[0].view}
    : {type: 'gallery' as const, view: response.photos.items[0].view}
}

function flushFeedback() {
  act(() => jest.advanceTimersByTime(10e3))
}

describe('Explore recommendation feedback', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it.each([true, false])(
    'routes more/less by record and section request, independently of Discover: %s',
    discoverEnabled => {
      if (!discoverEnabled) DISCOVER_FEEDBACK.feedUri = undefined
      const response = recommendations()
      setQuery({data: response})
      render(<AtmosphereExploreTab />)
      expect(mockCall).not.toHaveBeenCalled()

      act(() => {
        for (const section of ['articles', 'photos'] as const) {
          const send = mockFeedback[section]?.(
            sectionContent(section, response),
          )
          expect(send).toEqual(expect.any(Function))
          send?.('app.bsky.feed.defs#requestMore')
          send?.('app.bsky.feed.defs#requestLess')
        }
      })
      flushFeedback()
      expect(mockCall.mock.calls).toEqual(
        [
          [DOCUMENT_URI, ARTICLE_REQUEST, FEED_URIS.articles],
          [GALLERY_URI, PHOTO_REQUEST, FEED_URIS.photos],
        ].map(([item, reqId, feed]) => [
          app.bsky.feed.sendInteractions,
          {
            feed,
            interactions: [
              'app.bsky.feed.defs#requestMore',
              'app.bsky.feed.defs#requestLess',
            ].map(event => ({
              item,
              reqId,
              event,
              viewContext: 'feed',
            })),
          },
          {service: 'did:web:discover.bsky.app#bsky_fg'},
        ]),
      )
    },
  )

  it.each(['articles', 'photos'] as const)(
    'disables only %s when its feed URI is undefined',
    section => {
      const destination =
        section === 'articles'
          ? EXPLORE_ARTICLES_FEEDBACK
          : EXPLORE_PHOTOS_FEEDBACK
      destination.feedUri = undefined
      const response = recommendations()
      setQuery({data: response})
      render(<AtmosphereExploreTab />)
      expect(
        mockFeedback[section]?.(sectionContent(section, response)),
      ).toBeUndefined()

      const other = section === 'articles' ? 'photos' : 'articles'
      const send = mockFeedback[other]?.(sectionContent(other, response))
      expect(send).toEqual(expect.any(Function))
      act(() => send?.('app.bsky.feed.defs#requestMore'))
      flushFeedback()
      expect(mockCall).toHaveBeenCalledTimes(1)
      expect(mockCall).toHaveBeenCalledWith(
        app.bsky.feed.sendInteractions,
        {
          feed: FEED_URIS[other],
          interactions: [
            {
              item: other === 'articles' ? DOCUMENT_URI : GALLERY_URI,
              reqId: response[other].recIdStr,
              event: 'app.bsky.feed.defs#requestMore',
              viewContext: 'feed',
            },
          ],
        },
        {service: 'did:web:discover.bsky.app#bsky_fg'},
      )
      expect(DISCOVER_FEEDBACK.feedUri).toBe(
        PROD_DEFAULT_FEED('atmosphere-activity'),
      )
    },
  )

  it.each(['articles', 'photos'] as const)(
    'omits feedback for curated %s without disabling the other section',
    section => {
      const response = recommendations()
      response[section].recIdStr = undefined
      setQuery({data: response})
      render(<AtmosphereExploreTab />)
      expect(
        mockFeedback[section]?.(sectionContent(section, response)),
      ).toBeUndefined()
      const other = section === 'articles' ? 'photos' : 'articles'
      expect(mockFeedback[other]?.(sectionContent(other, response))).toEqual(
        expect.any(Function),
      )
    },
  )

  it.each(['signed out', 'missing record'])(
    'omits both item scopes when %s',
    condition => {
      const response = recommendations()
      if (condition === 'signed out') mockHasSession = false
      else {
        response.articles.items[0].view.associatedRefs = []
        response.photos.items[0].view.associatedRefs = []
      }
      setQuery({data: response})
      render(<AtmosphereExploreTab />)
      for (const section of ['articles', 'photos'] as const) {
        expect(
          mockFeedback[section]?.(sectionContent(section, response)),
        ).toBeUndefined()
      }
      flushFeedback()
      expect(mockCall).not.toHaveBeenCalled()
    },
  )

  it('routes shares and item/author clicks with separate section attribution', () => {
    const response = recommendations()
    const events = [
      'app.bsky.feed.defs#interactionShare',
      'app.bsky.feed.defs#clickthroughItem',
      'app.bsky.feed.defs#clickthroughAuthor',
    ] as const
    setQuery({data: response})
    render(<AtmosphereExploreTab />)
    act(() => {
      for (const section of ['articles', 'photos'] as const) {
        const send = mockFeedback[section]?.(sectionContent(section, response))
        for (const event of events) send?.(event)
      }
    })
    flushFeedback()
    expect(mockCall.mock.calls).toEqual(
      [
        [DOCUMENT_URI, ARTICLE_REQUEST, FEED_URIS.articles],
        [GALLERY_URI, PHOTO_REQUEST, FEED_URIS.photos],
      ].map(([item, reqId, feed]) => [
        app.bsky.feed.sendInteractions,
        {
          feed,
          interactions: events.map(event => ({
            item,
            reqId,
            event,
            viewContext: 'feed',
          })),
        },
        {service: 'did:web:discover.bsky.app#bsky_fg'},
      ]),
    )
  })

  it('forwards events without an Explore allowlist and preserves report payloads', () => {
    const response = recommendations()
    const payload = {
      type: 'report',
      reason: 'tools.ozone.report.defs#reasonMisleadingSpam',
    } as const
    setQuery({data: response})
    render(<AtmosphereExploreTab />)
    expect(mockCall).not.toHaveBeenCalled()
    act(() => {
      for (const section of ['articles', 'photos'] as const) {
        const send = mockFeedback[section]?.(sectionContent(section, response))
        send?.('app.bsky.feed.defs#interactionSeen')
        send?.('app.bsky.feed.defs#interactionUnspecced', payload)
      }
    })
    flushFeedback()
    expect(mockCall.mock.calls).toEqual(
      [
        [DOCUMENT_URI, ARTICLE_REQUEST, FEED_URIS.articles],
        [GALLERY_URI, PHOTO_REQUEST, FEED_URIS.photos],
      ].map(([item, reqId, feed]) => [
        app.bsky.feed.sendInteractions,
        {
          feed,
          interactions: [
            {
              item,
              reqId,
              event: 'app.bsky.feed.defs#interactionSeen',
              viewContext: 'feed',
            },
            {
              item,
              reqId,
              event: 'app.bsky.feed.defs#interactionUnspecced',
              payload,
              viewContext: 'feed',
            },
          ],
        },
        {service: 'did:web:discover.bsky.app#bsky_fg'},
      ]),
    )
  })
})
