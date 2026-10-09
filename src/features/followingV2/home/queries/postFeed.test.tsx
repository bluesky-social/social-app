import {memo, type PropsWithChildren} from 'react'
import {AppState, type AppStateStatus} from 'react-native'
import {type ScrollEvent, useSharedValue} from 'react-native-reanimated'
import {type ReanimatedScrollEvent} from 'react-native-reanimated/lib/typescript/hook/commonTypes'
import {
  dehydrate,
  hydrate,
  type InfiniteData,
  notifyManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import {type PersistedClient} from '@tanstack/react-query-persist-client'
import {act, render, renderHook, waitFor} from '@testing-library/react-native'

import {PROD_DEFAULT_FEED} from '#/lib/constants'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {logger} from '#/logger'
import {
  findAllPostsInQueryData,
  resetProfilePostsQueries,
  RQKEY as LEGACY_RQKEY,
  RQKEY_ROOT,
} from '#/state/queries/post-feed'
import {DEFAULT_LOGGED_OUT_PREFERENCES} from '#/state/queries/preferences/const'
import {FALLBACK_MARKER_POST} from '#/features/followingV2/home/api/home'
import {
  LIST_REST_QUIET_MS,
  useListRest,
} from '#/features/followingV2/home/useListRest'
import {
  RETURN_STALE_AFTER,
  useNewPostsCheck,
} from '#/features/followingV2/home/useNewPostsCheck'
import {usePrependPill} from '#/features/followingV2/home/usePrependPill'
import {
  SETTLE_QUIET_MS,
  useSettleAtTop,
} from '#/features/followingV2/home/useSettleAtTop'
import {useSettleScrollHandlers} from '#/features/followingV2/home/useSettleScrollHandlers'
import {app} from '#/lexicons'
import {
  FOLLOWING_SNAPSHOT_VERSION,
  type FollowingSnapshot,
  isFollowingSnapshotQuery,
  loadFollowingSnapshot,
  readFollowingSnapshot,
  saveFollowingSnapshot,
  selectFollowingSnapshot,
} from './followingSnapshot'
import {
  type FeedDescriptor,
  type FeedPage,
  type FeedPageUnselected,
  type FeedParams,
  type FeedPostSlice,
  findGaps,
  gapBelow,
  hasUnseenPosts,
  pollLatest,
  type PostFeedData,
  PROCESS_STARTED_AT,
  RQKEY,
  type StagedPage,
  usePostFeedFetcher,
  usePostFeedGapFill,
  usePostFeedPrepend,
  usePostFeedQuery,
  usePostFeedRefresh,
  usePostFeedSettle,
} from './postFeed'

// The app-wide mock of `multiformats/cid` can't tell a CID from anything else.
jest.unmock('multiformats/cid')
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
/*
 * Just enough of Reanimated and Worklets for `useListRest`, whose worklets run
 * here as the list's scroll handlers, on the JS thread.
 */
jest.mock('react-native-reanimated', () => ({
  useSharedValue: (initial: unknown) => {
    const {useState} = require('react') as typeof import('react')
    return useState(() => {
      let value = initial
      return {
        get: () => value,
        set: (next: unknown) => {
          value = next
        },
      }
    })[0]
  },
}))
jest.mock('react-native-worklets', () => ({
  scheduleOnRN: (fn: (...args: unknown[]) => void, ...args: unknown[]) =>
    fn(...args),
}))

/*
 * What the app subscribes to `AppState` with, for tests to report a change of
 * state to. It's in place before anything subscribes, so it has the one
 * subscription `onAppReturnedFromBackground` keeps for good.
 */
const appStateListeners = new Set<(state: AppStateStatus) => void>()
jest.mocked(AppState.addEventListener).mockImplementation((_type, listener) => {
  appStateListeners.add(listener)
  return {remove: () => appStateListeners.delete(listener)}
})

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
      params: {feed?: string; cursor?: string; since?: string; limit: number},
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

/**
 * The requests made, as `<endpoint> <cursor>`, or `<endpoint> since:<since>`
 * with its limit for a request bounded by `since`.
 */
function requested() {
  return mockClient.call.mock.calls.map(([method, params]) => {
    const endpoint = endpointOf(method, params)
    if (params.limit === 1) return `${endpoint} latest`
    if (params.since !== undefined) {
      return `${endpoint} since:${params.since} limit:${params.limit}`
    }
    return `${endpoint} ${params.cursor}`
  })
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
    respondWith: (response: unknown) => resolve(response),
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

describe('usePostFeedPrepend', () => {
  const KEY = RQKEY('following')
  const SINCE_REQUEST = 'timeline since:start:1 limit:100'
  /** A scroll event, whose contents the list's rest tracking doesn't read. */
  const EVENT = {} as ScrollEvent

  /** Two pages as a restore leaves them: fetched before this process was. */
  function restoredData(): PostFeedData {
    const fetchedAt = PROCESS_STARTED_AT - 60e3
    return {
      pages: [
        {
          cursor: 'timeline:1',
          startCursor: 'start:1',
          feed: [feedItem('timeline-1')],
          fetchedAt,
        },
        {cursor: 'timeline:2', feed: [feedItem('timeline-2')], fetchedAt},
      ],
      pageParams: [undefined, {cursor: 'timeline:1'}],
    }
  }

  /**
   * The feed's view, as PostFeed has it, over `data` already in the cache. Its
   * list has laid out, unless `laidOut` is false. Only an `isActive` view
   * checks for new posts: what it stages lights the Home dot (`onHasNew`), and
   * what a peek alone finds goes to `onFound`.
   */
  function renderView({
    data = restoredData(),
    enabled = true,
    isActive = false,
    laidOut = true,
  }: {
    data?: PostFeedData
    enabled?: boolean
    isActive?: boolean
    laidOut?: boolean
  } = {}) {
    const queryClient = createQueryClient()
    queryClient.setQueryData(KEY, data)
    const wrapper = ({children}: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const onFound = jest.fn()
    const onHasNew = jest.fn()
    const hook = renderHook(
      ({enabled}: {enabled: boolean}) => {
        const query = usePostFeedQuery('following')
        const {createFeedApi} = usePostFeedFetcher('following')
        const listRest = useListRest({}, true)
        const {refresh, isRefreshing, isPending} =
          usePostFeedRefresh('following')
        const topFetchedAt = query.data?.pages[0]?.fetchedAt
        const prepend = usePostFeedPrepend('following', undefined, {
          enabled,
          topFetchedAt,
          listAtRest: listRest.atRest,
          isRefreshing: isPending,
        })
        useNewPostsCheck({
          topFetchedAt,
          isEmpty: false,
          isActive,
          isBusy:
            isRefreshing || (query.isFetching && !query.isFetchingNextPage),
          check: async trigger => {
            const staging = prepend.check(trigger)
            if (!staging) {
              return pollLatest(query.data?.pages[0], createFeedApi())
            }
            const page = await staging
            if (page && hasUnseenPosts(query.data?.pages[0], page.feed)) {
              onHasNew(true)
            }
            return undefined
          },
          onFound,
        })
        return {query, listRest, refresh, prepend}
      },
      {wrapper, initialProps: {enabled}},
    )
    const cached = () => queryClient.getQueryData<PostFeedData>(KEY)!
    const handlers = () => hook.result.current.listRest.scrollHandlers
    /** What the list reports, as `List` does. */
    const list = {
      layOut: () => act(() => hook.result.current.listRest.onLayout()),
      beginDrag: () => act(() => handlers().onBeginDrag?.(EVENT, {})),
      endDrag: () => act(() => handlers().onEndDrag?.(EVENT, {})),
      scroll: () => act(() => handlers().onScroll?.(EVENT, {})),
      endMomentum: () => act(() => handlers().onMomentumEnd?.(EVENT, {})),
    }
    if (laidOut) {
      list.layOut()
    }
    return {hook, queryClient, cached, list, onFound, onHasNew}
  }

  /** Answers the next request with these posts, newer than `since`. */
  function newer(
    rkeys: string[],
    {cursor = 'start:1'}: {cursor?: string} = {},
  ) {
    mockClient.call.mockImplementationOnce(() => ({
      cursor,
      startCursor: 'start:0',
      feed: rkeys.map(feedItem),
    }))
  }

  function postsOf(data: PostFeedData) {
    return data.pages.map(page =>
      page.feed.map(item => item.post.uri.split('/').pop()),
    )
  }

  /** Advances fake time by `ms`, letting what that sets off run. */
  async function wait(ms: number) {
    await act(() => jest.advanceTimersByTimeAsync(ms))
  }

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('runs', () => {
    it('as soon as the view is enabled, before its list has laid out or scrolled', async () => {
      newer([])
      const {hook} = renderView({enabled: false, laidOut: false})
      await flushNotifications()
      expect(requested()).toEqual([])

      hook.rerender({enabled: true})
      await flushNotifications()

      expect(requested()).toEqual([SINCE_REQUEST])
    })

    it('only on a top page restored from disk', async () => {
      const data = restoredData()
      data.pages[0].fetchedAt = Date.now()
      const {hook} = renderView({data})
      await flushNotifications()

      expect(requested()).toEqual([])
      expect(hook.result.current.prepend.isOwed()).toBe(false)
    })

    it('once, whatever it finds', async () => {
      newer([])
      const {hook, cached} = renderView({enabled: false})
      const before = cached()
      expect(hook.result.current.prepend.isOwed()).toBe(true)
      hook.rerender({enabled: true})
      await flushNotifications()

      hook.rerender({enabled: false})
      hook.rerender({enabled: true})
      await flushNotifications()

      expect(requested()).toEqual([SINCE_REQUEST])
      expect(cached()).toBe(before)
      expect(hook.result.current.prepend.isOwed()).toBe(false)
    })

    it('not once a refresh has replaced the restored top', async () => {
      const {hook} = renderView({enabled: false})
      await act(() => hook.result.current.refresh())
      mockClient.call.mockClear()

      hook.rerender({enabled: true})
      await flushNotifications()

      expect(requested()).toEqual([])
      expect(hook.result.current.prepend.isOwed()).toBe(false)
    })
  })

  describe('run', () => {
    it('joins the prepend in progress, rather than fetching its range again', async () => {
      const since = holdNextRequest()
      const {hook, cached} = renderView()
      await flushNotifications()
      expect(requested()).toEqual([SINCE_REQUEST])

      const joined = hook.result.current.prepend.run('return')
      act(() => {
        since.respondWith({cursor: 'start:1', feed: [feedItem('new')]})
      })
      await act(() => joined!)

      expect(requested()).toEqual([SINCE_REQUEST])
      expect(postsOf(cached())).toEqual([
        ['new'],
        ['timeline-1'],
        ['timeline-2'],
      ])
    })

    it('fetches from the same place again once the last is done, and replaces what it staged', async () => {
      newer(['new'])
      const {hook, cached} = renderView()
      await waitFor(() => expect(cached().pages).toHaveLength(3))

      newer(['newer', 'new'])
      await act(() => hook.result.current.prepend.run('interval')!)

      expect(requested()).toEqual([SINCE_REQUEST, SINCE_REQUEST])
      expect(postsOf(cached())).toEqual([
        ['newer', 'new'],
        ['timeline-1'],
        ['timeline-2'],
      ])
      expect(cached().pageParams).toEqual([
        undefined,
        {cursor: 'start:1'},
        {cursor: 'timeline:1'},
      ])
      // Still offered, as the restore's page was.
      expect(hook.result.current.prepend.staged).toEqual({
        fetchedAt: cached().pages[0].fetchedAt,
        offered: true,
        isFull: false,
      })
    })

    it('fetches above the new top once the reader has reached it', async () => {
      newer(['new'])
      const {hook, cached} = renderView()
      await waitFor(() => expect(cached().pages).toHaveLength(3))
      act(() => hook.result.current.prepend.markRead())
      expect(hook.result.current.prepend.staged).toBeUndefined()

      newer(['newer'], {cursor: 'start:0'})
      await act(() => hook.result.current.prepend.run('interval')!)

      expect(requested()).toEqual([
        SINCE_REQUEST,
        'timeline since:start:0 limit:100',
      ])
      expect(postsOf(cached())).toEqual([
        ['newer'],
        ['new'],
        ['timeline-1'],
        ['timeline-2'],
      ])
      expect(hook.result.current.prepend.staged).toEqual({
        fetchedAt: cached().pages[0].fetchedAt,
        offered: false,
        isFull: false,
      })
    })

    it('rejects when the fetch fails, leaving the feed as it was', async () => {
      const data = restoredData()
      data.pages[0].fetchedAt = Date.now()
      const {hook, cached} = renderView({data})
      const before = cached()

      failNextRequest(new TypeError('Network request failed'))
      let error: unknown
      await act(async () => {
        await hook.result.current.prepend.run('return')!.catch(e => {
          error = e
        })
      })

      expect(error).toBeInstanceOf(TypeError)
      expect(cached()).toBe(before)
      expect(hook.result.current.prepend.isOwed()).toBe(false)
    })

    it('is nothing to run without a boundary to fetch above', () => {
      const data = restoredData()
      delete data.pages[0].startCursor
      const {hook} = renderView({data})

      expect(hook.result.current.prepend.run('return')).toBeUndefined()
      expect(requested()).toEqual([])
    })
  })

  describe('holds what it finds', () => {
    it('until the list has laid out, and is owed until then', async () => {
      newer(['new'])
      const {hook, queryClient, cached, list} = renderView({laidOut: false})
      const writes = watchWrites(queryClient)
      await flushNotifications()
      expect(requested()).toEqual([SINCE_REQUEST])
      expect(writes).toHaveLength(0)
      // Checks for new posts still wait for it.
      expect(hook.result.current.prepend.isOwed()).toBe(true)

      list.layOut()
      await waitFor(() => expect(writes).toHaveLength(1))

      expect(postsOf(cached())).toEqual([
        ['new'],
        ['timeline-1'],
        ['timeline-2'],
      ])
      expect(hook.result.current.prepend.isOwed()).toBe(false)
    })

    it('until the list has gone without a scroll event for a while', async () => {
      jest.useFakeTimers()
      const since = holdNextRequest()
      const {cached, list} = renderView()
      // A scroll without a finger on the list, such as a correction.
      list.scroll()
      act(() => {
        since.respondWith({cursor: 'start:1', feed: [feedItem('new')]})
      })
      await wait(LIST_REST_QUIET_MS - 1)
      list.scroll()
      await wait(LIST_REST_QUIET_MS - 1)
      expect(postsOf(cached())).toEqual([['timeline-1'], ['timeline-2']])

      await wait(1)

      expect(postsOf(cached())).toEqual([
        ['new'],
        ['timeline-1'],
        ['timeline-2'],
      ])
    })

    it('through a drag and the momentum after it, however long they last', async () => {
      jest.useFakeTimers()
      const since = holdNextRequest()
      const {hook, cached, list} = renderView()
      list.beginDrag()
      act(() => {
        since.respondWith({cursor: 'start:1', feed: [feedItem('new')]})
      })
      // A finger held still sends no scroll events, but it's still a drag.
      await wait(10e3)
      expect(postsOf(cached())).toEqual([['timeline-1'], ['timeline-2']])
      expect(hook.result.current.prepend.isOwed()).toBe(true)

      // A fling: the list scrolls on by itself after the finger lifts.
      list.endDrag()
      for (let i = 0; i < 60; i++) {
        await wait(16)
        list.scroll()
      }
      list.endMomentum()
      await wait(LIST_REST_QUIET_MS - 1)
      expect(postsOf(cached())).toEqual([['timeline-1'], ['timeline-2']])

      await wait(1)

      expect(postsOf(cached())).toEqual([
        ['new'],
        ['timeline-1'],
        ['timeline-2'],
      ])
      expect(hook.result.current.prepend.isOwed()).toBe(false)
    })
  })

  it('writes nothing when nothing is newer, without waiting for the list', async () => {
    newer([])
    const {hook, queryClient, cached} = renderView({laidOut: false})
    const before = cached()
    const writes = watchWrites(queryClient)

    await flushNotifications()

    expect(writes).toHaveLength(0)
    expect(cached()).toBe(before)
    expect(hook.result.current.prepend.isOwed()).toBe(false)
    expect(hook.result.current.prepend.staged).toBeUndefined()
  })

  it('puts a contiguous page on top, which the page below continues from', async () => {
    // The server echoes since: the range was exhausted.
    newer(['new'], {cursor: 'start:1'})
    const {hook, cached} = renderView()

    await waitFor(() => expect(cached().pages).toHaveLength(3))

    expect(postsOf(cached())).toEqual([['new'], ['timeline-1'], ['timeline-2']])
    expect(cached().pages[0]).toMatchObject({
      cursor: 'start:1',
      startCursor: 'start:0',
      since: 'start:1',
    })
    // The view knows which page it staged on top, for the pill to offer.
    expect(hook.result.current.prepend.staged).toEqual({
      fetchedAt: cached().pages[0].fetchedAt,
      offered: true,
      isFull: false,
    })
    expect(cached().pageParams).toEqual([
      undefined,
      {cursor: 'start:1'},
      {cursor: 'timeline:1'},
    ])

    // Load more carries on from the bottom page.
    mockClient.call.mockClear()
    await act(() => hook.result.current.query.fetchNextPage())
    expect(requested()).toEqual(['timeline timeline:2'])
  })

  it('puts a gapped page on top, which the page below continues from', async () => {
    // More than the limit is newer, so the cursor goes on into the range.
    newer(['new'], {cursor: 'gap:1'})
    const {cached} = renderView()

    await waitFor(() => expect(cached().pages).toHaveLength(3))

    expect(postsOf(cached())).toEqual([['new'], ['timeline-1'], ['timeline-2']])
    expect(cached().pages[0]).toMatchObject({
      cursor: 'gap:1',
      since: 'start:1',
    })
    expect(cached().pageParams).toEqual([
      undefined,
      {cursor: 'gap:1'},
      {cursor: 'timeline:1'},
    ])
  })

  it('leaves a refetch to start an ordinary chain from the top', async () => {
    newer(['new'])
    const {hook, cached} = renderView()
    await waitFor(() => expect(cached().pages).toHaveLength(3))
    mockClient.call.mockClear()

    await act(() => hook.result.current.query.refetch())

    expect(requested()).toEqual([
      'timeline undefined',
      'timeline timeline:1',
      'timeline timeline:2',
    ])
    expect(postsOf(cached())).toEqual([
      ['timeline-1'],
      ['timeline-2'],
      ['timeline-3'],
    ])
  })

  it('tunes the new page last, so a post it shares drops from it and the rows below stay as they were', async () => {
    newer(['new', 'timeline-1'])
    const {hook} = renderView({laidOut: false})
    const [top, next] = hook.result.current.query.data!.pages

    act(() => hook.result.current.listRest.onLayout())
    await waitFor(() =>
      expect(hook.result.current.query.data?.pages).toHaveLength(3),
    )

    const pages = hook.result.current.query.data!.pages
    expect(pages[1]).toBe(top)
    expect(pages[2]).toBe(next)
    expect(pages[0].slices.map(slice => slice.feedPostUri)).toEqual([
      feedItem('new').post.uri,
    ])
  })

  it('keeps the restored feed when it fails, and logs only unexpected errors', async () => {
    const logError = jest.spyOn(logger, 'error').mockImplementation(() => {})
    try {
      failNextRequest(new TypeError('Network request failed'))
      const offline = renderView()
      const before = offline.cached()
      await flushNotifications()
      expect(offline.cached()).toBe(before)
      expect(offline.hook.result.current.query.isError).toBe(false)
      expect(offline.hook.result.current.prepend.isOwed()).toBe(false)
      expect(logError).not.toHaveBeenCalled()

      failNextRequest(new Error('Unexpected'))
      renderView()
      await flushNotifications()
      expect(logError).toHaveBeenCalledTimes(1)
    } finally {
      logError.mockRestore()
    }
  })

  describe('gives way to a refresh that replaces the top', () => {
    it('while it fetches', async () => {
      const since = holdNextRequest()
      const {hook, cached} = renderView()
      mockClient.call.mockReturnValueOnce({
        cursor: 'timeline:1',
        feed: [feedItem('fresh')],
      })
      await act(() => hook.result.current.refresh())
      const refreshed = cached()

      act(() => {
        since.respondWith({cursor: 'start:1', feed: [feedItem('new')]})
      })
      await flushNotifications()

      expect(cached()).toBe(refreshed)
      expect(postsOf(cached())).toEqual([['fresh']])
      expect(hook.result.current.prepend.staged).toBeUndefined()
    })

    it('while it holds what it found', async () => {
      jest.useFakeTimers()
      newer(['new'])
      const {hook, cached, list} = renderView()
      list.beginDrag()
      await wait(0)
      mockClient.call.mockReturnValueOnce({
        cursor: 'timeline:1',
        feed: [feedItem('fresh')],
      })
      await act(() => hook.result.current.refresh())
      const refreshed = cached()

      list.endDrag()
      await wait(LIST_REST_QUIET_MS)

      expect(cached()).toBe(refreshed)
      expect(postsOf(cached())).toEqual([['fresh']])
      expect(hook.result.current.prepend.isOwed()).toBe(false)
      expect(hook.result.current.prepend.staged).toBeUndefined()
    })
  })

  it('keeps a page loaded below meanwhile', async () => {
    const since = holdNextRequest()
    const {hook, queryClient, cached} = renderView()
    await act(() => hook.result.current.query.fetchNextPage())
    const writes = watchWrites(queryClient)

    act(() => {
      since.respondWith({cursor: 'start:1', feed: [feedItem('new')]})
    })
    await waitFor(() => expect(writes).toHaveLength(1))

    expect(postsOf(cached())).toEqual([
      ['new'],
      ['timeline-1'],
      ['timeline-2'],
      ['timeline-3'],
    ])
    expect(cached().pageParams).toEqual([
      undefined,
      {cursor: 'start:1'},
      {cursor: 'timeline:1'},
      {cursor: 'timeline:2'},
    ])
  })

  it('cancels a page load still in flight, and drops its page', async () => {
    const since = holdNextRequest()
    const {hook, queryClient, cached} = renderView()
    const next = holdNextRequest()
    let loading!: Promise<unknown>
    act(() => {
      loading = hook.result.current.query.fetchNextPage()
    })
    const writes = watchWrites(queryClient)

    act(() => {
      since.respondWith({cursor: 'start:1', feed: [feedItem('new')]})
    })
    await waitFor(() => expect(writes).toHaveLength(1))
    await act(async () => {
      next.respond('late')
      await loading
    })

    expect(postsOf(cached())).toEqual([['new'], ['timeline-1'], ['timeline-2']])
    expect(hook.result.current.query.isFetchingNextPage).toBe(false)
  })

  describe('on a real return to the app', () => {
    /** Two pages fetched just now, as a feed loaded this session has. */
    function fetchedData(): PostFeedData {
      const data = restoredData()
      for (const page of data.pages) {
        page.fetchedAt = Date.now()
      }
      return data
    }

    /** Reports the app's state changing to `state`, as `AppState` does. */
    function setAppState(state: AppStateStatus) {
      act(() => {
        AppState.currentState = state
        for (const listener of [...appStateListeners]) {
          listener(state)
        }
      })
    }

    /** Leaves the app for `away` in `state`, then comes back to it. */
    async function leaveFor(
      away: number,
      state: AppStateStatus = 'background',
    ) {
      setAppState(state)
      await wait(away)
      setAppState('active')
      await wait(0)
    }

    /** Answers the next peek with a post newer than the top page's. */
    function answerPeek() {
      mockClient.call.mockImplementationOnce(() => ({
        feed: [feedItem('new')],
      }))
    }

    beforeEach(() => {
      jest.useFakeTimers()
      AppState.currentState = 'active'
    })

    it('fetches what is newer, and puts it on top once the list is at rest', async () => {
      answerPeek()
      const since = holdNextRequest()
      const {hook, cached, list} = renderView({
        data: fetchedData(),
        isActive: true,
      })
      await wait(0)
      expect(requested()).toEqual([])

      await leaveFor(RETURN_STALE_AFTER)
      // It peeks first, and the newest post isn't the one on top.
      expect(requested()).toEqual(['timeline latest', SINCE_REQUEST])

      // The reader has started scrolling again by the time it lands.
      list.beginDrag()
      act(() => {
        since.respondWith({cursor: 'start:1', feed: [feedItem('new')]})
      })
      await wait(10e3)
      expect(postsOf(cached())).toEqual([['timeline-1'], ['timeline-2']])

      list.endDrag()
      await wait(LIST_REST_QUIET_MS)

      expect(postsOf(cached())).toEqual([
        ['new'],
        ['timeline-1'],
        ['timeline-2'],
      ])
      // For the pill to offer.
      expect(hook.result.current.prepend.staged).toEqual({
        fetchedAt: cached().pages[0].fetchedAt,
        offered: true,
        isFull: false,
      })
    })

    it('leaves a gap below what it found when there was more', async () => {
      answerPeek()
      newer(['new'], {cursor: 'gap:1'})
      const {cached} = renderView({data: fetchedData(), isActive: true})

      await leaveFor(RETURN_STALE_AFTER)
      await wait(LIST_REST_QUIET_MS)

      expect(postsOf(cached())).toEqual([
        ['new'],
        ['timeline-1'],
        ['timeline-2'],
      ])
      expect(gapBelow(cached().pages, 0)).toBe('open')
    })

    it('makes no request when the app was only inactive, however long', async () => {
      renderView({data: fetchedData(), isActive: true})

      // As the notification shade or Control Center leave it.
      await leaveFor(10 * RETURN_STALE_AFTER, 'inactive')
      expect(requested()).toEqual([])

      answerPeek()
      newer([])
      await leaveFor(RETURN_STALE_AFTER)
      expect(requested()).toEqual(['timeline latest', SINCE_REQUEST])
    })

    it('joins the restore prepend in progress, rather than fetching its range again', async () => {
      const since = holdNextRequest()
      const data = restoredData()
      // Restored, but not old enough for becoming active to check.
      data.pages[0].fetchedAt = PROCESS_STARTED_AT - 1
      const {cached} = renderView({data, isActive: true})
      await wait(0)
      expect(requested()).toEqual([SINCE_REQUEST])

      await leaveFor(RETURN_STALE_AFTER)
      act(() => {
        since.respondWith({cursor: 'start:1', feed: [feedItem('new')]})
      })
      await wait(LIST_REST_QUIET_MS)

      expect(requested()).toEqual([SINCE_REQUEST])
      expect(postsOf(cached())).toEqual([
        ['new'],
        ['timeline-1'],
        ['timeline-2'],
      ])
    })

    it('gives way to a pull to refresh while it fetches', async () => {
      answerPeek()
      const since = holdNextRequest()
      const {hook, cached} = renderView({
        data: fetchedData(),
        isActive: true,
      })
      await leaveFor(RETURN_STALE_AFTER)
      mockClient.call.mockReturnValueOnce({
        cursor: 'timeline:1',
        feed: [feedItem('fresh')],
      })
      await act(() => hook.result.current.refresh())
      const refreshed = cached()

      act(() => {
        since.respondWith({cursor: 'start:1', feed: [feedItem('new')]})
      })
      await wait(LIST_REST_QUIET_MS)

      expect(cached()).toBe(refreshed)
      expect(postsOf(cached())).toEqual([['fresh']])
      expect(hook.result.current.prepend.staged).toBeUndefined()
    })

    it('peeks for the Home dot when the top page has no boundary to fetch above', async () => {
      const data = fetchedData()
      delete data.pages[0].startCursor
      const {onFound} = renderView({data, isActive: true})

      await leaveFor(RETURN_STALE_AFTER)

      expect(requested()).toEqual(['timeline latest'])
      expect(onFound).toHaveBeenCalledWith(true, 'return')
    })
  })
})

describe('staging new posts on Home Following', () => {
  const KEY = RQKEY('following')
  const SECOND = 1e3
  const MINUTE = 60 * SECOND
  /** How long the fake timeline takes to answer. */
  const LATENCY = 100
  const serveDefault = mockClient.call.getMockImplementation()!

  /** The newest of bob's posts on the fake timeline, `p1` to `p<newest>`. */
  let newest = 12

  function post(n: number) {
    return feedItem(`p${n}`)
  }

  /**
   * The fake timeline, which answers after {@link LATENCY}: a peek is the
   * newest post, a `since` request the newest posts above it, up to the limit,
   * and a fetch from the top the newest 30. Cursors are `t:<post>`.
   */
  function serve(
    method: unknown,
    params: {cursor?: string; since?: string; limit: number},
  ) {
    const response = answer(method, params)
    return new Promise(resolve => setTimeout(() => resolve(response), LATENCY))
  }

  function answer(
    method: unknown,
    params: {cursor?: string; since?: string; limit: number},
  ) {
    if (method !== app.bsky.feed.getTimeline) {
      throw new Error('Unexpected request')
    }
    if (params.limit === 1) {
      return {feed: [post(newest)]}
    }
    const since = params.since ? Number(params.since.split(':')[1]) : 0
    const bottom = Math.max(since + 1, newest - params.limit + 1)
    const feed = []
    for (let n = newest; n >= bottom; n--) {
      feed.push(post(n))
    }
    let cursor: string | undefined = `t:${bottom}`
    if (bottom === since + 1) {
      // The range is exhausted, which a `since` request echoes.
      cursor = params.since
    }
    return {cursor, startCursor: feed.length ? `t:${newest}` : undefined, feed}
  }

  /** Following as loaded this session: p12 and p11, then p10. */
  function homeData(): PostFeedData {
    const fetchedAt = Date.now()
    return {
      pages: [
        {
          cursor: 't:11',
          startCursor: 't:12',
          feed: [post(12), post(11)],
          fetchedAt,
        },
        {startCursor: 't:10', cursor: undefined, feed: [post(10)], fetchedAt},
      ],
      pageParams: [undefined, {cursor: 't:11'}],
    }
  }

  function postsOf(data: PostFeedData) {
    return data.pages.map(page =>
      page.feed.map(item => item.post.uri.split('/').pop()),
    )
  }

  /** A since request from `t:<n>`, as `requested` has it. */
  function since(n: number) {
    return `timeline since:t:${n} limit:100`
  }

  const PEEK = 'timeline latest'

  type Row =
    | {type: 'sliceItem'; key: string; slice: FeedPostSlice}
    | {type: 'gap'; key: string; cursor: string}

  /** The rows PostFeed renders for `pages`, gap rows included. */
  function rowsOf(pages: FeedPage[] = []) {
    const gaps = findGaps(pages)
    return pages.flatMap((page, i): Row[] => {
      const rows: Row[] = page.slices.map(slice => ({
        type: 'sliceItem',
        key: slice.items[0]._reactKey,
        slice,
      }))
      if (gaps.has(i) && page.cursor) {
        rows.push({type: 'gap', key: `gap-${page.since}`, cursor: page.cursor})
      }
      return rows
    })
  }

  /** A scroll event at `y`, moving at `velocity`. */
  function scrollEvent(y: number, velocity = 0) {
    return {
      contentOffset: {x: 0, y},
      velocity: {x: 0, y: velocity},
    } as unknown as ReanimatedScrollEvent
  }

  /**
   * Home's Following view, wired as PostFeed wires it, in a `memo()`
   * component, as PostFeed is. The list's reports go to the handlers its
   * first render made, as a list keeps them, so they must act on the latest
   * state. `onHasNew` is the Home dot.
   */
  function renderHome({isActive = true}: {isActive?: boolean} = {}) {
    const queryClient = createQueryClient()
    queryClient.setQueryData(KEY, homeData())
    const onHasNew = jest.fn()
    const scrollToTop = jest.fn()
    const latest = {} as {
      rows: Row[]
      pill: ReturnType<typeof usePrependPill>
      staged: StagedPage | undefined
      refresh: () => Promise<unknown>
    }
    let first:
      | {
          scrollHandlers: ReturnType<typeof useSettleScrollHandlers>
          onItemSeen: (row: Row) => void
          onLayout: () => void
        }
      | undefined

    const View = memo(function View({isActive}: {isActive: boolean}) {
      const query = usePostFeedQuery('following')
      const {createFeedApi} = usePostFeedFetcher('following')
      const listRest = useListRest({}, true)
      const {refresh, isRefreshing, isPending} = usePostFeedRefresh('following')
      const pages = query.data?.pages
      const topFetchedAt = pages?.[0]?.fetchedAt
      const prepend = usePostFeedPrepend('following', undefined, {
        enabled: true,
        topFetchedAt,
        listAtRest: listRest.atRest,
        isRefreshing: isPending,
      })
      const settleAtTop = useSettleAtTop('following', undefined, {
        enabled: true,
        onRestAtTop: () => onHasNew(false),
      })
      useNewPostsCheck({
        topFetchedAt,
        isEmpty: false,
        isActive,
        isBusy: isRefreshing || (query.isFetching && !query.isFetchingNextPage),
        interval: MINUTE,
        check: async trigger => {
          const staging = prepend.check(trigger)
          if (!staging) {
            return pollLatest(pages?.[0], createFeedApi())
          }
          const page = await staging
          if (page && hasUnseenPosts(pages?.[0], page.feed)) {
            onHasNew(true)
          }
          return undefined
        },
        onFound: () => onHasNew(true),
      })
      const offsetY = useSharedValue(400)
      const rows = rowsOf(pages)
      const pill = usePrependPill({
        enabled: true,
        isActive,
        staged: prepend.staged,
        rows,
        pages,
        offsetY,
        scrollToTop,
        onRead: prepend.markRead,
      })
      const onItemSeen = useNonReactiveCallback((row: Row) => {
        const top = pages?.[0]
        if (
          prepend.staged &&
          top &&
          ((row.type === 'sliceItem' && top.slices.includes(row.slice)) ||
            (row.type === 'gap' && row.cursor === top.cursor))
        ) {
          prepend.onPageSeen(top.fetchedAt)
        }
      })
      const scrollHandlers = useSettleScrollHandlers(
        listRest.scrollHandlers,
        {
          ...settleAtTop,
          onBeginDrag: () => {
            settleAtTop.onBeginDrag()
            prepend.onBeginDrag()
          },
          onReachTop: prepend.markRead,
        },
        offsetY,
      )
      Object.assign(latest, {rows, pill, staged: prepend.staged, refresh})
      first ??= {scrollHandlers, onItemSeen, onLayout: listRest.onLayout}
      return null
    })

    const view = render(
      <QueryClientProvider client={queryClient}>
        <View isActive={isActive} />
      </QueryClientProvider>,
    )
    const handlers = () => first!.scrollHandlers
    /** What the list reports, as `List` does, at offsets in points. */
    const list = {
      beginDrag: (y: number) =>
        act(() => handlers().onBeginDrag?.(scrollEvent(y), {})),
      scroll: (y: number) =>
        act(() => handlers().onScroll?.(scrollEvent(y), {})),
      endDrag: (y: number, velocity = 0) =>
        act(() => handlers().onEndDrag?.(scrollEvent(y, velocity), {})),
      /** The list reports the row with post `p<n>` as seen. */
      see: (n: number) => {
        const row = latest.rows.find(
          row =>
            row.type === 'sliceItem' &&
            row.slice.feedPostUri === post(n).post.uri,
        )!
        act(() => first!.onItemSeen(row))
      },
      seeGap: () => {
        const row = latest.rows.find(row => row.type === 'gap')!
        act(() => first!.onItemSeen(row))
      },
    }
    act(() => first!.onLayout())
    const cached = () => queryClient.getQueryData<PostFeedData>(KEY)!
    const setActive = (isActive: boolean) =>
      view.rerender(
        <QueryClientProvider client={queryClient}>
          <View isActive={isActive} />
        </QueryClientProvider>,
      )
    return {latest, cached, list, onHasNew, setActive}
  }

  /** Advances fake time by `ms`, letting what that sets off run. */
  async function wait(ms: number) {
    await act(() => jest.advanceTimersByTimeAsync(ms))
  }

  /** Lets an interval pass, and the check it makes finish. */
  async function anInterval() {
    await wait(MINUTE + SECOND)
  }

  /** Reports the app's state changing to `state`, as `AppState` does. */
  function setAppState(state: AppStateStatus) {
    act(() => {
      AppState.currentState = state
      for (const listener of [...appStateListeners]) {
        listener(state)
      }
    })
  }

  /**
   * Leaves the app in the background for two minutes, then opens it again,
   * and lets the check that makes finish.
   */
  async function warmOpen() {
    setAppState('background')
    await wait(RETURN_STALE_AFTER)
    setAppState('active')
    await wait(SECOND)
  }

  beforeEach(() => {
    jest.useFakeTimers()
    AppState.currentState = 'active'
    newest = 12
    mockClient.call.mockImplementation(serve)
  })

  afterEach(() => {
    jest.useRealTimers()
    mockClient.call.mockImplementation(serveDefault)
  })

  describe('on an interval', () => {
    it('stages what is newer above the reader and lights the Home dot, with no pill', async () => {
      const {latest, cached, onHasNew} = renderHome()

      newest = 14
      await anInterval()

      expect(requested()).toEqual([PEEK, since(12)])
      expect(postsOf(cached())).toEqual([
        ['p14', 'p13'],
        ['p12', 'p11'],
        ['p10'],
      ])
      expect(onHasNew).toHaveBeenLastCalledWith(true)
      expect(latest.pill.visible).toBe(false)
    })

    it('replaces what it staged with what is newest, fetching from the same place, however often it checks', async () => {
      const {cached, onHasNew} = renderHome()
      newest = 14
      await anInterval()

      for (newest = 15; newest <= 20; newest++) {
        await anInterval()
      }

      expect(requested().filter(request => request !== PEEK)).toEqual(
        Array.from({length: 7}, () => since(12)),
      )
      expect(postsOf(cached())).toEqual([
        ['p20', 'p19', 'p18', 'p17', 'p16', 'p15', 'p14', 'p13'],
        ['p12', 'p11'],
        ['p10'],
      ])
      // It kept checking, with the dot lit.
      expect(onHasNew).toHaveBeenCalledTimes(7)
      expect(onHasNew).not.toHaveBeenCalledWith(false)
    })

    it('only peeks while the newest post is the one on top', async () => {
      const {cached} = renderHome()
      await anInterval()
      expect(requested()).toEqual([PEEK])

      newest = 14
      await anInterval()
      const staged = cached()
      await anInterval()

      expect(requested()).toEqual([PEEK, PEEK, since(12), PEEK])
      expect(cached()).toBe(staged)
    })

    it('stages at most a page of the newest posts, with a gap below them, and checks no more until the reader reaches them', async () => {
      const {cached, list} = renderHome()

      newest = 12 + 150
      await anInterval()
      expect(cached().pages).toHaveLength(3)
      expect(cached().pages[0].feed).toHaveLength(100)
      expect(postsOf(cached())[0][0]).toBe('p162')
      expect(gapBelow(cached().pages, 0)).toBe('open')
      const staged = cached()

      newest += 5
      await anInterval()
      await anInterval()

      expect(requested()).toEqual([PEEK, since(12)])
      expect(cached()).toBe(staged)

      // Reached, the posts above them go on top.
      list.beginDrag(400)
      list.see(100)
      list.endDrag(300)
      await anInterval()
      expect(requested()).toEqual([PEEK, since(12), PEEK, since(162)])
      expect(postsOf(cached())[0]).toEqual([
        'p167',
        'p166',
        'p165',
        'p164',
        'p163',
      ])
    })

    it('keeps what it staged, and checks no more, once a page no longer holds all that is newer', async () => {
      const {cached, list} = renderHome()
      newest = 14
      await anInterval()
      const staged = cached()

      /*
       * The newest page above where they were fetched from would leave out the
       * staged posts, and the list holds the reader's place only for posts
       * added above the others.
       */
      newest = 14 + 150
      await anInterval()
      expect(requested()).toEqual([PEEK, since(12), PEEK, since(12)])
      expect(cached()).toBe(staged)

      newest += 5
      await anInterval()
      expect(requested()).toHaveLength(4)

      // Reached, the newest posts go above them, with a gap below.
      list.beginDrag(400)
      list.see(13)
      list.endDrag(300)
      await anInterval()
      expect(requested()).toEqual([
        PEEK,
        since(12),
        PEEK,
        since(12),
        PEEK,
        since(14),
      ])
      expect(cached().pages).toHaveLength(4)
      expect(postsOf(cached())[0][0]).toBe('p169')
      expect(gapBelow(cached().pages, 0)).toBe('open')
    })

    it('makes no checks from a view that is not on screen, and leaves the Home dot alone', async () => {
      const {setActive, onHasNew} = renderHome({isActive: false})
      newest = 14
      await wait(10 * MINUTE)
      expect(requested()).toEqual([])

      // On screen, it checks at once, as its posts are a while old.
      setActive(true)
      await wait(SECOND)
      expect(requested()).toEqual([PEEK, since(12)])
      expect(onHasNew).toHaveBeenLastCalledWith(true)

      setActive(false)
      newest = 16
      await wait(10 * MINUTE)
      expect(requested()).toEqual([PEEK, since(12)])
      expect(onHasNew).toHaveBeenCalledTimes(1)
    })
  })

  describe('once the reader reaches what is staged', () => {
    it('fetches above it, when they see a staged post after a drag', async () => {
      const {cached, list} = renderHome()
      newest = 14
      await anInterval()

      list.beginDrag(400)
      list.see(13)
      list.endDrag(300)
      newest = 16
      await anInterval()

      expect(requested().filter(request => request !== PEEK)).toEqual([
        since(12),
        since(14),
      ])
      expect(postsOf(cached())).toEqual([
        ['p16', 'p15'],
        ['p14', 'p13'],
        ['p12', 'p11'],
        ['p10'],
      ])
    })

    it('fetches above it, when they see its gap row after a drag', async () => {
      const {cached, list} = renderHome()
      newest = 12 + 150
      await anInterval()

      list.beginDrag(400)
      list.seeGap()
      list.endDrag(300)
      newest += 2
      await anInterval()

      expect(requested().filter(request => request !== PEEK)).toEqual([
        since(12),
        since(162),
      ])
      expect(cached().pages).toHaveLength(4)
    })

    it('but not when they see it without a drag since, as behind the header', async () => {
      const {cached, list} = renderHome()
      newest = 14
      await anInterval()
      // A drag before the posts were staged doesn't count either.
      list.beginDrag(400)
      list.endDrag(400)
      newest = 15
      await anInterval()

      list.see(13)
      newest = 16
      await anInterval()

      expect(requested().filter(request => request !== PEEK)).toEqual([
        since(12),
        since(12),
        since(12),
      ])
      expect(cached().pages).toHaveLength(3)
    })

    it('drops a fetch it was holding to replace them', async () => {
      const {cached, list} = renderHome()
      newest = 14
      await anInterval()
      const staged = cached()

      // The reader is dragging as the next check finds more.
      list.beginDrag(400)
      newest = 16
      await anInterval()
      list.see(13)
      list.endDrag(300)
      await wait(LIST_REST_QUIET_MS)

      expect(cached()).toBe(staged)
      // The next check fetches above what they reached.
      await anInterval()
      expect(postsOf(cached())[0]).toEqual(['p16', 'p15'])
    })

    it('clears the Home dot once they come to rest at the true top', async () => {
      const {cached, list, onHasNew} = renderHome()
      newest = 14
      await anInterval()
      expect(onHasNew).toHaveBeenLastCalledWith(true)

      // Where the anchor kept the reader as the posts went above them.
      list.scroll(400)
      list.beginDrag(400)
      list.scroll(0)
      list.endDrag(0)
      await wait(SETTLE_QUIET_MS)

      expect(onHasNew).toHaveBeenLastCalledWith(false)
      // Reaching the top read the staged posts.
      newest = 16
      await anInterval()
      expect(postsOf(cached())[0]).toEqual(['p16', 'p15'])
    })
  })

  describe('on a warm open', () => {
    it('offers what is staged with the pill, counting exactly the posts above the reader', async () => {
      const {latest, cached, onHasNew} = renderHome()
      newest = 14
      await anInterval()
      expect(latest.pill.visible).toBe(false)

      newest = 17
      await warmOpen()

      expect(requested()).toEqual([PEEK, since(12), PEEK, since(12)])
      expect(postsOf(cached())[0]).toEqual(['p17', 'p16', 'p15', 'p14', 'p13'])
      expect(latest.pill).toMatchObject({visible: true, count: 5})
      expect(onHasNew).toHaveBeenLastCalledWith(true)
    })

    it('offers what is staged without fetching it again, when nothing is newer', async () => {
      const {latest} = renderHome()
      newest = 14
      await anInterval()

      await warmOpen()

      expect(requested()).toEqual([PEEK, since(12), PEEK])
      expect(latest.pill).toMatchObject({visible: true, count: 2})
    })

    it('offers what is staged when it cannot check', async () => {
      const {latest} = renderHome()
      newest = 14
      await anInterval()

      failNextRequest(new TypeError('Network request failed'))
      await warmOpen()

      expect(latest.pill).toMatchObject({visible: true, count: 2})
    })

    it('offers what is staged on a warm open, without checking, while it is full', async () => {
      const {latest} = renderHome()
      newest = 12 + 150
      await anInterval()

      newest += 5
      await warmOpen()

      expect(requested()).toEqual([PEEK, since(12)])
      expect(latest.pill).toMatchObject({visible: true, count: 100})
    })

    it('raises no pill with nothing staged', async () => {
      const {latest} = renderHome()

      await warmOpen()

      expect(requested()).toEqual([PEEK])
      expect(latest.pill.visible).toBe(false)
    })

    it('keeps the pill as later checks replace what it offers, with their posts', async () => {
      const {latest} = renderHome()
      newest = 14
      await warmOpen()
      expect(latest.pill).toMatchObject({visible: true, count: 2})

      newest = 15
      await anInterval()

      expect(latest.pill).toMatchObject({visible: true, count: 3})
    })

    it('hides the pill once the reader sees a staged post after a drag', async () => {
      const {latest, list} = renderHome()
      newest = 14
      await warmOpen()

      list.beginDrag(400)
      list.see(13)
      list.endDrag(300)

      expect(latest.pill.visible).toBe(false)
      expect(latest.staged).toBeUndefined()
    })
  })

  it('gives way to a pull to refresh in flight when it would commit', async () => {
    const {latest, cached, list} = renderHome()
    // The reader is dragging as a check finds more, so it holds what it found.
    list.beginDrag(400)
    newest = 14
    await anInterval()
    expect(requested()).toEqual([PEEK, since(12)])

    const top = holdNextRequest()
    let refreshing!: Promise<unknown>
    act(() => {
      refreshing = latest.refresh()
    })
    list.endDrag(400)
    await wait(LIST_REST_QUIET_MS)
    expect(postsOf(cached())).toEqual([['p12', 'p11'], ['p10']])

    await act(async () => {
      top.respondWith({cursor: 't:13', startCursor: 't:14', feed: [post(14)]})
      await refreshing
    })
    expect(postsOf(cached())).toEqual([['p14']])
    expect(latest.staged).toBeUndefined()
  })
})

describe('gaps', () => {
  const KEY = RQKEY('following')

  /**
   * A gapped page put above two restored pages, as a restore prepend leaves
   * them: its `since` is the old top's `startCursor`, and its cursor goes on
   * into the posts it didn't reach.
   */
  function gappedData(): PostFeedData {
    const fetchedAt = PROCESS_STARTED_AT - 60e3
    return {
      pages: [
        {
          cursor: 'gap:1',
          startCursor: 'start:0',
          since: 'start:1',
          feed: [feedItem('new')],
          fetchedAt: Date.now(),
        },
        {
          cursor: 'timeline:1',
          startCursor: 'start:1',
          feed: [feedItem('timeline-1')],
          fetchedAt,
        },
        {cursor: 'timeline:2', feed: [feedItem('timeline-2')], fetchedAt},
      ],
      pageParams: [undefined, {cursor: 'gap:1'}, {cursor: 'timeline:1'}],
    }
  }

  /** The posts that continue from the gapped page's cursor. */
  const CONTINUATION = {
    cursor: 'gap:2',
    startCursor: 'start:gap',
    feed: [feedItem('gap-1')],
  }

  function postsOf(data: PostFeedData) {
    return data.pages.map(page =>
      page.feed.map(item => item.post.uri.split('/').pop()),
    )
  }

  describe('gapBelow', () => {
    it('is open below a gapped page while the page its since came from is below it', () => {
      const {pages} = gappedData()
      expect(pages.map((_, i) => gapBelow(pages, i))).toEqual([
        'open',
        undefined,
        undefined,
      ])
    })

    it('is filled once the page below continues from its cursor', () => {
      const {pages} = gappedData()
      expect(
        gapBelow([pages[0], {...CONTINUATION, fetchedAt: Date.now()}], 0),
      ).toBe('filled')
    })

    it('is nothing below an exhausted page', () => {
      const {pages} = gappedData()
      pages[0].cursor = pages[0].since
      expect(gapBelow(pages, 0)).toBeUndefined()
    })

    it('is nothing below the bottom page', () => {
      expect(gapBelow(gappedData().pages.slice(0, 1), 0)).toBeUndefined()
    })
  })

  describe('findGaps', () => {
    /** Gapped pages stacked on each other, with `slices` rows each. */
    function stackedGaps(slices: number[]) {
      return slices.map((count, i) => ({
        cursor: `gap:${i}`,
        startCursor: `start:${i}`,
        since: `start:${i + 1}`,
        slices: Array.from<FeedPostSlice>({length: count}),
      }))
    }

    it('collapses an open gap with no posts between it and the open gap above', () => {
      expect([...findGaps(stackedGaps([1, 0, 1]))]).toEqual([[0, 'open']])
    })

    it('keeps open gaps with posts between them apart', () => {
      expect([...findGaps(stackedGaps([1, 1, 1]))]).toEqual([
        [0, 'open'],
        [1, 'open'],
      ])
    })
  })

  /** The feed's view, as PostFeed has it, over `data` already in the cache. */
  function renderView(
    data = gappedData(),
    {enabled = true}: {enabled?: boolean} = {},
  ) {
    const queryClient = createQueryClient()
    queryClient.setQueryData(KEY, data)
    const wrapper = ({children}: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const hook = renderHook(
      () => ({
        query: usePostFeedQuery('following'),
        refresh: usePostFeedRefresh('following').refresh,
        fillGap: usePostFeedGapFill('following'),
        settle: usePostFeedSettle('following'),
        settleAtTop: useSettleAtTop('following', undefined, {enabled}),
      }),
      {wrapper},
    )
    const cached = () => queryClient.getQueryData<PostFeedData>(KEY)!
    return {hook, queryClient, cached}
  }

  it('fetches the posts in the gap, then puts them in place of the pages below it in one write', async () => {
    const {hook, queryClient, cached} = renderView()
    const writes = watchWrites(queryClient)
    mockClient.call.mockReturnValueOnce(CONTINUATION)

    let outcome: unknown
    await act(async () => {
      outcome = await hook.result.current.fillGap('gap:1')
    })

    expect(outcome).toBe('filled')
    expect(requested()).toEqual(['timeline gap:1'])
    expect(writes).toHaveLength(1)
    expect(postsOf(cached())).toEqual([['new'], ['gap-1']])
    expect(cached().pageParams).toEqual([undefined, {cursor: 'gap:1'}])
    expect(gapBelow(cached().pages, 0)).toBe('filled')
    // The selected pages say so too, as the rows are built from them.
    await waitFor(() =>
      expect([...findGaps(hook.result.current.query.data!.pages)]).toEqual([
        [0, 'filled'],
      ]),
    )

    // Load more carries on from the new page.
    mockClient.call.mockClear()
    await act(() => hook.result.current.query.fetchNextPage())
    expect(requested()).toEqual(['timeline gap:2'])
  })

  it('keeps the pages below and the gap when it fails, and logs only unexpected errors', async () => {
    const logError = jest.spyOn(logger, 'error').mockImplementation(() => {})
    try {
      const {hook, cached} = renderView()
      const before = cached()

      failNextRequest(new TypeError('Network request failed'))
      await act(async () => {
        await expect(hook.result.current.fillGap('gap:1')).resolves.toBe(
          'failed',
        )
      })
      expect(cached()).toBe(before)
      expect(gapBelow(cached().pages, 0)).toBe('open')
      expect(logError).not.toHaveBeenCalled()

      failNextRequest(new Error('Unexpected'))
      await act(() => hook.result.current.fillGap('gap:1'))
      expect(cached()).toBe(before)
      expect(logError).toHaveBeenCalledTimes(1)
    } finally {
      logError.mockRestore()
    }
  })

  it('gives way to a refresh that replaces the top meanwhile', async () => {
    const {hook, cached} = renderView()
    const fill = holdNextRequest()
    let filling!: Promise<unknown>
    act(() => {
      filling = hook.result.current.fillGap('gap:1')
    })
    mockClient.call.mockReturnValueOnce({
      cursor: 'timeline:1',
      feed: [feedItem('fresh')],
    })
    await act(() => hook.result.current.refresh())
    const refreshed = cached()

    await act(async () => {
      fill.respondWith(CONTINUATION)
      await expect(filling).resolves.toBe('superseded')
    })

    expect(cached()).toBe(refreshed)
  })

  it('gives way when the page above the gap is replaced meanwhile, below the top', async () => {
    const data = gappedData()
    // An exhausted page on top, sitting on the gapped one.
    data.pages.unshift({
      cursor: 'start:0',
      startCursor: 'start:newest',
      since: 'start:0',
      feed: [feedItem('newest')],
      fetchedAt: Date.now(),
    })
    data.pageParams = [
      undefined,
      {cursor: 'start:0'},
      ...data.pageParams.slice(1),
    ]
    const {hook, queryClient, cached} = renderView(data)
    const fill = holdNextRequest()
    let filling!: Promise<unknown>
    act(() => {
      filling = hook.result.current.fillGap('gap:1')
    })
    act(() => {
      queryClient.setQueryData<PostFeedData>(KEY, current => ({
        ...current!,
        pages: current!.pages.map((page, i) => (i === 1 ? {...page} : page)),
      }))
    })
    const replaced = cached()

    await act(async () => {
      fill.respondWith(CONTINUATION)
      await expect(filling).resolves.toBe('superseded')
    })

    expect(cached()).toBe(replaced)
  })

  it('does nothing once the gap has gone', async () => {
    const {hook, cached} = renderView()
    await act(() => hook.result.current.refresh())
    const refreshed = cached()
    mockClient.call.mockClear()

    await act(async () => {
      await expect(hook.result.current.fillGap('gap:1')).resolves.toBe(
        'superseded',
      )
    })

    expect(requested()).toEqual([])
    expect(cached()).toBe(refreshed)
  })

  it('cancels a page load still in flight below the gap, and drops its page', async () => {
    const {hook, queryClient, cached} = renderView()
    const fill = holdNextRequest()
    let filling!: Promise<unknown>
    act(() => {
      filling = hook.result.current.fillGap('gap:1')
    })
    const next = holdNextRequest()
    let loading!: Promise<unknown>
    act(() => {
      loading = hook.result.current.query.fetchNextPage()
    })
    const writes = watchWrites(queryClient)

    await act(async () => {
      fill.respondWith(CONTINUATION)
      await expect(filling).resolves.toBe('filled')
    })
    await act(async () => {
      next.respond('late')
      await loading
    })

    expect(writes).toHaveLength(1)
    expect(postsOf(cached())).toEqual([['new'], ['gap-1']])
    expect(hook.result.current.query.isFetchingNextPage).toBe(false)
  })

  describe('settling at the true top', () => {
    /** An exhausted page on top of `gappedData`, which sits on its gapped page. */
    function exhaustedAboveGap(): PostFeedData {
      const data = gappedData()
      return {
        pages: [
          {
            cursor: 'start:0',
            startCursor: 'start:newest',
            since: 'start:0',
            feed: [feedItem('newest')],
            fetchedAt: Date.now(),
          },
          ...data.pages,
        ],
        pageParams: [
          undefined,
          {cursor: 'start:0'},
          ...data.pageParams.slice(1),
        ],
      }
    }

    afterEach(() => {
      jest.useRealTimers()
    })

    it('cuts the feed at its first open gap, and pagination goes on into the gap', async () => {
      const {hook, queryClient, cached} = renderView()
      const writes = watchWrites(queryClient)

      await act(async () => {
        await expect(hook.result.current.settle(cached())).resolves.toBe(true)
      })

      expect(writes).toHaveLength(1)
      expect(postsOf(cached())).toEqual([['new']])
      expect(cached().pageParams).toEqual([undefined])
      await act(() => hook.result.current.query.fetchNextPage())
      expect(requested()).toEqual(['timeline gap:1'])
    })

    it('keeps the pages above the gap', async () => {
      const {hook, cached} = renderView(exhaustedAboveGap())

      await act(() => hook.result.current.settle(cached()))

      expect(postsOf(cached())).toEqual([['newest'], ['new']])
      expect(cached().pageParams).toEqual([undefined, {cursor: 'start:0'}])
    })

    it('writes nothing without an open gap, as the second time', async () => {
      const {hook, queryClient, cached} = renderView()
      await act(() => hook.result.current.settle(cached()))
      const writes = watchWrites(queryClient)

      await act(async () => {
        await expect(hook.result.current.settle(cached())).resolves.toBe(false)
      })

      expect(writes).toHaveLength(0)
    })

    it('writes nothing once the gap is filled', async () => {
      const {hook, queryClient, cached} = renderView()
      mockClient.call.mockReturnValueOnce(CONTINUATION)
      await act(() => hook.result.current.fillGap('gap:1'))
      const writes = watchWrites(queryClient)

      await act(async () => {
        await expect(hook.result.current.settle(cached())).resolves.toBe(false)
      })

      expect(writes).toHaveLength(0)
      expect(postsOf(cached())).toEqual([['new'], ['gap-1']])
    })

    it('gives way to a refresh that has replaced the top since the reader came to rest', async () => {
      const {hook, cached} = renderView()
      const before = cached()
      mockClient.call.mockReturnValueOnce({
        cursor: 'timeline:1',
        feed: [feedItem('fresh')],
      })
      await act(() => hook.result.current.refresh())
      const refreshed = cached()

      await act(async () => {
        await expect(hook.result.current.settle(before)).resolves.toBe(false)
      })

      expect(cached()).toBe(refreshed)
    })

    it('gives way to a fill that has landed since the reader came to rest', async () => {
      const {hook, cached} = renderView()
      const before = cached()
      mockClient.call.mockReturnValueOnce(CONTINUATION)
      await act(() => hook.result.current.fillGap('gap:1'))
      const filled = cached()

      await act(async () => {
        await expect(hook.result.current.settle(before)).resolves.toBe(false)
      })

      expect(cached()).toBe(filled)
    })

    it('leaves a refresh in flight to write after it', async () => {
      const {hook, cached} = renderView()
      const top = holdNextRequest()
      let refreshing!: Promise<unknown>
      act(() => {
        refreshing = hook.result.current.refresh()
      })

      await act(() => hook.result.current.settle(cached()))
      expect(postsOf(cached())).toEqual([['new']])

      await act(async () => {
        top.respond('fresh')
        await refreshing
      })
      expect(postsOf(cached())).toEqual([['fresh']])
    })

    it('cancels a page load still in flight, and drops its page', async () => {
      const {hook, cached} = renderView()
      const next = holdNextRequest()
      let loading!: Promise<unknown>
      act(() => {
        loading = hook.result.current.query.fetchNextPage()
      })

      await act(() => hook.result.current.settle(cached()))
      await act(async () => {
        next.respond('late')
        await loading
      })

      expect(postsOf(cached())).toEqual([['new']])
      expect(hook.result.current.query.isFetchingNextPage).toBe(false)
    })

    it('leaves a valid snapshot', async () => {
      const {hook, cached} = renderView(exhaustedAboveGap())
      await act(() => hook.result.current.settle(cached()))

      const snapshot = selectFollowingSnapshot(cached())

      expect(snapshot?.pages.map(page => page.cursor)).toEqual([
        'start:0',
        'gap:1',
      ])
      expect(readFollowingSnapshot(roundTrip(snapshot))).toEqual(cached())
    })

    it('brings a post the dropped pages held back into the pages kept', async () => {
      const data = gappedData()
      data.pages[0].feed.push(feedItem('timeline-1'))
      const {hook, cached} = renderView(data)
      const slicesOfTop = () =>
        hook.result.current.query.data!.pages[0].slices.map(slice =>
          slice.feedPostUri.split('/').pop(),
        )
      await waitFor(() => expect(slicesOfTop()).toEqual(['new']))

      await act(() => hook.result.current.settle(cached()))

      /*
       * Tuned without the pages below it, the top page keeps its copy of a
       * post they had: a row can come back above or inside the viewport.
       */
      await waitFor(() => expect(slicesOfTop()).toEqual(['new', 'timeline-1']))
    })

    describe('when the reader comes to rest at the top', () => {
      async function wait(ms: number) {
        act(() => {
          jest.advanceTimersByTime(ms)
        })
        // Lets the settle's write go through.
        await act(() => Promise.resolve())
      }

      it('settles once the list has stayed there, after a drag that leaves it still', async () => {
        jest.useFakeTimers()
        const {hook, cached} = renderView()
        const {settleAtTop} = hook.result.current

        act(() => {
          settleAtTop.onBeginDrag()
          settleAtTop.onEndDrag(0, 0)
        })
        await wait(SETTLE_QUIET_MS - 1)
        expect(postsOf(cached())).toHaveLength(3)

        await wait(1)
        expect(postsOf(cached())).toEqual([['new']])
      })

      it('settles at the end of the momentum after a fling', async () => {
        jest.useFakeTimers()
        const {hook, cached} = renderView()
        const {settleAtTop} = hook.result.current

        act(() => {
          settleAtTop.onBeginDrag()
          settleAtTop.onEndDrag(600, -3)
        })
        await wait(SETTLE_QUIET_MS)
        expect(postsOf(cached())).toHaveLength(3)

        act(() => settleAtTop.onMomentumEnd(-40))
        await wait(SETTLE_QUIET_MS)
        expect(postsOf(cached())).toEqual([['new']])
      })

      it('never where the list was first put', async () => {
        jest.useFakeTimers()
        const {cached} = renderView()

        await wait(SETTLE_QUIET_MS * 4)

        expect(postsOf(cached())).toHaveLength(3)
      })

      it('not at rest below the top', async () => {
        jest.useFakeTimers()
        const {hook, cached} = renderView()

        act(() => hook.result.current.settleAtTop.onEndDrag(400, 0))
        await wait(SETTLE_QUIET_MS)

        expect(postsOf(cached())).toHaveLength(3)
      })

      it('not once another drag starts, or the list leaves the top', async () => {
        jest.useFakeTimers()
        const {hook, cached} = renderView()
        const {settleAtTop} = hook.result.current

        act(() => {
          settleAtTop.onEndDrag(0, 0)
          settleAtTop.onBeginDrag()
        })
        await wait(SETTLE_QUIET_MS)
        act(() => {
          settleAtTop.onEndDrag(0, 0)
          settleAtTop.onLeaveTop()
        })
        await wait(SETTLE_QUIET_MS)

        expect(postsOf(cached())).toHaveLength(3)
      })

      it('not on the correction a prepend makes, before or after it lands', async () => {
        jest.useFakeTimers()
        const gapped = gappedData()
        const restored = {
          pages: gapped.pages.slice(1),
          pageParams: [undefined, {cursor: 'timeline:1'}],
        }
        const {hook, queryClient, cached} = renderView(restored)
        const {settleAtTop} = hook.result.current
        /** Puts the gapped page above the restored top, as the prepend does. */
        const prepend = () =>
          act(() => {
            queryClient.setQueryData<PostFeedData>(KEY, data => ({
              pages: [gapped.pages[0], ...data!.pages],
              pageParams: [
                undefined,
                {cursor: 'gap:1'},
                ...data!.pageParams.slice(1),
              ],
            }))
          })

        // At rest at the restored top, then the prepend lands while it waits.
        act(() => settleAtTop.onEndDrag(0, 0))
        prepend()
        await wait(SETTLE_QUIET_MS)
        expect(postsOf(cached())).toHaveLength(3)

        // A rest reported from before the correction, then the correction.
        act(() => {
          settleAtTop.onMomentumEnd(0)
          settleAtTop.onLeaveTop()
        })
        await wait(SETTLE_QUIET_MS)
        expect(postsOf(cached())).toHaveLength(3)
      })

      it('not once the view has unmounted', async () => {
        jest.useFakeTimers()
        const {hook, cached} = renderView()

        act(() => hook.result.current.settleAtTop.onEndDrag(0, 0))
        hook.unmount()
        await wait(SETTLE_QUIET_MS)

        expect(postsOf(cached())).toHaveLength(3)
      })

      it('not while disabled', async () => {
        jest.useFakeTimers()
        const {hook, cached} = renderView(undefined, {enabled: false})

        act(() => hook.result.current.settleAtTop.onEndDrag(0, 0))
        await wait(SETTLE_QUIET_MS)

        expect(postsOf(cached())).toHaveLength(3)
      })
    })
  })
})

describe('a cold start', () => {
  /**
   * A new client, hydrated as the persister would from a client holding the
   * Following query's `data`. `tamper` changes what's on disk.
   */
  async function coldStart(
    data: PostFeedData,
    {
      invalidate = false,
      tamper = snapshot => snapshot,
    }: {
      invalidate?: boolean
      tamper?: (snapshot: FollowingSnapshot) => unknown
    } = {},
  ) {
    const before = createQueryClient()
    before.setQueryData(RQKEY('following'), data)
    if (invalidate) {
      await before.invalidateQueries({queryKey: RQKEY('following')})
    }
    const saved: PersistedClient = JSON.parse(
      JSON.stringify(
        saveFollowingSnapshot({
          timestamp: Date.now(),
          buster: '',
          clientState: dehydrate(before, {
            shouldDehydrateQuery: isFollowingSnapshotQuery,
          }),
        }),
      ),
    )
    for (const query of saved.clientState.queries) {
      query.state.data = tamper(query.state.data as FollowingSnapshot)
    }
    const queryClient = createQueryClient()
    hydrate(queryClient, loadFollowingSnapshot(saved).clientState)
    mockClient.call.mockClear()
    return queryClient
  }

  function snapshotData(): PostFeedData {
    return {
      pages: [
        {
          cursor: 'timeline:1',
          startCursor: 'start:1',
          feed: [feedItem('timeline-1')],
          fetchedAt: PROCESS_STARTED_AT - 60e3,
        },
      ],
      pageParams: [undefined],
    }
  }

  it('shows a valid Following snapshot without fetching', async () => {
    const queryClient = await coldStart(snapshotData())

    const {hook} = await renderFeed('following', {queryClient})
    await flushNotifications()

    expect(requested()).toEqual([])
    expect(hook.result.current.query.isFetching).toBe(false)
    expect(
      hook.result.current.query.data?.pages[0].slices.map(
        slice => slice.feedPostUri,
      ),
    ).toEqual([feedItem('timeline-1').post.uri])
  })

  it.each([
    [
      'from another version',
      {
        tamper: (snapshot: FollowingSnapshot) => ({
          ...snapshot,
          version: FOLLOWING_SNAPSHOT_VERSION + 1,
        }),
      },
    ],
    ['saved while invalidated', {invalidate: true}],
  ])('loads Following afresh for a snapshot %s', async (_, options) => {
    const queryClient = await coldStart(snapshotData(), options)
    expect(queryClient.getQueryData(RQKEY('following'))).toBeUndefined()

    await renderFeed('following', {queryClient})

    expect(requested()).toEqual(['timeline undefined'])
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
