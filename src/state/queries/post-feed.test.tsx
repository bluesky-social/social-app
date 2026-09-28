import {type PropsWithChildren} from 'react'
import {AppState} from 'react-native'
import {
  hashKey,
  type InfiniteData,
  notifyManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import {act, renderHook, waitFor} from '@testing-library/react-native'

import {FollowingFeedAPI} from '#/lib/api/feed/following'
import {type FeedAPIResponse} from '#/lib/api/feed/types'
import {logger} from '#/logger'
import {DEFAULT_LOGGED_OUT_PREFERENCES} from '#/state/queries/preferences/const'
import {type app} from '#/lexicons'
import {
  type FeedPageUnselected,
  pollLatest,
  resetPostsFeedQueries,
  RQKEY,
  summarizeNewContentAbove,
  useFollowingRestorePrepend,
  usePostFeedQuery,
  usePostFeedRefresh,
} from './post-feed'
import {
  beginPostFeedRestorePrepend,
  getPostFeedRestore,
  isPostFeedRefreshing,
  isPostFeedRestorePending,
  peekPostFeedQueryEntry,
  recordPostFeedRestore,
} from './post-feed-registry'
import {FOLLOWING_SNAPSHOT_QUERY_KEY} from './post-feed-snapshot'

jest.mock('#/lib/api/feed/following', () => ({
  FollowingFeedAPI: jest.fn(),
}))
// Keeps the real feed APIs' analytics imports out of the test.
jest.mock('#/state/preferences/languages', () => ({}))
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
  useAppviewClient: () => ({}),
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
const mockModerationOpts = {
  userDid: 'did:plc:viewer',
  prefs: DEFAULT_LOGGED_OUT_PREFERENCES.moderationPrefs,
  labelDefs: {},
}
const mockPreferences = {savedFeeds: [], interests: {tags: []}}

const FEED = 'following'
const KEY = RQKEY(FEED)

type MockFeedApi = {
  fetch: jest.Mock<
    Promise<FeedAPIResponse>,
    [{cursor: string | undefined; since?: string; limit: number}]
  >
  peekLatest: jest.Mock
}

let apis: MockFeedApi[] = []

/** Cursors encode `<instance>:<page>` to expose API ownership mistakes. */
function createApi({
  top,
  since: fetchSince,
}: {
  top?: () => Promise<FeedAPIResponse>
  since?: (since: string) => Promise<FeedAPIResponse>
} = {}) {
  const id = apis.length
  const api: MockFeedApi = {
    fetch: jest.fn(({cursor, since}) => {
      if (since !== undefined && fetchSince) {
        return fetchSince(since)
      }
      if (!cursor && top) {
        return top()
      }
      const page = cursor ? Number(cursor.split(':')[1]) + 1 : 1
      return Promise.resolve({
        cursor: `${id}:${page}`,
        feed: [feedItem(`${id}-${page}`)],
      })
    }),
    peekLatest: jest.fn().mockResolvedValue(undefined),
  }
  apis.push(api)
  return api
}

function cursorsFetchedBy(api: MockFeedApi) {
  return api.fetch.mock.calls.map(([{cursor}]) => cursor)
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

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return {promise, resolve, reject}
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {queries: {gcTime: Infinity, retry: false}},
  })
}

