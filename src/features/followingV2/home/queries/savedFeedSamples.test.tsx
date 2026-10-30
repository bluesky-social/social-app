import {type PropsWithChildren} from 'react'
import {
  type InfiniteData,
  notifyManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import {act, renderHook, waitFor} from '@testing-library/react-native'

import {DEFAULT_LOGGED_OUT_PREFERENCES} from '#/state/queries/preferences/const'
import {type app} from '#/lexicons'
import {type FeedPage} from './postFeed'
import {RQKEY, useSavedFeedSamples} from './savedFeedSamples'

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
}))
jest.mock('#/view/com/posts/PostFeedErrorMessage', () => ({}))

const mockFeedTuners: never[] = []
const mockModerationOpts = {
  userDid: 'did:plc:viewer',
  prefs: DEFAULT_LOGGED_OUT_PREFERENCES.moderationPrefs,
  labelDefs: {},
}
let mockPreferences: {
  feedViewPrefs: {lab_mergeFeedEnabled: boolean}
  savedFeeds: {type: string; value: string}[]
  interests: {tags: string[]}
}

const FEEDS = ['a', 'b', 'c', 'd'].map(
  name => `at://did:plc:author/app.bsky.feed.generator/${name}`,
)
const nameOf = (uri: string) => uri.split('/').pop()!

/** Feeds whose posts are too old to sample. */
let staleFeeds: string[]

/** A fake appview: each feed has 3 pages of 2 posts, `<feed>-<page>-<i>`. */
const mockClient = {
  did: 'did:plc:viewer',
  call: jest.fn((_method: unknown, params: {feed: string; cursor?: string}) => {
    const page = params.cursor ? Number(params.cursor) + 1 : 1
    const indexedAt = staleFeeds.includes(params.feed)
      ? '2020-01-01T00:00:00.000Z'
      : new Date().toISOString()
    return {
      cursor: page < 3 ? String(page) : undefined,
      feed: [0, 1].map(i =>
        feedItem(`${nameOf(params.feed)}-${page}-${i}`, indexedAt),
      ),
    }
  }),
}

function feedItem(rkey: string, indexedAt: string) {
  return {
    post: {
      $type: 'app.bsky.feed.defs#postView',
      uri: `at://did:plc:author/app.bsky.feed.post/${rkey}`,
      cid: 'bafyreie5737gdxlw5i64vzichcalba3z2v5n6icifvx5xytvske7mr3hpm',
      author: {did: 'did:plc:author', handle: 'author.test', labels: []},
      record: {
        $type: 'app.bsky.feed.post',
        text: `Post ${rkey}`,
        createdAt: indexedAt,
      },
      indexedAt,
      labels: [],
    },
  } as unknown as app.bsky.feed.defs.FeedViewPost
}

/** Following pages, as far as the samples read them. */
function followingPages(count: number) {
  return Array.from(
    {length: count},
    (_, i) => ({fetchedAt: i + 1, slices: []}) as unknown as FeedPage,
  )
}

/** The feeds read, in order. */
function requested() {
  return mockClient.call.mock.calls.map(([, params]) => nameOf(params.feed))
}

function renderSamples(pageCount: number) {
  const queryClient = new QueryClient({
    defaultOptions: {queries: {gcTime: Infinity, retry: false}},
  })
  const wrapper = ({children}: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const hook = renderHook(
    ({pages}: {pages: FeedPage[]}) =>
      useSavedFeedSamples({enabled: true, pages}),
    {wrapper, initialProps: {pages: followingPages(pageCount)}},
  )
  const cached = () =>
    queryClient.getQueryData<InfiniteData<unknown>>(
      RQKEY({
        feeds: mockPreferences.savedFeeds.map(f => f.value),
        generation: 1,
      }),
    )
  return {hook, cached}
}

beforeAll(() => {
  notifyManager.setNotifyFunction(callback => {
    act(callback)
  })
})

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(Math, 'random').mockReturnValue(0)
  staleFeeds = []
  mockPreferences = {
    feedViewPrefs: {lab_mergeFeedEnabled: true},
    savedFeeds: FEEDS.map(value => ({type: 'feed', value})),
    interests: {tags: []},
  }
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('useSavedFeedSamples', () => {
  it('reads a batch for each Following page and one ahead, rotating through the feeds', async () => {
    const {hook} = renderSamples(1)
    await waitFor(() => expect(hook.result.current).toHaveLength(2))

    expect(requested()).toEqual(['a', 'b', 'c', 'd', 'a', 'b'])
    expect(
      hook.result.current?.[0].map(sample => nameOf(sample.feedPostUri)),
    ).toEqual(['a-1-0', 'b-1-0', 'c-1-0', 'a-1-1', 'b-1-1', 'c-1-1'])

    hook.rerender({pages: followingPages(2)})
    await waitFor(() => expect(hook.result.current).toHaveLength(3))
  })

  it('attributes each sample to its feed', async () => {
    const {hook} = renderSamples(1)
    await waitFor(() => expect(hook.result.current).toHaveLength(2))

    expect(hook.result.current?.[0][0].reason).toEqual({
      $type: 'reasonFeedSource',
      uri: FEEDS[0],
      href: '/profile/did:plc:author/feed/a',
    })
    expect(hook.result.current?.[0][0]._reactKey).toMatch(/^sample\|/)
  })

  it('keeps its page params as plain JSON', async () => {
    const {hook, cached} = renderSamples(1)
    await waitFor(() => expect(hook.result.current).toHaveLength(2))

    const {pageParams} = cached()!
    expect(JSON.parse(JSON.stringify(pageParams))).toEqual(pageParams)
    expect(pageParams[1]).toEqual({
      cursors: {[FEEDS[0]]: '1', [FEEDS[1]]: '1', [FEEDS[2]]: '1'},
      offset: 3,
    })
  })

  it('samples only when two of the feeds read have recent posts', async () => {
    staleFeeds = [FEEDS[0], FEEDS[1]]
    const {hook} = renderSamples(1)
    await waitFor(() => expect(hook.result.current).toHaveLength(2))

    expect(hook.result.current?.[0]).toEqual([])
  })

  it('is off without the lab setting or two saved feeds', () => {
    mockPreferences.feedViewPrefs.lab_mergeFeedEnabled = false
    expect(renderSamples(1).hook.result.current).toBeUndefined()

    mockPreferences.feedViewPrefs.lab_mergeFeedEnabled = true
    mockPreferences.savedFeeds = mockPreferences.savedFeeds.slice(0, 1)
    expect(renderSamples(1).hook.result.current).toBeUndefined()

    expect(mockClient.call).not.toHaveBeenCalled()
  })
})
