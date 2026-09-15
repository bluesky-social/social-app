import {useState as mockUseState} from 'react'
import {
  dehydrate,
  hydrate,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import {act, renderHook, waitFor} from '@testing-library/react-native'

import {isQueryPersisted} from '#/state/queries/util'
import type * as bsky from '#/types/bsky'
import {useSearchHistory} from './index'

const mockCall = jest.fn()
let mockDid = 'did:plc:me'
const mockStorage: Record<string, string[]> = {}

jest.mock('#/state/session', () => ({
  useSession: () => ({currentAccount: {did: mockDid}}),
  useAppviewClient: () => ({call: mockCall}),
}))
jest.mock('#/storage', () => ({
  account: {},
  useStorage: (_: unknown, scopes: string[]) => {
    const key = scopes.join('/')
    const [value, setValue] = mockUseState(mockStorage[key])
    return [
      value,
      (next: string[]) => {
        mockStorage[key] = next
        setValue(next)
      },
    ]
  },
}))

const alice: bsky.profile.AnyProfileView = {
  did: 'did:plc:alice' as const,
  handle: 'alice.test' as const,
  avatar: 'https://example.com/old.jpg',
}

function setup(
  client = new QueryClient({defaultOptions: {queries: {retry: false}}}),
) {
  const hook = renderHook(() => useSearchHistory(), {
    wrapper: ({children}: {children: React.ReactNode}) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  })
  return {...hook, client}
}

beforeEach(() => {
  mockCall.mockReset()
  mockDid = 'did:plc:me'
  for (const key of Object.keys(mockStorage)) delete mockStorage[key]
})

it('stores a selected profile immediately and restores it while offline after restart', async () => {
  mockCall.mockRejectedValue(new Error('offline'))
  const first = setup()
  act(() => first.result.current.updateProfileHistory(alice))
  expect(first.result.current.profiles).toEqual([alice])
  await waitFor(() => expect(mockCall).toHaveBeenCalled())
  await waitFor(() => expect(first.client.isFetching()).toBe(0))
  const saved = dehydrate(first.client, {
    shouldDehydrateQuery: q =>
      isQueryPersisted(q.queryKey) && q.state.status === 'success',
  })
  expect(saved.queries).toHaveLength(1)
  first.unmount()
  first.client.clear()
  const restoredClient = new QueryClient({
    defaultOptions: {queries: {retry: false}},
  })
  hydrate(restoredClient, JSON.parse(JSON.stringify(saved)))
  const restored = setup(restoredClient)
  expect(restored.result.current.profiles).toEqual([alice])
  await waitFor(() => expect(restoredClient.isFetching()).toBe(0))
  expect(restored.result.current.profiles).toEqual([alice])
  restored.unmount()
  restoredClient.clear()
})

it('refreshes stored profile details and removes deleted profiles from the snapshot', async () => {
  let resolve!: (data: {profiles: (typeof alice)[]}) => void
  mockCall.mockImplementation(
    () =>
      new Promise(r => {
        resolve = r
      }),
  )
  const hook = setup()
  act(() => hook.result.current.updateProfileHistory(alice))
  await waitFor(() => expect(mockCall).toHaveBeenCalled())
  act(() =>
    resolve({profiles: [{...alice, avatar: 'https://example.com/new.jpg'}]}),
  )
  await waitFor(() =>
    expect(hook.result.current.profiles[0]?.avatar).toBe(
      'https://example.com/new.jpg',
    ),
  )
  act(() => hook.result.current.deleteProfileHistoryItem(alice))
  expect(hook.result.current.profiles).toEqual([])
  expect(hook.client.getQueryCache().getAll()[0].state.data).toEqual([])
  hook.unmount()
  hook.client.clear()
})

it('keeps snapshots separate between accounts', async () => {
  mockCall.mockResolvedValue({profiles: [alice]})
  const first = setup()
  act(() => first.result.current.updateProfileHistory(alice))
  await waitFor(() => expect(first.client.isFetching()).toBe(0))
  first.unmount()
  mockDid = 'did:plc:other'
  const second = setup(first.client)
  expect(second.result.current.profiles).toEqual([])
  second.unmount()
  first.client.clear()
})

it('refreshes avatars while the history remains mounted', async () => {
  jest.useFakeTimers()
  mockStorage['did:plc:me/searchAccountHistory'] = [alice.did]
  mockCall.mockResolvedValue({profiles: [alice]})
  const hook = setup()
  try {
    await waitFor(() => expect(hook.result.current.profiles).toEqual([alice]))
    mockCall.mockResolvedValue({profiles: [{...alice, avatar: 'updated.jpg'}]})
    await act(async () => {
      await jest.advanceTimersByTimeAsync(5 * 60 * 1000)
    })
    await waitFor(() =>
      expect(hook.result.current.profiles[0]?.avatar).toBe('updated.jpg'),
    )
  } finally {
    hook.unmount()
    hook.client.clear()
    jest.useRealTimers()
  }
})

it('does not restore a deleted profile when an older refresh completes', async () => {
  let resolve!: (data: {profiles: (typeof alice)[]}) => void
  mockCall.mockImplementation(
    () =>
      new Promise(r => {
        resolve = r
      }),
  )
  const hook = setup()
  act(() => hook.result.current.updateProfileHistory(alice))
  await waitFor(() => expect(mockCall).toHaveBeenCalled())
  act(() => hook.result.current.deleteProfileHistoryItem(alice))
  act(() => resolve({profiles: [alice]}))
  await waitFor(() => expect(hook.client.isFetching()).toBe(0))
  expect(hook.result.current.profiles).toEqual([])
  expect(hook.client.getQueryCache().getAll()[0].state.data).toEqual([])
  hook.unmount()
  hook.client.clear()
})
