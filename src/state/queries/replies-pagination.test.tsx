import {
  notifyManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import {act, renderHook, waitFor} from '@testing-library/react-native'

import {usePostFeedQuery as useLegacyPostFeedQuery} from '#/state/queries/post-feed'
import {DEFAULT_LOGGED_OUT_PREFERENCES} from '#/state/queries/preferences/const'
import {truncateAndInvalidate} from '#/state/queries/util'
import {usePostFeedQuery as useV2PostFeedQuery} from '#/features/followingV2/home/queries/postFeed'
import {type app} from '#/lexicons'

jest.unmock('multiformats/cid')
jest.mock('#/state/preferences/languages', () => ({
  useLanguagePrefs: () => ({contentLanguages: []}),
  getAppLanguageAsContentLanguage: () => '',
  getContentLanguages: () => [],
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

const mockModerationOpts = {
  userDid: 'did:plc:viewer',
  prefs: DEFAULT_LOGGED_OUT_PREFERENCES.moderationPrefs,
  labelDefs: {},
}
const mockPreferences = {
  savedFeeds: [],
  interests: {tags: []},
  feedViewPrefs: {},
}
const mockClient = {call: jest.fn()}
const REPLIES = 'author|did:plc:author|posts_and_replies_only'

function feedItem(page: number, index: number) {
  return {
    post: {
      $type: 'app.bsky.feed.defs#postView',
      uri: `at://did:plc:author/app.bsky.feed.post/${page}-${index}`,
      cid: 'bafyreie5737gdxlw5i64vzichcalba3z2v5n6icifvx5xytvske7mr3hpm',
      author: {did: 'did:plc:author', handle: 'author.test', labels: []},
      record: {
        $type: 'app.bsky.feed.post',
        text: 'An authored post',
        createdAt: '2026-09-28T00:00:00.000Z',
      },
      indexedAt: '2026-09-28T00:00:00.000Z',
      labels: [],
    },
  } as unknown as app.bsky.feed.defs.FeedViewPost
}

function servePages(
  itemsPerPage: (page: number) => number,
  {exhausted = false, reposts = false} = {},
) {
  mockClient.call.mockImplementation(
    (_method: unknown, {cursor}: {cursor?: string}) => {
      const page = cursor ? Number(cursor) + 1 : 1
      return {
        cursor: exhausted && page === 5 ? undefined : String(page),
        feed: Array.from({length: itemsPerPage(page)}, (_, index) => ({
          ...feedItem(page, index),
          ...(reposts && {
            reason: {
              $type: 'app.bsky.feed.defs#reasonRepost',
              by: {did: 'did:plc:author', handle: 'author.test'},
              indexedAt: '2026-09-28T00:00:00.000Z',
            },
          }),
        })),
      }
    },
  )
}

beforeAll(() => {
  notifyManager.setNotifyFunction(callback => act(callback))
})

beforeEach(() => {
  mockClient.call.mockReset()
})

describe.each([
  ['legacy', useLegacyPostFeedQuery],
  ['v2', useV2PostFeedQuery],
] as const)('%s Replies pagination', (_name, usePostFeedQuery) => {
  function renderFeed(
    feed: typeof REPLIES | 'author|did:plc:author|posts_with_media' = REPLIES,
  ) {
    const queryClient = new QueryClient({
      defaultOptions: {queries: {retry: false, gcTime: Infinity}},
    })
    const wrapper = ({children}: {children: React.ReactNode}) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const hook = renderHook(() => usePostFeedQuery(feed), {wrapper})
    const fetchNextPage = () =>
      act(async () => {
        await hook.result.current.fetchNextPage()
      })
    return {...hook, queryClient, fetchNextPage}
  }

  it.each([
    ['empty responses', 0, false],
    ['partial responses', 1, false],
    ['reposts from an older AppView', 30, true],
  ] as const)(
    'stops after five requests with %s, including the initial request',
    async (_label, count, reposts) => {
      servePages(() => count, {reposts})
      const {result, rerender, fetchNextPage} = renderFeed()

      await waitFor(() => expect(result.current.isPageFillLimited).toBe(true))
      expect(mockClient.call).toHaveBeenCalledTimes(5)
      expect(result.current.hasNextPage).toBe(false)
      expect(result.current.data?.pages).toHaveLength(5)
      expect(
        result.current.data?.pages.flatMap(page => page.slices),
      ).toHaveLength(reposts ? 0 : count * 5)

      rerender(undefined)
      await fetchNextPage()
      await fetchNextPage()
      expect(mockClient.call).toHaveBeenCalledTimes(5)
    },
  )

  it('continues normal pagination when the fifth response fills a page', async () => {
    servePages(page => (page >= 5 ? 30 : 0))
    const {result, fetchNextPage} = renderFeed()

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(5))
    expect(result.current.isPageFillLimited).toBe(false)
    expect(result.current.hasNextPage).toBe(true)

    await fetchNextPage()
    expect(mockClient.call).toHaveBeenCalledTimes(6)
    expect(result.current.isPageFillLimited).toBe(false)
  })

  it('starts a new five-request budget after a full page', async () => {
    servePages(page => (page === 1 ? 30 : 1))
    const {result, fetchNextPage} = renderFeed()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    for (let i = 0; i < 5; i++) {
      await fetchNextPage()
    }
    await waitFor(() => expect(result.current.isPageFillLimited).toBe(true))
    expect(mockClient.call).toHaveBeenCalledTimes(6)
    expect(
      result.current.data?.pages.flatMap(page => page.slices),
    ).toHaveLength(35)
    await fetchNextPage()
    expect(mockClient.call).toHaveBeenCalledTimes(6)
  })

  it('does not report a limit when the server exhausts the feed', async () => {
    servePages(() => 0, {exhausted: true})
    const {result} = renderFeed()

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(5))
    expect(result.current.hasNextPage).toBe(false)
    expect(result.current.isPageFillLimited).toBe(false)
  })

  it('resets after refreshing from the top', async () => {
    servePages(() => 0)
    const {result, queryClient} = renderFeed()
    await waitFor(() => expect(result.current.isPageFillLimited).toBe(true))

    servePages(() => 30)
    const queryKey = queryClient.getQueryCache().getAll()[0].queryKey
    await act(() => truncateAndInvalidate(queryClient, queryKey))

    await waitFor(() => expect(result.current.isPageFillLimited).toBe(false))
    expect(result.current.data?.pages).toHaveLength(1)
    expect(result.current.hasNextPage).toBe(true)
  })

  it('does not limit other profile tabs', async () => {
    servePages(() => 30)
    const {result, fetchNextPage} = renderFeed(
      'author|did:plc:author|posts_with_media',
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    for (let i = 0; i < 5; i++) {
      await fetchNextPage()
    }
    expect(mockClient.call).toHaveBeenCalledTimes(6)
    expect(result.current.isPageFillLimited).toBe(false)
    expect(result.current.hasNextPage).toBe(true)
  })
})
