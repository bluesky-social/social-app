import {type PropsWithChildren} from 'react'
import {
  notifyManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import {act, renderHook, waitFor} from '@testing-library/react-native'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useActorSearch} from '#/state/queries/actor-search'
import {usePopularFeedsSearch} from '#/state/queries/feed'
import {useSearchPostsV2Query} from '#/state/queries/search-posts-v2'
import {useStarterPackSearch} from '#/state/queries/starter-pack-search'
import {useAppviewClient, useSession} from '#/state/session'

jest.mock('#/state/preferences/moderation-opts', () => ({
  useModerationOpts: jest.fn(),
}))

jest.mock('#/state/session', () => ({
  useAppviewClient: jest.fn(),
  useSession: jest.fn(),
}))

jest.mock('#/state/queries/list', () => ({RQKEY: jest.fn()}))

jest.mock('#/state/queries/preferences', () => ({
  usePreferencesQuery: jest.fn(),
}))

jest.mock('#/state/queries/resolve-uri', () => ({
  precacheResolvedUri: jest.fn(),
}))

const searches = [
  ['posts', () => useSearchPostsV2Query({query: 'cats', enabled: true})],
  ['people', () => useActorSearch({query: 'cats', enabled: true})],
  ['feeds', () => usePopularFeedsSearch({query: 'cats', enabled: true})],
  ['starter packs', () => useStarterPackSearch({query: 'cats', enabled: true})],
] as const

beforeAll(() => {
  notifyManager.setNotifyFunction(callback => {
    act(callback)
  })
})

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(useModerationOpts).mockReturnValue({} as never)
})

describe.each(searches)('%s search', (_name, useSearch) => {
  it.each([false, true])(
    'has another page when hasSession is %s',
    async hasSession => {
      const call = jest
        .fn()
        .mockImplementation((_lexicon: unknown, params: {cursor?: string}) =>
          Promise.resolve({
            posts: [],
            actors: [],
            feeds: [],
            starterPacks: [],
            cursor: params.cursor ? undefined : 'next-page',
          }),
        )
      jest.mocked(useAppviewClient).mockReturnValue({call} as never)
      jest.mocked(useSession).mockReturnValue({hasSession} as never)

      const queryClient = new QueryClient({
        defaultOptions: {queries: {gcTime: Infinity, retry: false}},
      })
      const wrapper = ({children}: PropsWithChildren) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
      const {result} = renderHook(
        (): {
          isSuccess: boolean
          hasNextPage: boolean
          fetchNextPage: () => Promise<unknown>
        } => useSearch(),
        {wrapper},
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(call).toHaveBeenCalledTimes(1)
      expect(result.current.hasNextPage).toBe(hasSession)

      if (hasSession) {
        await act(() => result.current.fetchNextPage())
        expect(call).toHaveBeenCalledTimes(2)
        expect(call).toHaveBeenNthCalledWith(
          2,
          expect.anything(),
          expect.objectContaining({cursor: 'next-page'}),
        )
        await waitFor(() => expect(result.current.hasNextPage).toBe(false))
      }
    },
  )
})
