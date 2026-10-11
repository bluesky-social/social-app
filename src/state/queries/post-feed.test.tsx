import {type PropsWithChildren} from 'react'
import {AppState} from 'react-native'
import {type Client} from '@atproto/lex'
import {
  notifyManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import {act, renderHook, waitFor} from '@testing-library/react-native'

import {FollowingFeedAPI} from '#/lib/api/feed/following'
import {FeedTuner} from '#/lib/api/feed-manip'
import {useFeedTuners} from '#/state/preferences/feed-tuners'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useAppviewClient, useSession} from '#/state/session'
import {app} from '#/lexicons'
import {type FeedPage, pollLatest, usePostFeedQuery} from './post-feed'

jest.mock('#/state/preferences/languages', () => ({
  getContentLanguages: () => [],
}))

jest.mock('#/state/userActionHistory', () => ({
  seen: jest.fn(),
}))

jest.mock('#/view/com/posts/PostFeedErrorMessage', () => ({
  KnownError: {FeedSignedInOnly: 'FeedSignedInOnly'},
}))

jest.mock('#/state/preferences/feed-tuners', () => ({
  useFeedTuners: jest.fn(),
}))

jest.mock('#/state/preferences/moderation-opts', () => ({
  useModerationOpts: jest.fn(),
}))

jest.mock('#/state/queries/preferences', () => ({
  usePreferencesQuery: jest.fn(),
}))

jest.mock('#/state/session', () => ({
  useAppviewClient: jest.fn(),
  useSession: jest.fn(),
}))

jest.mock('./util', () => ({
  useAutoPagination: jest.fn(),
}))

beforeAll(() => {
  notifyManager.setNotifyFunction(callback => {
    act(callback)
  })
})

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(useFeedTuners).mockReturnValue([])
  jest.mocked(useModerationOpts).mockReturnValue({} as never)
  jest.mocked(usePreferencesQuery).mockReturnValue({
    data: {savedFeeds: [], interests: {tags: []}},
  } as never)
  jest.mocked(useSession).mockReturnValue({hasSession: true} as never)
})

it('paginates with the replacement client and the existing cursor', async () => {
  const oldCall = jest.fn().mockResolvedValue({feed: [], cursor: 'next-page'})
  const newCall = jest
    .fn()
    .mockResolvedValue({feed: [], cursor: 'another-page'})
  let currentClient = {call: oldCall} as unknown as Client
  jest.mocked(useAppviewClient).mockImplementation(() => currentClient)

  const queryClient = new QueryClient({
    defaultOptions: {queries: {retry: false}},
  })
  const wrapper = ({children}: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const hook = renderHook(() => usePostFeedQuery('following'), {wrapper})

  await waitFor(() => expect(hook.result.current.isSuccess).toBe(true))
  expect(oldCall).toHaveBeenCalledTimes(1)
  currentClient = {call: newCall} as unknown as Client
  hook.rerender(undefined)

  await act(() => hook.result.current.fetchNextPage())

  expect(newCall).toHaveBeenCalledWith(
    app.bsky.feed.getTimeline,
    expect.objectContaining({cursor: 'next-page'}),
  )
  expect(oldCall).toHaveBeenCalledTimes(1)
  await waitFor(() => expect(hook.result.current.data?.pages).toHaveLength(2))
  hook.unmount()
})

it('polls with the replacement client before another page is fetched', async () => {
  const oldCall = jest.fn().mockRejectedValue(new Error('session disposed'))
  const newCall = jest.fn().mockResolvedValue({feed: []})
  const page: FeedPage = {
    api: new FollowingFeedAPI({client: {call: oldCall} as unknown as Client}),
    tuner: new FeedTuner([]),
    cursor: 'next-page',
    slices: [],
    fetchedAt: Date.now(),
  }
  const previousState = AppState.currentState
  AppState.currentState = 'active'

  try {
    await pollLatest(page, {call: newCall} as unknown as Client)

    expect(newCall).toHaveBeenCalledWith(
      app.bsky.feed.getTimeline,
      expect.objectContaining({limit: 1}),
    )
    expect(oldCall).not.toHaveBeenCalled()
  } finally {
    AppState.currentState = previousState
  }
})