function renderFeed(queryClient = createQueryClient()) {
  const wrapper = ({children}: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const hook = renderHook(() => usePostFeedQuery(FEED), {wrapper})
  return {hook, queryClient}
}

async function renderLoadedFeed(queryClient?: QueryClient) {
  const rendered = renderFeed(queryClient)
  await waitFor(() => expect(rendered.hook.result.current.isSuccess).toBe(true))
  return rendered
}

function cachedData(queryClient: QueryClient) {
  return queryClient.getQueryData<InfiniteData<FeedPageUnselected>>(KEY)!
}

beforeAll(() => {
  notifyManager.setNotifyFunction(callback => {
    act(callback)
  })
})

beforeEach(() => {
  jest.clearAllMocks()
  apis = []
  jest.mocked(FollowingFeedAPI).mockImplementation(() => createApi() as never)
})

describe('usePostFeedQuery FeedAPI ownership', () => {
  it('reuses an API for pagination and starts a fresh chain on refetch', async () => {
    const {hook, queryClient} = await renderLoadedFeed()
    await act(() => hook.result.current.fetchNextPage())

    expect(apis).toHaveLength(1)
    expect(cursorsFetchedBy(apis[0])).toEqual([undefined, '0:1'])
    expect(cachedData(queryClient).pageParams).toEqual([
      undefined,
      {cursor: '0:1'},
    ])

    await act(() => hook.result.current.refetch())
    expect(apis).toHaveLength(2)
    expect(cursorsFetchedBy(apis[1])).toEqual([undefined, '1:1'])

    await act(() => hook.result.current.fetchNextPage())
    expect(cursorsFetchedBy(apis[1])).toEqual([undefined, '1:1', '1:2'])
    expect(cursorsFetchedBy(apis[0])).toEqual([undefined, '0:1'])
  })

  it('keeps a refetch that fetchNextPage cancelled on its own API', async () => {
    const {hook, queryClient} = await renderLoadedFeed()
    await act(() => hook.result.current.fetchNextPage())
    const top = deferred<FeedAPIResponse>()
    jest
      .mocked(FollowingFeedAPI)
      .mockImplementationOnce(
        () => createApi({top: () => top.promise}) as never,
      )

    let refetch: Promise<unknown>
    act(() => {
      refetch = hook.result.current.refetch()
    })
    await waitFor(() => expect(apis).toHaveLength(2))
    // Cancels the refetch, which carries on in the background.
    await act(() => hook.result.current.fetchNextPage())
    await act(async () => {
      top.resolve({cursor: '1:1', feed: [feedItem('1-1')]})
      await refetch
    })
    await waitFor(() =>
      expect(cursorsFetchedBy(apis[1])).toEqual([undefined, '1:1']),
    )
    await act(() => hook.result.current.fetchNextPage())

    expect(cursorsFetchedBy(apis[0])).toEqual([undefined, '0:1', '0:2', '0:3'])
    expect(cachedData(queryClient).pageParams).toEqual([
      undefined,
      {cursor: '0:1'},
      {cursor: '0:2'},
      {cursor: '0:3'},
    ])
  })

  it('replays a refetch that cancelled fetchNextPage with its own API', async () => {
    const {hook, queryClient} = await renderLoadedFeed()
    await act(() => hook.result.current.fetchNextPage())
    const next = deferred<FeedAPIResponse>()
    apis[0].fetch.mockImplementationOnce(() => next.promise)

    let fetchNextPage: Promise<unknown>
    act(() => {
      fetchNextPage = hook.result.current.fetchNextPage()
    })
    await waitFor(() => expect(apis[0].fetch).toHaveBeenCalledTimes(3))
    await act(() => hook.result.current.refetch())
    await act(async () => {
      next.resolve({cursor: '0:3', feed: [feedItem('0-3')]})
      await fetchNextPage
    })
    await act(() => hook.result.current.fetchNextPage())

    expect(cursorsFetchedBy(apis[0])).toEqual([undefined, '0:1', '0:2'])
    expect(cursorsFetchedBy(apis[1])).toEqual([undefined, '1:1', '1:2'])
    expect(cachedData(queryClient).pageParams).toEqual([
      undefined,
      {cursor: '1:1'},
      {cursor: '1:2'},
    ])
  })

  it('keeps polling and paginating the cached chain after a failed refetch', async () => {
    const appState = AppState.currentState
    AppState.currentState = 'active'
    try {
      const {hook, queryClient} = await renderLoadedFeed()
      const poll = () =>
        pollLatest(queryClient, KEY, hook.result.current.data?.pages[0])

      await poll()
      expect(apis[0].peekLatest).toHaveBeenCalledTimes(1)

      jest.mocked(FollowingFeedAPI).mockImplementationOnce(
        () =>
          createApi({
            top: () => Promise.reject(new Error('offline')),
          }) as never,
      )
      await act(() => hook.result.current.refetch())
      await waitFor(() => expect(hook.result.current.isError).toBe(true))
      await poll()
      expect(apis[0].peekLatest).toHaveBeenCalledTimes(2)
      expect(apis[1].peekLatest).not.toHaveBeenCalled()

      await act(() => hook.result.current.fetchNextPage())
      expect(cursorsFetchedBy(apis[0])).toEqual([undefined, '0:1'])
      expect(cursorsFetchedBy(apis[1])).toEqual([undefined])

      await act(() => hook.result.current.refetch())
      await poll()
      expect(apis[2].peekLatest).toHaveBeenCalledTimes(1)
      expect(apis[0].peekLatest).toHaveBeenCalledTimes(2)

      hook.unmount()
      queryClient.removeQueries({queryKey: KEY})
      expect(await poll()).toBe(false)
      expect(apis[2].peekLatest).toHaveBeenCalledTimes(1)
    } finally {
      AppState.currentState = appState
    }
  })
})

describe('post-feed registry lifecycle', () => {
  it('disposes removed queries even when a fetch outlives them', async () => {
    const {hook, queryClient} = await renderLoadedFeed()
    await act(() => hook.result.current.fetchNextPage())
    const top = deferred<FeedAPIResponse>()
    jest
      .mocked(FollowingFeedAPI)
      .mockImplementationOnce(
        () => createApi({top: () => top.promise}) as never,
      )

    let refetch: Promise<unknown>
    act(() => {
      refetch = hook.result.current.refetch()
    })
    await waitFor(() => expect(apis).toHaveLength(2))
    expect(peekPostFeedQueryEntry(queryClient, KEY)).toBeDefined()
    hook.unmount()
    queryClient.removeQueries({queryKey: KEY})
    expect(peekPostFeedQueryEntry(queryClient, KEY)).toBeUndefined()
    await act(async () => {
      top.resolve({cursor: '1:1', feed: []})
      await refetch
    })
    // Wait for the cancelled refetch to continue past query removal.
    await waitFor(() => expect(apis).toHaveLength(3))
    expect(cursorsFetchedBy(apis[1])).toEqual([undefined])
    expect(cursorsFetchedBy(apis[2])).toEqual(['1:1'])
    expect(peekPostFeedQueryEntry(queryClient, KEY)).toBeUndefined()
    expect(queryClient.getQueryData(KEY)).toBeUndefined()
  })

  it('keeps the APIs of each QueryClient separate', async () => {
    const first = await renderLoadedFeed()
    const second = await renderLoadedFeed()

    expect(apis).toHaveLength(2)
    expect(peekPostFeedQueryEntry(first.queryClient, KEY)).not.toBe(
      peekPostFeedQueryEntry(second.queryClient, KEY),
    )

    await act(() => second.hook.result.current.fetchNextPage())
    first.hook.unmount()
    first.queryClient.removeQueries({queryKey: KEY})
    await act(() => second.hook.result.current.fetchNextPage())

    expect(cursorsFetchedBy(apis[0])).toEqual([undefined])
    expect(cursorsFetchedBy(apis[1])).toEqual([undefined, '1:1', '1:2'])
    expect(peekPostFeedQueryEntry(second.queryClient, KEY)).toBeDefined()
  })
})

describe('post-feed query data', () => {
  // Uses JSON fixtures; lex CID/byte encoding belongs to the persister.
  it('round-trips through JSON and continues restored pages with a fresh API', async () => {
    const {hook, queryClient} = await renderLoadedFeed()
    await act(() => hook.result.current.fetchNextPage())
    const data = cachedData(queryClient)

    const restored = JSON.parse(JSON.stringify(data))

    expect(restored).toEqual({
      pages: data.pages,
      pageParams: [null, {cursor: '0:1'}],
    })
    hook.unmount()

    const restoredClient = createQueryClient()
    restoredClient.setQueryData(KEY, restored)
    const {hook: restoredHook} = await renderLoadedFeed(restoredClient)
    await act(() => restoredHook.result.current.fetchNextPage())

    expect(apis).toHaveLength(2)
    expect(cursorsFetchedBy(apis[1])).toEqual(['0:2'])
  })
})

describe('usePostFeedRefresh', () => {
  function renderRefreshableFeed() {
    const queryClient = createQueryClient()
    const wrapper = ({children}: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    /**
     * The data of every render, to count the commits a refresh causes. Reads
     * `isFetching` as a feed does, so that a change to it alone renders too.
     */
    const renderedData: unknown[] = []
    const hook = renderHook(
      () => {
        const query = usePostFeedQuery(FEED)
        void query.isFetching
        renderedData.push(query.data)
        const refreshState = usePostFeedRefresh(FEED)
        return {query, refresh: refreshState.refresh, refreshState}
      },
      {wrapper},
    )
    return {hook, queryClient, renderedData}
  }

  async function renderLoadedRefreshableFeed() {
    const rendered = renderRefreshableFeed()
    await waitFor(() =>
      expect(rendered.hook.result.current.query.isSuccess).toBe(true),
    )
    return rendered
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

  /** Lets TanStack deliver the notifications it has scheduled. */
  function flushNotifications() {
    return act(() => new Promise<void>(resolve => setTimeout(resolve, 0)))
  }

  /** Makes the next API created answer its fetch from the top with `top`. */
  function nextApiTop(top: () => Promise<FeedAPIResponse>) {
    jest
      .mocked(FollowingFeedAPI)
      .mockImplementationOnce(() => createApi({top}) as never)
  }

  it('writes the new top page once, and paginates it with its own API', async () => {
    const {hook, queryClient, renderedData} =
      await renderLoadedRefreshableFeed()
    await act(() => hook.result.current.query.fetchNextPage())
    const writes = watchWrites(queryClient)
    const rendersBefore = renderedData.length

    let page: FeedPageUnselected | undefined
    await act(async () => {
      page = await hook.result.current.refresh()
    })
    await flushNotifications()

    expect(writes).toHaveLength(1)
    expect(cachedData(queryClient)).toEqual({
      pages: [page],
      pageParams: [undefined],
    })
    expect(renderedData.slice(rendersBefore)).toHaveLength(1)
    expect(cursorsFetchedBy(apis[1])).toEqual([undefined])

    await act(() => hook.result.current.query.fetchNextPage())
    expect(cursorsFetchedBy(apis[1])).toEqual([undefined, '1:1'])
    expect(cursorsFetchedBy(apis[0])).toEqual([undefined, '0:1'])
  })

  it('keeps the pages and their API when the refresh fails', async () => {
    const {hook, queryClient} = await renderLoadedRefreshableFeed()
    const data = cachedData(queryClient)
    const writes = watchWrites(queryClient)
    nextApiTop(() => Promise.reject(new Error('offline')))

    await act(async () => {
      expect(await hook.result.current.refresh()).toBeUndefined()
    })

    expect(hook.result.current.refreshState.error?.message).toBe('offline')
    expect(writes).toHaveLength(0)
    expect(cachedData(queryClient)).toBe(data)
    expect(hook.result.current.query.isError).toBe(false)
    await act(() => hook.result.current.query.fetchNextPage())
    expect(cursorsFetchedBy(apis[0])).toEqual([undefined, '0:1'])
  })

  it('lets only the latest of overlapping refreshes write, and settles them all with it', async () => {
    const {hook, queryClient} = await renderLoadedRefreshableFeed()
    const writes = watchWrites(queryClient)
    const first = deferred<FeedAPIResponse>()
    const second = deferred<FeedAPIResponse>()
    nextApiTop(() => first.promise)
    nextApiTop(() => second.promise)

    let firstRefresh!: Promise<FeedPageUnselected | undefined>
    let secondRefresh!: Promise<FeedPageUnselected | undefined>
    act(() => {
      firstRefresh = hook.result.current.refresh()
      secondRefresh = hook.result.current.refresh()
    })
    await waitFor(() => expect(apis).toHaveLength(3))

    // The overtaken refresh finishing first writes nothing.
    first.resolve({cursor: '1:1', feed: [feedItem('1-1')]})
    await flushNotifications()
    expect(writes).toHaveLength(0)

    await act(async () => {
      second.resolve({cursor: '2:1', feed: [feedItem('2-1')]})
      await secondRefresh
    })
    const written = await secondRefresh
    expect(await firstRefresh).toBe(written)
    expect(writes).toHaveLength(1)
    expect(cachedData(queryClient).pages).toEqual([written])

    await act(() => hook.result.current.query.fetchNextPage())
    expect(cursorsFetchedBy(apis[2])).toEqual([undefined, '2:1'])
    expect(cursorsFetchedBy(apis[1])).toEqual([undefined])
  })

  it('writes nothing when the latest of overlapping refreshes fails', async () => {
    const {hook, queryClient} = await renderLoadedRefreshableFeed()
    const data = cachedData(queryClient)
    const writes = watchWrites(queryClient)
    const second = deferred<FeedAPIResponse>()
    nextApiTop(() => Promise.resolve({cursor: '1:1', feed: [feedItem('1-1')]}))
    nextApiTop(() => second.promise)

    let firstRefresh!: Promise<FeedPageUnselected | undefined>
    let secondRefresh!: Promise<FeedPageUnselected | undefined>
    act(() => {
      firstRefresh = hook.result.current.refresh()
      secondRefresh = hook.result.current.refresh()
    })
    await waitFor(() => expect(apis).toHaveLength(3))
    await act(async () => {
      second.reject(new Error('offline'))
      await Promise.allSettled([firstRefresh, secondRefresh])
    })

    expect(await firstRefresh).toBeUndefined()
    expect(await secondRefresh).toBeUndefined()
    expect(hook.result.current.refreshState.error?.message).toBe('offline')
    expect(writes).toHaveLength(0)
    expect(cachedData(queryClient)).toBe(data)
  })

  it('drops a fetchNextPage that was in flight when the refresh wrote', async () => {
    const {hook, queryClient, renderedData} =
      await renderLoadedRefreshableFeed()
    const next = deferred<FeedAPIResponse>()
    apis[0].fetch.mockImplementationOnce(() => next.promise)
    let fetchNextPage!: Promise<unknown>
    act(() => {
      fetchNextPage = hook.result.current.query.fetchNextPage()
    })
    await waitFor(() => expect(apis[0].fetch).toHaveBeenCalledTimes(2))
    const writes = watchWrites(queryClient)
    const rendersBefore = renderedData.length

    let page: FeedPageUnselected | undefined
    await act(async () => {
      page = await hook.result.current.refresh()
    })
    await flushNotifications()
    // Cancelling the fetch and writing reach the view in one render.
    expect(renderedData.slice(rendersBefore)).toHaveLength(1)
    await act(async () => {
      next.resolve({cursor: '0:2', feed: [feedItem('0-2')]})
      await fetchNextPage
    })

    expect(writes).toHaveLength(1)
    expect(cachedData(queryClient)).toEqual({
      pages: [page],
      pageParams: [undefined],
    })
    expect(hook.result.current.query.isFetchingNextPage).toBe(false)
  })

  it('gives way to a refetch from the top that starts while it is in flight', async () => {
    const {hook, queryClient} = await renderLoadedRefreshableFeed()
    const top = deferred<FeedAPIResponse>()
    nextApiTop(() => top.promise)

    let refresh!: Promise<FeedPageUnselected | undefined>
    act(() => {
      refresh = hook.result.current.refresh()
    })
    await waitFor(() => expect(apis).toHaveLength(2))
    await act(() => hook.result.current.query.refetch())
    const data = cachedData(queryClient)
    top.resolve({cursor: '1:1', feed: [feedItem('1-1')]})
    await flushNotifications()

    expect(await refresh).toBeUndefined()
    expect(cachedData(queryClient)).toBe(data)
    expect(cursorsFetchedBy(apis[2])).toEqual([undefined])
  })

  it('gives way to a reset of the feed', async () => {
    const {hook, queryClient} = await renderLoadedRefreshableFeed()
    const top = deferred<FeedAPIResponse>()
    nextApiTop(() => top.promise)
    const {refresh} = hook.result.current
    let refreshing!: Promise<FeedPageUnselected | undefined>
    act(() => {
      refreshing = refresh()
    })
    await waitFor(() => expect(apis).toHaveLength(2))
    // Inactive, so the reset leaves it empty rather than refetching it.
    hook.unmount()

    await act(async () => {
      resetPostsFeedQueries(queryClient)
      await new Promise(resolve => setTimeout(resolve, 0))
      top.resolve({cursor: '1:1', feed: [feedItem('1-1')]})
    })

    expect(await refreshing).toBeUndefined()
    expect(queryClient.getQueryData(KEY)).toBeUndefined()
  })

  it('does not write into a query removed while it was in flight', async () => {
    const {hook, queryClient} = await renderLoadedRefreshableFeed()
    const top = deferred<FeedAPIResponse>()
    nextApiTop(() => top.promise)
    const {refresh} = hook.result.current
    let refreshing!: Promise<FeedPageUnselected | undefined>
    act(() => {
      refreshing = refresh()
    })
    await waitFor(() => expect(apis).toHaveLength(2))
    hook.unmount()
    queryClient.removeQueries({queryKey: KEY})

    // Settled by the removal, without waiting for the fetch.
    expect(await refreshing).toBeUndefined()
    expect(isPostFeedRefreshing(queryClient, KEY)).toBe(false)
    top.resolve({cursor: '1:1', feed: [feedItem('1-1')]})
    await flushNotifications()
    expect(queryClient.getQueryCache().find({queryKey: KEY})).toBeUndefined()
  })

  it('reports the failure of the latest refresh until another starts', async () => {
    const {hook} = await renderLoadedRefreshableFeed()
    const state = () => hook.result.current.refreshState
    nextApiTop(() => Promise.reject(new Error('offline')))
    await act(() => hook.result.current.refresh())
    expect(state().error?.message).toBe('offline')
    expect(state().isRefreshing).toBe(false)

    // A retry clears the error while it is pending, and it comes back if the
    // retry fails too.
    const retry = deferred<FeedAPIResponse>()
    nextApiTop(() => retry.promise)
    let retrying!: Promise<FeedPageUnselected | undefined>
    act(() => {
      retrying = hook.result.current.refresh()
    })
    expect(state().error).toBeUndefined()
    expect(state().isRefreshing).toBe(true)
    await act(async () => {
      retry.reject(new Error('still offline'))
      await retrying
    })
    expect(state().error?.message).toBe('still offline')
    expect(state().isRefreshing).toBe(false)

    await act(() => hook.result.current.refresh())
    expect(state().error).toBeUndefined()
    expect(state().isRefreshing).toBe(false)
  })

  it('reports network failures without logging them as errors', async () => {
    const logError = jest.spyOn(logger, 'error').mockImplementation(() => {})
    try {
      const {hook} = await renderLoadedRefreshableFeed()
      nextApiTop(() => Promise.reject(new TypeError('Network request failed')))
      await act(() => hook.result.current.refresh())
      expect(hook.result.current.refreshState.error?.message).toBe(
        'Network request failed',
      )
      expect(logError).not.toHaveBeenCalled()

      nextApiTop(() => Promise.reject(new Error('Unexpected')))
      await act(() => hook.result.current.refresh())
      expect(hook.result.current.refreshState.error?.message).toBe('Unexpected')
      expect(logError).toHaveBeenCalledTimes(1)
    } finally {
      logError.mockRestore()
    }
  })

  it('reports nothing for a refresh that a refetch from the top overtook', async () => {
    const {hook} = await renderLoadedRefreshableFeed()
    const top = deferred<FeedAPIResponse>()
    nextApiTop(() => top.promise)
    let refresh!: Promise<FeedPageUnselected | undefined>
    act(() => {
      refresh = hook.result.current.refresh()
    })
    await waitFor(() => expect(apis).toHaveLength(2))
    await act(() => hook.result.current.query.refetch())
    await act(async () => {
      top.reject(new Error('offline'))
      await refresh
    })

    expect(hook.result.current.refreshState.error).toBeUndefined()
    expect(hook.result.current.refreshState.isRefreshing).toBe(false)
  })

  it('reports a refresh in flight until it settles', async () => {
    const {hook, queryClient} = await renderLoadedRefreshableFeed()
    const top = deferred<FeedAPIResponse>()
    nextApiTop(() => top.promise)
    expect(isPostFeedRefreshing(queryClient, KEY)).toBe(false)

    let refresh!: Promise<FeedPageUnselected | undefined>
    act(() => {
      refresh = hook.result.current.refresh()
    })
    expect(isPostFeedRefreshing(queryClient, KEY)).toBe(true)
    await act(async () => {
      top.resolve({cursor: '1:1', feed: [feedItem('1-1')]})
      await refresh
    })
    expect(isPostFeedRefreshing(queryClient, KEY)).toBe(false)
  })
})

describe('Following snapshot identity', () => {
  it('is the Home Following query, unmerged', () => {
    // As `Home` builds its params with the merged feed switched off.
    const homeParams = {mergeFeedEnabled: false, mergeFeedSources: []}
    expect(hashKey(FOLLOWING_SNAPSHOT_QUERY_KEY)).toBe(
      hashKey(RQKEY('following', homeParams)),
    )
    expect(hashKey(FOLLOWING_SNAPSHOT_QUERY_KEY)).not.toBe(
      hashKey(
        RQKEY('following', {mergeFeedEnabled: true, mergeFeedSources: []}),
      ),
    )
  })

  it('keeps the startCursor of a response on its page, and only then', async () => {
    jest.mocked(FollowingFeedAPI).mockImplementation(() => {
      const api = createApi()
      api.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          cursor: '0:1',
          startCursor: 'start',
          feed: [feedItem('0-1')],
        }),
      )
      return api as never
    })
    const {hook, queryClient} = await renderLoadedFeed()
    await act(() => hook.result.current.fetchNextPage())

    const [top, next] = cachedData(queryClient).pages
    expect(top.startCursor).toBe('start')
    expect('startCursor' in next).toBe(false)
  })
})

