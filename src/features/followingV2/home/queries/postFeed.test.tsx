import {type PropsWithChildren} from 'react'
import {AppState} from 'react-native'
import {
  type InfiniteData,
  notifyManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import {act, renderHook, waitFor} from '@testing-library/react-native'

import {PROD_DEFAULT_FEED} from '#/lib/constants'
import {logger} from '#/logger'
import {
  findAllPostsInQueryData,
  resetProfilePostsQueries,
  RQKEY as LEGACY_RQKEY,
  RQKEY_ROOT,
} from '#/state/queries/post-feed'
import {DEFAULT_LOGGED_OUT_PREFERENCES} from '#/state/queries/preferences/const'
import {FALLBACK_MARKER_POST} from '#/features/followingV2/home/api/home'
import {app} from '#/lexicons'
import {isFollowingSnapshotQuery} from './followingSnapshot'
import {
  type FeedDescriptor,
  type FeedPageUnselected,
  type FeedParams,
  pollLatest,
  RQKEY,
  usePostFeedFetcher,
  usePostFeedQuery,
  usePostFeedRefresh,
} from './postFeed'

jest.mock('#/state/preferences/languages', () => ({
  getAppLanguageAsContentLanguage: () => '',
  getContentLanguages: () => [],
}))
jest.mock('#/state/preferences/feed-tuners', () => ({
  useFeedTuners: () => mockFeedTuners,
}))
jest.mock('#/state/preferences/moderation-opts', () => ({
  useModerationOpts: () => mockModerationOpts,
}))
jest.mock('#/state/queries/preferences', () => ({
  usePreferencesQuery: () => ({data: mockPreferences}),
}))
jest.mock('#/state/session', () => ({
  useAppviewClient: () => mockClient,
  useSession: () => ({hasSession: true}),
}))
jest.mock('#/view/com/posts/PostFeedErrorMessage', () => ({
  KnownError: {FeedSignedInOnly: 'FeedSignedInOnly'},
}))
jest.mock('#/state/queries/util', () => ({
  ...jest.requireActual('#/state/queries/util'),
  useAutoPagination: jest.fn(),
}))

const mockFeedTuners: never[] = []
const MODERATION_OPTS = {
  userDid: 'did:plc:viewer',
  prefs: DEFAULT_LOGGED_OUT_PREFERENCES.moderationPrefs,
  labelDefs: {},
}
let mockModerationOpts: typeof MODERATION_OPTS | undefined
let mockPreferences:
  | {
      savedFeeds: {pinned: boolean; value: string}[]
      interests: {tags: string[]}
    }
  | undefined

const DISCOVER = PROD_DEFAULT_FEED('whats-hot')
const CUSTOM = 'at://did:plc:author/app.bsky.feed.generator/custom'

/** How many pages each fake endpoint has. */
let pageCounts: Record<string, number>

/**
 * A fake appview. Cursors are `<endpoint>:<page>` and posts
 * `<endpoint>-<page>`, so a page shows which request served it.
 */
const mockClient = {
  did: 'did:plc:viewer',
  call: jest.fn(
    (
      method: unknown,
      params: {feed?: string; cursor?: string; limit: number},
    ): unknown => {
      const endpoint = endpointOf(method, params)
      if (params.limit === 1) {
        return {feed: [feedItem(`${endpoint}-latest`)]}
      }
      const page = params.cursor ? Number(params.cursor.split(':')[1]) + 1 : 1
      return {
        cursor: page < pageCounts[endpoint] ? `${endpoint}:${page}` : undefined,
        feed: [feedItem(`${endpoint}-${page}`)],
      }
    },
  ),
}

function endpointOf(method: unknown, params: {feed?: string}) {
  if (method === app.bsky.feed.getTimeline) return 'timeline'
  if (method === app.bsky.feed.getFeed && params.feed === DISCOVER) {
    return 'discover'
  }
  if (method === app.bsky.feed.getFeed && params.feed === CUSTOM) {
    return 'custom'
  }
  throw new Error('Unexpected request')
}

/** The requests made, as `<endpoint> <cursor>`. */
function requested() {
  return mockClient.call.mock.calls.map(
    ([method, params]) =>
      `${endpointOf(method, params)} ${params.limit === 1 ? 'latest' : params.cursor}`,
  )
}

function feedItem(rkey: string) {
  return {
    post: {
      $type: 'app.bsky.feed.defs#postView',
      uri: `at://did:plc:author/app.bsky.feed.post/${rkey}`,
      cid: 'bafyreie5737gdxlw5i64vzichcalba3z2v5n6icifvx5xytvske7mr3hpm',
      author: {did: 'did:plc:author', handle: 'author.test', labels: []},
      record: {
        $type: 'app.bsky.feed.post',
        text: `Post ${rkey}`,
        createdAt: '2026-09-28T00:00:00.000Z',
      },
      indexedAt: '2026-09-28T00:00:00.000Z',
      labels: [],
    },
  } as unknown as app.bsky.feed.defs.FeedViewPost
}

function postUris(data: InfiniteData<FeedPageUnselected>) {
  return data.pages.map(page => page.feed.map(item => item.post.uri))
}

function createQueryClient() {
  return new QueryClient({
    // As the app's client, which shares nothing between results.
    defaultOptions: {
      queries: {gcTime: Infinity, retry: false, structuralSharing: false},
    },
  })
}

async function renderFeed(
  feed: FeedDescriptor,
  {
    params,
    queryClient = createQueryClient(),
  }: {params?: FeedParams; queryClient?: QueryClient} = {},
) {
  const wrapper = ({children}: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const hook = renderHook(
    () => ({
      query: usePostFeedQuery(feed, params),
      fetcher: usePostFeedFetcher(feed),
    }),
    {wrapper},
  )
  await waitFor(() => expect(hook.result.current.query.isSuccess).toBe(true))
  const data = () =>
    queryClient.getQueryData<InfiniteData<FeedPageUnselected>>(
      RQKEY(feed, params),
    )!
  const fetchNextPage = () =>
    act(() => hook.result.current.query.fetchNextPage())
  return {hook, queryClient, data, fetchNextPage}
}

/** What persisting and restoring the query data does to it. */
function roundTrip<T>(data: T): T {
  return JSON.parse(JSON.stringify(data))
}

/** Loads `feed` into a new client from data restored from JSON. */
async function renderRestoredFeed(
  feed: FeedDescriptor,
  data: InfiniteData<FeedPageUnselected>,
) {
  const queryClient = createQueryClient()
  queryClient.setQueryData(RQKEY(feed), roundTrip(data))
  mockClient.call.mockClear()
  return renderFeed(feed, {queryClient})
}

beforeAll(() => {
  notifyManager.setNotifyFunction(callback => {
    act(callback)
  })
})

const dev = __DEV__
const appState = AppState.currentState

beforeEach(() => {
  jest.clearAllMocks()
  mockModerationOpts = MODERATION_OPTS
  mockPreferences = {savedFeeds: [], interests: {tags: []}}
  pageCounts = {timeline: 3, discover: 3, custom: 3}
})

afterEach(() => {
  setDev(dev)
  AppState.currentState = appState
})

/** `__DEV__` decides whether Home's fallback goes on to fetch Discover. */
function setDev(value: boolean) {
  Object.assign(globalThis, {__DEV__: value})
}

/** Pins Following first, which makes the Following feed Home. */
function pinFollowingFirst() {
  mockPreferences = {
    savedFeeds: [{pinned: true, value: 'following'}],
    interests: {tags: []},
  }
}

describe('post-feed query data', () => {
  it.each([
    ['following', 'timeline'],
    [`feedgen|${CUSTOM}`, 'custom'],
  ] as const)(
    'round-trips %s through JSON and continues from it',
    async (feed, endpoint) => {
      const {data, fetchNextPage} = await renderFeed(feed)
      await fetchNextPage()

      // JSON turns the first page param, undefined, into null.
      expect(roundTrip(data())).toEqual({
        pages: data().pages,
        pageParams: [null, {cursor: `${endpoint}:1`}],
      })

      const restored = await renderRestoredFeed(feed, data())
      await restored.fetchNextPage()

      expect(requested()).toEqual([`${endpoint} ${endpoint}:2`])
      expect(postUris(restored.data()).flat()).toEqual(
        postUris(data())
          .flat()
          .concat(feedItem(`${endpoint}-3`).post.uri),
      )
    },
  )

  it('keeps the startCursor of a Following page', async () => {
    mockClient.call.mockImplementationOnce(() => ({
      cursor: 'timeline:1',
      startCursor: 'start',
      feed: [feedItem('timeline-1')],
    }))
    const {data} = await renderFeed('following')
    expect(data().pages[0].startCursor).toBe('start')
  })

  it('round-trips Home after its Discover fallback and continues in Discover', async () => {
    setDev(false)
    pinFollowingFirst()
    pageCounts.timeline = 1
    const {data, fetchNextPage} = await renderFeed('following')
    await fetchNextPage()

    expect(requested()).toEqual([
      'timeline undefined',
      'discover ',
      'discover discover:1',
    ])
    expect(data().pages.map(page => page.source)).toEqual([
      'discover',
      'discover',
    ])
    expect(data().pages[0].feed).toContain(FALLBACK_MARKER_POST)
    expect(roundTrip(data())).toEqual({
      pages: data().pages,
      pageParams: [null, {cursor: 'discover:1', source: 'discover'}],
    })

    const restored = await renderRestoredFeed('following', data())
    await restored.fetchNextPage()

    expect(requested()).toEqual(['discover discover:2'])
  })
})

describe('selection', () => {
  it('selects nothing until moderation is ready', async () => {
    const {data} = await renderFeed('following')
    const queryClient = createQueryClient()
    queryClient.setQueryData(RQKEY('following'), roundTrip(data()))
    mockClient.call.mockClear()
    mockModerationOpts = undefined
    const wrapper = ({children}: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const hook = renderHook(() => usePostFeedQuery('following'), {wrapper})

    expect(hook.result.current.data).toBeUndefined()
    expect(hook.result.current.isError).toBe(false)

    mockModerationOpts = MODERATION_OPTS
    hook.rerender({})
    expect(
      hook.result.current.data?.pages[0].slices.map(slice => slice.feedPostUri),
    ).toEqual([feedItem('timeline-1').post.uri])
    expect(requested()).toEqual([])
  })

  it('tunes a page put above the others after them, so their rows stay as they were', async () => {
    const {hook, queryClient, data, fetchNextPage} =
      await renderFeed('following')
    await fetchNextPage()
    await waitFor(() =>
      expect(hook.result.current.query.data?.pages).toHaveLength(2),
    )
    const [top, next] = hook.result.current.query.data!.pages

    // The new page has its own copy of a post the old top already shows.
    act(() => {
      queryClient.setQueryData(RQKEY('following'), {
        pages: [
          {
            cursor: 'timeline:0',
            feed: [feedItem('new'), feedItem('timeline-1')],
            fetchedAt: Math.max(...data().pages.map(p => p.fetchedAt)) + 1,
          },
          ...data().pages,
        ],
        pageParams: [undefined, ...data().pageParams],
      })
    })
    await waitFor(() =>
      expect(hook.result.current.query.data?.pages).toHaveLength(3),
    )

    const pages = hook.result.current.query.data!.pages
    expect(pages[1]).toBe(top)
    expect(pages[2]).toBe(next)
    expect(pages[0].slices.map(slice => slice.feedPostUri)).toEqual([
      feedItem('new').post.uri,
    ])

    // A page loaded below them is tuned last, and the rest are reused.
    await fetchNextPage()
    await waitFor(() =>
      expect(hook.result.current.query.data?.pages).toHaveLength(4),
    )
    hook.result.current.query
      .data!.pages.slice(0, 3)
      .forEach((page, i) => expect(page).toBe(pages[i]))
  })
})

describe('Home feed', () => {
  it('carries the Discover fallback on from the page where Following ran out', async () => {
    setDev(false)
    pinFollowingFirst()
    pageCounts.timeline = 2
    const {data, fetchNextPage} = await renderFeed('following')
    await fetchNextPage()
    await fetchNextPage()

    expect(requested()).toEqual([
      'timeline undefined',
      'timeline timeline:1',
      'discover ',
      'discover discover:1',
    ])
    expect(data().pageParams).toEqual([
      undefined,
      {cursor: 'timeline:1'},
      {cursor: 'discover:1', source: 'discover'},
    ])
    expect(data().pages.map(page => page.source)).toEqual([
      undefined,
      'discover',
      'discover',
    ])
  })

  it('starts again from Following on refetch', async () => {
    setDev(false)
    pinFollowingFirst()
    pageCounts.timeline = 1
    const {hook, data} = await renderFeed('following')
    pageCounts.timeline = 3
    mockClient.call.mockClear()

    await act(() => hook.result.current.query.refetch())

    expect(requested()).toEqual(['timeline undefined'])
    expect(data().pages[0].source).toBeUndefined()
  })
})

describe('pollLatest', () => {
  beforeEach(() => {
    AppState.currentState = 'active'
  })

  it('peeks with a fresh API at restored data', async () => {
    const {data} = await renderFeed('following')
    const {hook} = await renderRestoredFeed('following', data())
    const poll = () =>
      pollLatest(
        hook.result.current.query.data?.pages[0],
        hook.result.current.fetcher.createFeedApi(),
      )

    await expect(poll()).resolves.toBe(true)
    expect(requested()).toEqual(['timeline latest'])
  })

  it('finds nothing new when the latest post is already at the top', async () => {
    const {hook} = await renderFeed('following')
    mockClient.call.mockReturnValueOnce({feed: [feedItem('timeline-1')]})

    await expect(
      pollLatest(
        hook.result.current.query.data?.pages[0],
        hook.result.current.fetcher.createFeedApi(),
      ),
    ).resolves.toBe(false)
  })

  it('peeks at Discover for a Home feed that has fallen back to it', async () => {
    setDev(false)
    pinFollowingFirst()
    pageCounts.timeline = 1
    const {data} = await renderFeed('following')
    const {hook} = await renderRestoredFeed('following', data())

    await pollLatest(
      hook.result.current.query.data?.pages[0],
      hook.result.current.fetcher.createFeedApi(),
    )

    expect(requested()).toEqual(['discover latest'])
  })
})

describe('usePostFeedRefresh', () => {
  const KEY = RQKEY('following')

  async function renderRefreshableFeed() {
    const queryClient = createQueryClient()
    const wrapper = ({children}: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    /** The data of every render, to count the renders a write causes. */
    const rendered: unknown[] = []
    const hook = renderHook(
      () => {
        const query = usePostFeedQuery('following')
        // Read as PostFeed does, so that a change to it alone renders too.
        void query.isFetching
        rendered.push(query.data)
        return {query, ...usePostFeedRefresh('following')}
      },
      {wrapper},
    )
    await waitFor(() => expect(hook.result.current.query.isSuccess).toBe(true))
    mockClient.call.mockClear()
    const data = () =>
      queryClient.getQueryData<InfiniteData<FeedPageUnselected>>(KEY)
    return {hook, queryClient, rendered, data}
  }

  /** Every write of the query's data from here on. */
  function watchWrites(queryClient: QueryClient) {
    const writes: unknown[] = []
    queryClient.getQueryCache().subscribe(event => {
      if (event.type === 'updated' && event.action.type === 'success') {
        writes.push(event.query.state.data)
      }
    })
    return writes
  }

  /** Holds the next request until the test answers it. */
  function holdNextRequest() {
    let resolve!: (value: unknown) => void
    let reject!: (error: unknown) => void
    mockClient.call.mockImplementationOnce(
      () =>
        new Promise((res, rej) => {
          resolve = res
          reject = rej
        }),
    )
    return {
      respond: (rkey: string) =>
        resolve({cursor: 'timeline:1', feed: [feedItem(rkey)]}),
      fail: (error: Error) => reject(error),
    }
  }

  function failNextRequest(error: Error) {
    mockClient.call.mockImplementationOnce(() => Promise.reject(error))
  }

  /** Lets TanStack deliver the notifications it has scheduled. */
  function flushNotifications() {
    return act(() => new Promise<void>(resolve => setTimeout(resolve, 0)))
  }

  function topPostUri(data?: InfiniteData<FeedPageUnselected>) {
    return data?.pages[0]?.feed[0]?.post.uri
  }

  it('writes the new top page once, in one render, and paginates from it', async () => {
    const {hook, queryClient, rendered, data} = await renderRefreshableFeed()
    await act(() => hook.result.current.query.fetchNextPage())
    const writes = watchWrites(queryClient)
    const rendersBefore = rendered.length
    mockClient.call.mockReturnValueOnce({
      cursor: 'timeline:1',
      feed: [feedItem('fresh')],
    })

    let written: unknown
    await act(async () => {
      written = await hook.result.current.refresh()
    })
    await flushNotifications()

    expect(writes).toHaveLength(1)
    expect(written).toBe(data()?.pages[0])
    expect(data()?.pageParams).toEqual([undefined])
    expect(topPostUri(data())).toBe(feedItem('fresh').post.uri)
    const dataChanges = rendered
      .slice(rendersBefore)
      .filter(
        (d, i, all) => d !== (i ? all[i - 1] : rendered[rendersBefore - 1]),
      )
    expect(dataChanges).toHaveLength(1)

    mockClient.call.mockClear()
    await act(() => hook.result.current.query.fetchNextPage())
    expect(requested()).toEqual(['timeline timeline:1'])
  })

  it('keeps the pages and their pagination when the refresh fails', async () => {
    const {hook, queryClient, data} = await renderRefreshableFeed()
    const before = data()
    const writes = watchWrites(queryClient)
    failNextRequest(new Error('offline'))

    await act(() => hook.result.current.refresh())

    expect(hook.result.current.error?.message).toBe('offline')
    expect(writes).toHaveLength(0)
    expect(data()).toBe(before)
    expect(hook.result.current.query.isError).toBe(false)
    await act(() => hook.result.current.query.fetchNextPage())
    expect(requested()).toEqual(['timeline undefined', 'timeline timeline:1'])
  })

  it('clears the error while a refresh is pending, and restores it if that fails', async () => {
    const {hook} = await renderRefreshableFeed()
    const state = () => hook.result.current
    failNextRequest(new Error('offline'))
    await act(() => hook.result.current.refresh())

    const retry = holdNextRequest()
    let retrying!: Promise<unknown>
    act(() => {
      retrying = hook.result.current.refresh()
    })
    expect(state().error).toBeUndefined()
    expect(state().isRefreshing).toBe(true)

    await act(async () => {
      retry.fail(new Error('still offline'))
      await retrying
    })
    expect(state().error?.message).toBe('still offline')
    expect(state().isRefreshing).toBe(false)

    await act(() => hook.result.current.refresh())
    expect(state().error).toBeUndefined()
  })

  it('logs unexpected errors but not network ones', async () => {
    const logError = jest.spyOn(logger, 'error').mockImplementation(() => {})
    try {
      const {hook} = await renderRefreshableFeed()
      failNextRequest(new TypeError('Network request failed'))
      await act(() => hook.result.current.refresh())
      expect(hook.result.current.error).toBeDefined()
      expect(logError).not.toHaveBeenCalled()

      failNextRequest(new Error('Unexpected'))
      await act(() => hook.result.current.refresh())
      expect(logError).toHaveBeenCalledTimes(1)
    } finally {
      logError.mockRestore()
    }
  })

  it('joins a refresh already in flight', async () => {
    const {hook, queryClient} = await renderRefreshableFeed()
    const writes = watchWrites(queryClient)
    const top = holdNextRequest()

    let first!: Promise<unknown>
    let second!: Promise<unknown>
    act(() => {
      first = hook.result.current.refresh()
      second = hook.result.current.refresh()
    })
    await act(async () => {
      top.respond('fresh')
      await Promise.all([first, second])
    })

    expect(second).toBe(first)
    expect(requested()).toEqual(['timeline undefined'])
    expect(writes).toHaveLength(1)
  })

  it('cancels a fetchNextPage still in flight, and drops its page', async () => {
    const {hook, queryClient, data} = await renderRefreshableFeed()
    const next = holdNextRequest()
    let fetchingNextPage!: Promise<unknown>
    act(() => {
      fetchingNextPage = hook.result.current.query.fetchNextPage()
    })
    const writes = watchWrites(queryClient)
    mockClient.call.mockReturnValueOnce({
      cursor: 'timeline:1',
      feed: [feedItem('fresh')],
    })

    await act(() => hook.result.current.refresh())
    await act(async () => {
      next.respond('late')
      await fetchingNextPage
    })

    expect(writes).toHaveLength(1)
    expect(data()?.pages).toHaveLength(1)
    expect(topPostUri(data())).toBe(feedItem('fresh').post.uri)
    expect(hook.result.current.query.isFetchingNextPage).toBe(false)
  })

  it('still writes after a page load lands while it is in flight', async () => {
    const {hook, data} = await renderRefreshableFeed()
    const top = holdNextRequest()
    let refreshing!: Promise<unknown>
    act(() => {
      refreshing = hook.result.current.refresh()
    })
    await act(() => hook.result.current.query.fetchNextPage())
    expect(data()?.pages).toHaveLength(2)

    await act(async () => {
      top.respond('fresh')
      await refreshing
    })

    expect(data()?.pages).toHaveLength(1)
    expect(topPostUri(data())).toBe(feedItem('fresh').post.uri)
  })

  describe('gives way to TanStack', () => {
    it('when a refetch has replaced the top page', async () => {
      const {hook, data} = await renderRefreshableFeed()
      const top = holdNextRequest()
      let refreshing!: Promise<unknown>
      act(() => {
        refreshing = hook.result.current.refresh()
      })
      await act(() => hook.result.current.query.refetch())
      const refetched = data()

      await act(async () => {
        top.respond('fresh')
        await expect(refreshing).resolves.toBeUndefined()
      })

      expect(data()).toBe(refetched)
    })

    it('when a refetch from the top is still in flight', async () => {
      const {hook, queryClient, data} = await renderRefreshableFeed()
      const top = holdNextRequest()
      const refetch = holdNextRequest()
      let refreshing!: Promise<unknown>
      act(() => {
        refreshing = hook.result.current.refresh()
        void hook.result.current.query.refetch()
      })
      const writes = watchWrites(queryClient)

      await act(async () => {
        top.respond('fresh')
        await refreshing
      })
      expect(writes).toHaveLength(0)

      await act(async () => {
        refetch.respond('refetched')
        await waitFor(() => expect(writes).toHaveLength(1))
      })
      expect(topPostUri(data())).toBe(feedItem('refetched').post.uri)
    })

    it('when the feed is reset', async () => {
      const {hook, queryClient, data} = await renderRefreshableFeed()
      const top = holdNextRequest()
      let refreshing!: Promise<unknown>
      act(() => {
        refreshing = hook.result.current.refresh()
      })
      await act(() => queryClient.resetQueries({queryKey: KEY}))

      await act(async () => {
        top.respond('fresh')
        await refreshing
      })

      expect(topPostUri(data())).toBe(feedItem('timeline-1').post.uri)
    })

    it('when the feed is removed', async () => {
      const {hook, queryClient, data} = await renderRefreshableFeed()
      const top = holdNextRequest()
      let refreshing!: Promise<unknown>
      act(() => {
        refreshing = hook.result.current.refresh()
      })
      act(() => {
        queryClient.removeQueries({queryKey: KEY})
      })

      await act(async () => {
        top.respond('fresh')
        await refreshing
      })

      expect(topPostUri(data())).not.toBe(feedItem('fresh').post.uri)
    })
  })

  it('reports nothing when it fails after the feed has moved on', async () => {
    const {hook} = await renderRefreshableFeed()
    const top = holdNextRequest()
    let refreshing!: Promise<unknown>
    act(() => {
      refreshing = hook.result.current.refresh()
    })
    await act(() => hook.result.current.query.refetch())

    await act(async () => {
      top.fail(new Error('offline'))
      await refreshing
    })

    expect(hook.result.current.error).toBeUndefined()
    expect(hook.result.current.isRefreshing).toBe(false)
  })

  it('still commits when it finishes after the view unmounts', async () => {
    const {hook, queryClient, data} = await renderRefreshableFeed()
    const writes = watchWrites(queryClient)
    const top = holdNextRequest()
    let refreshing!: Promise<unknown>
    act(() => {
      refreshing = hook.result.current.refresh()
    })
    hook.unmount()

    await act(async () => {
      top.respond('fresh')
      await refreshing
    })

    expect(writes).toHaveLength(1)
    expect(topPostUri(data())).toBe(feedItem('fresh').post.uri)
  })

  it('does nothing before the first load has settled', async () => {
    mockPreferences = undefined
    const queryClient = createQueryClient()
    const wrapper = ({children}: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const hook = renderHook(() => usePostFeedRefresh('following'), {wrapper})
    renderHook(() => usePostFeedQuery('following'), {wrapper})

    await act(() => hook.result.current.refresh())

    expect(requested()).toEqual([])
    expect(queryClient.getQueryData(KEY)).toBeUndefined()
  })
})

describe('RQKEY', () => {
  const custom: FeedDescriptor = `feedgen|${CUSTOM}`

  /** A single page holding `feedItem('1')`. */
  function feedData(): InfiniteData<FeedPageUnselected> {
    return {
      pageParams: [undefined],
      pages: [{cursor: undefined, feed: [feedItem('1')], fetchedAt: 0}],
    }
  }

  function isInvalidated(queryClient: QueryClient) {
    return queryClient.getQueryCache().getAll()[0].state.isInvalidated
  }

  afterEach(() => {
    jest.useRealTimers()
  })

  it('is the key the Following snapshot is persisted under', () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(RQKEY('following'), feedData())
    queryClient.setQueryData(LEGACY_RQKEY('following'), feedData())
    queryClient.setQueryData(RQKEY(custom), feedData())

    expect(
      queryClient
        .getQueryCache()
        .getAll()
        .filter(isFollowingSnapshotQuery)
        .map(query => query.queryKey),
    ).toEqual([RQKEY('following')])
  })

  it('never shares an entry with the legacy key', () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(LEGACY_RQKEY(custom), feedData())

    expect(queryClient.getQueryData(RQKEY(custom))).toBeUndefined()
  })

  it('is walked by the legacy cache-wide helpers', () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(RQKEY('following'), feedData())

    expect([
      ...findAllPostsInQueryData(queryClient, feedItem('1').post.uri),
    ]).toHaveLength(1)
  })

  it('is reached by root invalidation', async () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(RQKEY('following'), feedData())

    await queryClient.invalidateQueries({queryKey: [RQKEY_ROOT]})

    expect(isInvalidated(queryClient)).toBe(true)
  })

  it('is reset when its feed matches a profile reset', () => {
    jest.useFakeTimers()
    const queryClient = createQueryClient()
    queryClient.setQueryData(RQKEY(custom), feedData())

    resetProfilePostsQueries(queryClient, 'did:plc:author')
    jest.runAllTimers()

    expect(queryClient.getQueryData(RQKEY(custom))).toBeUndefined()
  })

  it('is not reached by legacy single-feed filters', async () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(RQKEY(custom), feedData())

    await queryClient.invalidateQueries({queryKey: LEGACY_RQKEY(custom)})

    expect(isInvalidated(queryClient)).toBe(false)
  })

  it('does not reach legacy entries', async () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(LEGACY_RQKEY(custom), feedData())

    await queryClient.invalidateQueries({queryKey: RQKEY(custom)})

    expect(isInvalidated(queryClient)).toBe(false)
  })
})
