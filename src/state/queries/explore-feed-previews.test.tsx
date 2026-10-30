import {type PropsWithChildren} from 'react'
import {
  notifyManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import {act, renderHook, waitFor} from '@testing-library/react-native'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useAppviewClient} from '#/state/session'
import {type app} from '#/lexicons'
import {useFeedPreviews} from './explore-feed-previews'

const mockFetchFeed = jest.fn()

jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (message: unknown) => String(message)}),
}))

jest.mock('#/lib/api/feed/custom', () => ({
  CustomFeedAPI: jest.fn().mockImplementation(() => ({
    fetch: mockFetchFeed,
  })),
}))

jest.mock('#/lib/api/feed/utils', () => ({
  aggregateUserInterests: jest.fn(),
}))

jest.mock('#/state/preferences/moderation-opts', () => ({
  useModerationOpts: jest.fn(),
}))

jest.mock('#/state/queries/preferences', () => ({
  usePreferencesQuery: jest.fn(),
}))

jest.mock('#/state/session', () => ({
  useAppviewClient: jest.fn(),
}))

const feeds = [
  {uri: 'at://did:plc:first/app.bsky.feed.generator/feed'},
  {uri: 'at://did:plc:second/app.bsky.feed.generator/feed'},
] as unknown as app.bsky.feed.defs.GeneratorView[]

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {gcTime: Infinity, retry: false},
    },
  })
  const wrapper = ({children}: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const hook = renderHook(() => useFeedPreviews(feeds), {wrapper})

  return {hook, queryClient, wrapper}
}

beforeAll(() => {
  notifyManager.setNotifyFunction(callback => {
    act(callback)
  })
})

beforeEach(() => {
  jest.clearAllMocks()
  mockFetchFeed.mockResolvedValue({feed: []})
  jest.mocked(useModerationOpts).mockReturnValue({} as never)
  jest.mocked(usePreferencesQuery).mockReturnValue({data: undefined} as never)
  jest.mocked(useAppviewClient).mockReturnValue({} as never)
})

describe('useFeedPreviews', () => {
  it('does not refetch while fresh', async () => {
    const {hook, wrapper} = setup()

    await waitFor(() => expect(hook.result.current.query.isSuccess).toBe(true))

    expect(mockFetchFeed).toHaveBeenCalledTimes(1)
    expect(mockFetchFeed).toHaveBeenCalledWith(
      expect.objectContaining({signal: expect.anything()}),
    )
    hook.rerender(undefined)
    expect(mockFetchFeed).toHaveBeenCalledTimes(1)

    hook.unmount()
    const remountedHook = renderHook(() => useFeedPreviews(feeds), {wrapper})
    await waitFor(() =>
      expect(remountedHook.result.current.query.isSuccess).toBe(true),
    )

    expect(mockFetchFeed).toHaveBeenCalledTimes(1)
    remountedHook.unmount()
  })

  it('reuses a fresh feed across preview-list query keys', async () => {
    const {hook, wrapper} = setup()
    await waitFor(() => expect(mockFetchFeed).toHaveBeenCalledTimes(1))
    hook.unmount()

    const changedListHook = renderHook(() => useFeedPreviews([feeds[0]]), {
      wrapper,
    })
    await waitFor(() =>
      expect(changedListHook.result.current.query.isSuccess).toBe(true),
    )

    expect(mockFetchFeed).toHaveBeenCalledTimes(1)
    changedListHook.unmount()
  })

  it('reloads a feed after the query becomes stale', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000)

    try {
      const {hook, wrapper} = setup()
      await waitFor(() => expect(mockFetchFeed).toHaveBeenCalledTimes(1))
      hook.unmount()

      now.mockReturnValue(1_000 + 3 * 60 * 1_000 + 1)
      const remountedHook = renderHook(() => useFeedPreviews(feeds), {wrapper})
      await waitFor(() => expect(mockFetchFeed).toHaveBeenCalledTimes(2))
      remountedHook.unmount()
    } finally {
      now.mockRestore()
    }
  })

  it('stops after loading the final feed', async () => {
    const {hook} = setup()
    await waitFor(() => expect(hook.result.current.query.isSuccess).toBe(true))

    await act(() => hook.result.current.query.fetchNextPage())

    expect(mockFetchFeed).toHaveBeenCalledTimes(2)
    await waitFor(() =>
      expect(hook.result.current.query.hasNextPage).toBe(false),
    )

    await act(() => hook.result.current.query.fetchNextPage())
    expect(mockFetchFeed).toHaveBeenCalledTimes(2)
  })
})