describe('post-feed restore markers', () => {
  it('outlive the query they were recorded for, settled', async () => {
    const {hook, queryClient} = await renderLoadedFeed()
    recordPostFeedRestore(queryClient, hashKey(KEY), {
      restoredAt: 1,
      pageCount: 2,
    })
    expect(getPostFeedRestore(queryClient, KEY)).toEqual({
      restoredAt: 1,
      pageCount: 2,
      status: 'pending',
    })
    expect(isPostFeedRestorePending(queryClient, KEY)).toBe(true)

    hook.unmount()
    queryClient.removeQueries({queryKey: KEY})

    expect(peekPostFeedQueryEntry(queryClient, KEY)).toBeUndefined()
    expect(getPostFeedRestore(queryClient, KEY)?.status).toBe('settled')
    expect(isPostFeedRestorePending(queryClient, KEY)).toBe(false)
  })

  it('are claimed once', () => {
    const queryClient = createQueryClient()
    recordPostFeedRestore(queryClient, hashKey(KEY), {
      restoredAt: 1,
      pageCount: 1,
    })

    expect(beginPostFeedRestorePrepend(queryClient, KEY)).toBe(true)
    expect(beginPostFeedRestorePrepend(queryClient, KEY)).toBe(false)
    // Claimed but not finished is still pending.
    expect(isPostFeedRestorePending(queryClient, KEY)).toBe(true)
  })

  it('belong to the QueryClient they were recorded on', () => {
    const first = createQueryClient()
    const second = createQueryClient()
    recordPostFeedRestore(first, hashKey(KEY), {restoredAt: 1, pageCount: 1})

    expect(getPostFeedRestore(first, KEY)).toBeDefined()
    expect(getPostFeedRestore(second, KEY)).toBeUndefined()
    expect(beginPostFeedRestorePrepend(second, KEY)).toBe(false)
    expect(isPostFeedRestorePending(second, KEY)).toBe(false)
  })
})

