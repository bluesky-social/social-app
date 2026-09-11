import {type PropsWithChildren} from 'react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {act, renderHook, waitFor} from '@testing-library/react-native'

import {useAppviewSandboxClient, useSession} from '#/state/session'
import {useAtmosphereQuery} from './query'

jest.mock('#/state/session', () => ({
  useAppviewSandboxClient: jest.fn(),
  useSession: jest.fn(),
}))

const viewer = 'did:plc:viewer'

function setup(responses: unknown[]) {
  const queryClient = new QueryClient({
    defaultOptions: {queries: {gcTime: Infinity, retry: false}},
  })
  const client = {call: jest.fn()}
  for (const response of responses) {
    client.call.mockResolvedValueOnce(response)
  }
  jest.mocked(useAppviewSandboxClient).mockReturnValue(client as never)
  jest.mocked(useSession).mockReturnValue({
    hasSession: true,
    currentAccount: {did: viewer},
  } as never)
  const wrapper = ({children}: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const hook = renderHook(() => useAtmosphereQuery(), {wrapper})
  return {client, hook, queryClient}
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('useAtmosphereQuery', () => {
  it('uses session auth and passes the pagination cursor through unchanged', async () => {
    const firstPage = {
      feed: [],
      associatedRecords: {},
      actors: {},
      cursor: 'opaque-cursor',
    }
    const secondPage = {
      feed: [],
      associatedRecords: {},
      actors: {},
    }
    const {client, hook} = setup([firstPage, secondPage])

    await waitFor(() => expect(hook.result.current.isSuccess).toBe(true))
    expect(client.call).toHaveBeenNthCalledWith(1, expect.anything(), {
      cursor: undefined,
    })
    expect(hook.result.current.hasNextPage).toBe(true)

    await act(() => hook.result.current.fetchNextPage())

    expect(client.call).toHaveBeenNthCalledWith(2, expect.anything(), {
      cursor: 'opaque-cursor',
    })
    await waitFor(() => expect(hook.result.current.hasNextPage).toBe(false))
  })

  it('keeps account caches isolated when an old account request finishes late', async () => {
    let finishOld!: (value: unknown) => void
    const oldPage = {
      feed: [],
      associatedRecords: {},
      actors: {},
      cursor: 'old-viewer-cursor',
    }
    const newPage = {...oldPage, cursor: 'new-viewer-cursor'}
    const pendingOld = new Promise(resolve => {
      finishOld = resolve
    })
    const {hook, queryClient} = setup([pendingOld, newPage])
    jest.mocked(useSession).mockReturnValue({
      hasSession: true,
      currentAccount: {did: 'did:plc:other-viewer'},
    } as never)
    hook.rerender({})
    expect(hook.result.current.data).toBeUndefined()
    await waitFor(() =>
      expect(hook.result.current.data?.pages[0].cursor).toBe(
        'new-viewer-cursor',
      ),
    )
    await act(async () => {
      finishOld(oldPage)
      await pendingOld
    })
    expect(hook.result.current.data?.pages[0].cursor).toBe('new-viewer-cursor')
    expect(
      queryClient.getQueriesData({queryKey: ['useAtmosphereQuery']}),
    ).toHaveLength(2)
  })

  it('retains loaded data and the opaque cursor after a next-page failure, then retries', async () => {
    const firstPage = {
      feed: [],
      associatedRecords: {},
      actors: {},
      cursor: 'opaque+/=cursor',
    }
    const {client, hook} = setup([firstPage])
    await waitFor(() => expect(hook.result.current.isSuccess).toBe(true))
    const originalPage = hook.result.current.data?.pages[0]
    client.call.mockRejectedValueOnce(new Error('Next page unavailable'))
    await act(() => hook.result.current.fetchNextPage())
    await waitFor(() =>
      expect(hook.result.current.isFetchNextPageError).toBe(true),
    )
    expect(hook.result.current.data?.pages[0]).toBe(originalPage)
    client.call.mockResolvedValueOnce({
      feed: [],
      associatedRecords: {},
      actors: {},
    })
    await act(() => hook.result.current.fetchNextPage())
    await waitFor(() => expect(hook.result.current.data?.pages).toHaveLength(2))
    expect(client.call).toHaveBeenLastCalledWith(expect.anything(), {
      cursor: 'opaque+/=cursor',
    })
    expect(hook.result.current.isFetchNextPageError).toBe(false)
  })
})
