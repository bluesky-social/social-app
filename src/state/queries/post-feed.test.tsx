import {type PropsWithChildren} from 'react'
import {AppState} from 'react-native'
import {
  type InfiniteData,
  notifyManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import {act, renderHook, waitFor} from '@testing-library/react-native'

import {FollowingFeedAPI} from '#/lib/api/feed/following'
import {type FeedAPIResponse} from '#/lib/api/feed/types'
import {DEFAULT_LOGGED_OUT_PREFERENCES} from '#/state/queries/preferences/const'
import {type app} from '#/lexicons'
import {
  type FeedPageUnselected,
  pollLatest,
  resetPostsFeedQueries,
  RQKEY,
  usePostFeedQuery,
  usePostFeedRefresh,
} from './post-feed'
import {
  isPostFeedRefreshing,
  peekPostFeedQueryEntry,
} from './post-feed-registry'

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
  fetch: jest.Mock<Promise<FeedAPIResponse>, [{cursor: string | undefined}]>
  peekLatest: jest.Mock
}

let apis: MockFeedApi[] = []

/** Cursors encode `<instance>:<page>` to expose API ownership mistakes. */
function createApi({top}: {top?: () => Promise<FeedAPIResponse>} = {}) {
  const id = apis.length
  const api: MockFeedApi = {
    fetch: jest.fn(({cursor}) => {
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
        return {query, refresh: usePostFeedRefresh(FEED)}
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
      await expect(hook.result.current.refresh()).rejects.toThrow('offline')
    })

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

    await expect(firstRefresh).rejects.toThrow('offline')
    await expect(secondRefresh).rejects.toThrow('offline')
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