describe('useFollowingRestorePrepend', () => {
  const HOUR = 60 * 60 * 1000

  /** Two pages as a restore leaves them: no APIs, and old. */
  function restoredData(
    top: Partial<FeedPageUnselected> = {},
  ): InfiniteData<FeedPageUnselected> {
    const fetchedAt = Date.now() - HOUR
    return {
      pages: [
        {
          cursor: 'r:1',
          startCursor: 'S',
          feed: [feedItem('r-0'), feedItem('r-1')],
          fetchedAt,
          ...top,
        },
        {cursor: 'r:2', feed: [feedItem('r-2')], fetchedAt: fetchedAt + 1},
      ],
      pageParams: [undefined, {cursor: 'r:1'}],
    }
  }

  function renderRestoredFeed(data = restoredData()) {
    const queryClient = createQueryClient()
    queryClient.setQueryData(KEY, data)
    recordPostFeedRestore(queryClient, hashKey(KEY), {
      restoredAt: Date.now(),
      pageCount: data.pages.length,
    })
    const wrapper = ({children}: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const hook = renderHook(
      () => ({
        query: usePostFeedQuery(FEED),
        prepend: useFollowingRestorePrepend(FEED),
        refresh: usePostFeedRefresh(FEED).refresh,
      }),
      {wrapper},
    )
    return {hook, queryClient, data}
  }

  function nextApiSince(since: (since: string) => Promise<FeedAPIResponse>) {
    jest
      .mocked(FollowingFeedAPI)
      .mockImplementationOnce(() => createApi({since}) as never)
  }

  function newerPage(rkeys: string[], cursor: string | undefined = 'S') {
    return Promise.resolve({
      cursor,
      startCursor: 'N',
      feed: rkeys.map(feedItem),
    })
  }

  function watchWrites(queryClient: QueryClient) {
    let writes = 0
    queryClient.getQueryCache().subscribe(event => {
      if (event.type === 'updated' && event.action.type === 'success') {
        writes++
      }
    })
    return () => writes
  }

  it('renders the restored pages without fetching', async () => {
    const {hook} = renderRestoredFeed()
    await waitFor(() =>
      expect(hook.result.current.query.data?.pages).toHaveLength(2),
    )
    expect(apis).toHaveLength(0)
  })

  it('adds what is newer above the restored top in one write, once', async () => {
    const {hook, queryClient} = renderRestoredFeed()
    await waitFor(() => expect(hook.result.current.query.isSuccess).toBe(true))
    const writes = watchWrites(queryClient)
    nextApiSince(() => newerPage(['n-0', 'n-1']))

    let outcome
    await act(async () => {
      outcome = await hook.result.current.prepend()
    })

    expect(outcome).toEqual({outcome: 'contiguous', itemCount: 2})
    expect(apis[0].fetch).toHaveBeenCalledWith({
      cursor: undefined,
      since: 'S',
      limit: 60,
    })
    expect(writes()).toBe(1)
    const {pages, pageParams} = cachedData(queryClient)
    expect(pages.map(page => page.cursor)).toEqual(['S', 'r:1', 'r:2'])
    expect(pages[0]).toMatchObject({since: 'S', startCursor: 'N'})
    // It starts a chain of its own, like the page it sits on.
    expect(pageParams).toEqual([undefined, undefined, {cursor: 'r:1'}])

    await act(async () => {
      expect(await hook.result.current.prepend()).toBeUndefined()
    })
    expect(apis).toHaveLength(1)
    expect(isPostFeedRestorePending(queryClient, KEY)).toBe(false)
  })

  it('keeps the rows below as they were, and drops duplicates from above', async () => {
    const {hook} = renderRestoredFeed()
    await waitFor(() => expect(hook.result.current.query.isSuccess).toBe(true))
    const [top, next] = hook.result.current.query.data!.pages
    // The appview's copy of a post the restored top already holds.
    nextApiSince(() =>
      Promise.resolve({
        cursor: 'S',
        feed: [feedItem('n-0'), feedItem('r-0')],
      }),
    )

    await act(() => hook.result.current.prepend())
    await waitFor(() =>
      expect(hook.result.current.query.data?.pages).toHaveLength(3),
    )

    const pages = hook.result.current.query.data!.pages
    expect(pages[1]).toBe(top)
    expect(pages[2]).toBe(next)
    expect(pages[0].slices.map(slice => slice.feedPostUri)).toEqual([
      'at://did:plc:author/app.bsky.feed.post/n-0',
    ])
    expect(summarizeNewContentAbove(pages)).toEqual({
      count: 1,
      authors: [expect.objectContaining({did: 'did:plc:author'})],
    })
  })

  it('is pending until it settles, and holds nothing back after', async () => {
    const {hook, queryClient} = renderRestoredFeed()
    await waitFor(() => expect(hook.result.current.query.isSuccess).toBe(true))
    const newer = deferred<FeedAPIResponse>()
    nextApiSince(() => newer.promise)
    expect(isPostFeedRestorePending(queryClient, KEY)).toBe(true)

    let prepending!: Promise<unknown>
    act(() => {
      prepending = hook.result.current.prepend()
    })
    expect(isPostFeedRestorePending(queryClient, KEY)).toBe(true)
    await act(async () => {
      newer.resolve({cursor: 'S', feed: [feedItem('n-0')]})
      await prepending
    })
    expect(isPostFeedRestorePending(queryClient, KEY)).toBe(false)
  })

  it('adds nothing when nothing is newer', async () => {
    const {hook, queryClient, data} = renderRestoredFeed()
    await waitFor(() => expect(hook.result.current.query.isSuccess).toBe(true))
    nextApiSince(() => newerPage([]))

    let outcome
    await act(async () => {
      outcome = await hook.result.current.prepend()
    })

    expect(outcome).toEqual({outcome: 'empty', itemCount: 0})
    expect(cachedData(queryClient)).toBe(data)
    expect(
      summarizeNewContentAbove(hook.result.current.query.data?.pages),
    ).toBe(undefined)
  })

  it('leaves the restored top ready to be peeked at when it adds nothing', async () => {
    const appState = AppState.currentState
    AppState.currentState = 'active'
    try {
      const {hook, queryClient} = renderRestoredFeed()
      await waitFor(() =>
        expect(hook.result.current.query.isSuccess).toBe(true),
      )
      const page = hook.result.current.query.data?.pages[0]
      expect(await pollLatest(queryClient, KEY, page)).toBe(false)
      expect(apis).toHaveLength(0)
      nextApiSince(() => newerPage([]))

      await act(() => hook.result.current.prepend())
      await pollLatest(queryClient, KEY, page)

      expect(apis.some(api => api.peekLatest.mock.calls.length > 0)).toBe(true)
    } finally {
      AppState.currentState = appState
    }
  })

  it('does not ask a server that gave no startCursor', async () => {
    const {hook, queryClient} = renderRestoredFeed(
      restoredData({startCursor: undefined}),
    )
    await waitFor(() => expect(hook.result.current.query.isSuccess).toBe(true))

    let outcome
    await act(async () => {
      outcome = await hook.result.current.prepend()
    })

    expect(outcome).toEqual({outcome: 'noStartCursor'})
    expect(apis.every(api => api.fetch.mock.calls.length === 0)).toBe(true)
    expect(isPostFeedRestorePending(queryClient, KEY)).toBe(false)
  })

  it('keeps the restored feed when the fetch fails', async () => {
    const logError = jest.spyOn(logger, 'error').mockImplementation(() => {})
    try {
      const {hook, queryClient, data} = renderRestoredFeed()
      await waitFor(() =>
        expect(hook.result.current.query.isSuccess).toBe(true),
      )
      nextApiSince(() => Promise.reject(new Error('Unknown parameter: since')))

      let outcome
      await act(async () => {
        outcome = await hook.result.current.prepend()
      })

      expect(outcome).toEqual({outcome: 'failed'})
      expect(cachedData(queryClient)).toBe(data)
      expect(isPostFeedRestorePending(queryClient, KEY)).toBe(false)
    } finally {
      logError.mockRestore()
    }
  })

  it('gives way to a refresh that replaces the top meanwhile', async () => {
    const {hook, queryClient} = renderRestoredFeed()
    await waitFor(() => expect(hook.result.current.query.isSuccess).toBe(true))
    const newer = deferred<FeedAPIResponse>()
    nextApiSince(() => newer.promise)

    let prepending!: Promise<unknown>
    act(() => {
      prepending = hook.result.current.prepend()
    })
    await act(() => hook.result.current.refresh())
    const refreshed = cachedData(queryClient)
    await act(async () => {
      newer.resolve({cursor: 'S', feed: [feedItem('n-0')]})
      expect(await prepending).toEqual({outcome: 'superseded'})
    })

    expect(cachedData(queryClient)).toBe(refreshed)
    expect(refreshed.pages).toHaveLength(1)
  })

  it('gives way to a refetch from the top that starts meanwhile', async () => {
    const {hook, queryClient} = renderRestoredFeed()
    await waitFor(() => expect(hook.result.current.query.isSuccess).toBe(true))
    const newer = deferred<FeedAPIResponse>()
    nextApiSince(() => newer.promise)

    let prepending!: Promise<unknown>
    act(() => {
      prepending = hook.result.current.prepend()
    })
    await act(() => hook.result.current.query.refetch())
    await act(async () => {
      newer.resolve({cursor: 'S', feed: [feedItem('n-0')]})
      expect(await prepending).toEqual({outcome: 'superseded'})
    })

    expect(cachedData(queryClient).pages.every(page => !page.since)).toBe(true)
  })

  it('settles the restore when a fetch from the top replaces it first', async () => {
    const {hook, queryClient} = renderRestoredFeed()
    await waitFor(() => expect(hook.result.current.query.isSuccess).toBe(true))

    await act(() => hook.result.current.query.refetch())

    expect(isPostFeedRestorePending(queryClient, KEY)).toBe(false)
    await act(async () => {
      expect(await hook.result.current.prepend()).toBeUndefined()
    })
  })

  it('drops a fetchNextPage that was in flight when it wrote', async () => {
    const {hook, queryClient} = renderRestoredFeed()
    await waitFor(() => expect(hook.result.current.query.isSuccess).toBe(true))
    const next = deferred<FeedAPIResponse>()
    jest.mocked(FollowingFeedAPI).mockImplementationOnce(() => {
      const api = createApi()
      api.fetch.mockImplementationOnce(() => next.promise)
      return api as never
    })
    let fetchNextPage!: Promise<unknown>
    act(() => {
      fetchNextPage = hook.result.current.query.fetchNextPage()
    })
    await waitFor(() => expect(apis).toHaveLength(1))
    nextApiSince(() => newerPage(['n-0']))

    await act(() => hook.result.current.prepend())
    await act(async () => {
      next.resolve({cursor: 'r:3', feed: [feedItem('r-3')]})
      await fetchNextPage
    })

    expect(cachedData(queryClient).pages.map(page => page.cursor)).toEqual([
      'S',
      'r:1',
      'r:2',
    ])
  })

  it('leaves a refetch to start an ordinary chain from the top', async () => {
    const {hook, queryClient} = renderRestoredFeed()
    await waitFor(() => expect(hook.result.current.query.isSuccess).toBe(true))
    nextApiSince(() => newerPage(['n-0']))
    await act(() => hook.result.current.prepend())

    await act(() => hook.result.current.query.refetch())

    const refetchApi = apis[apis.length - 1]
    expect(refetchApi.fetch.mock.calls[0][0]).toEqual({
      cursor: undefined,
      since: undefined,
      limit: 30,
    })
    expect(cachedData(queryClient).pages.every(page => !page.since)).toBe(true)
  })
})
