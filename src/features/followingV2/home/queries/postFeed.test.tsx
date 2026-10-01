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
import {
  findAllPostsInQueryData,
  resetProfilePostsQueries,
  RQKEY as LEGACY_RQKEY,
  RQKEY_ROOT,
} from '#/state/queries/post-feed'
import {DEFAULT_LOGGED_OUT_PREFERENCES} from '#/state/queries/preferences/const'
import {FALLBACK_MARKER_POST} from '#/features/followingV2/home/api/home'
import {app} from '#/lexicons'
import {
  type FeedDescriptor,
  type FeedPageUnselected,
  type FeedParams,
  pollLatest,
  RQKEY,
  usePostFeedFetcher,
  usePostFeedQuery,
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
const mockModerationOpts = {
  userDid: 'did:plc:viewer',
  prefs: DEFAULT_LOGGED_OUT_PREFERENCES.moderationPrefs,
  labelDefs: {},
}
let mockPreferences: {
  savedFeeds: {pinned: boolean; value: string}[]
  interests: {tags: string[]}
}

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
    ) => {
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
    defaultOptions: {queries: {gcTime: Infinity, retry: false}},
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
  mockPreferences.savedFeeds = [{pinned: true, value: 'following'}]
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
