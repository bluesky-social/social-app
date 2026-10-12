import {type PropsWithChildren} from 'react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {renderHook, waitFor} from '@testing-library/react-native'

import {useAppviewClient} from '#/state/session'
import {getAtmosphereExploreTab} from './exploreApi'
import {useAtmosphereExploreQuery} from './useAtmosphereExploreQuery'

jest.mock('#/state/session', () => ({
  useAppviewClient: jest.fn(),
}))

const data = {
  articles: [],
  publications: [],
  photos: [],
  livestreams: [],
  apps: [],
}

function setup(did: string | undefined = 'did:plc:viewer') {
  const queryClient = new QueryClient({
    defaultOptions: {queries: {gcTime: Infinity, retry: false}},
  })
  const client = {did, call: jest.fn()}
  jest.mocked(useAppviewClient).mockReturnValue(client as never)

  const wrapper = ({children}: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  return {client, queryClient, wrapper}
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('useAtmosphereExploreQuery', () => {
  it('calls the appview client with the query, empty params, and a signal', async () => {
    const {client, wrapper} = setup()
    client.call.mockResolvedValue(data)

    const {result} = renderHook(() => useAtmosphereExploreQuery(), {wrapper})

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe(data)
    expect(client.call).toHaveBeenCalledTimes(1)
    expect(client.call).toHaveBeenCalledWith(
      getAtmosphereExploreTab,
      {},
      {signal: expect.any(AbortSignal)},
    )
  })

  it('reuses cached data before the stale time elapses', async () => {
    const {client, queryClient, wrapper} = setup()
    client.call.mockResolvedValue(data)

    const first = renderHook(() => useAtmosphereExploreQuery(), {wrapper})
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
    first.unmount()

    const second = renderHook(() => useAtmosphereExploreQuery(), {wrapper})
    expect(second.result.current.data).toBe(data)
    expect(client.call).toHaveBeenCalledTimes(1)
    expect(queryClient.getQueryCache().getAll()).toHaveLength(1)
  })

  it('keys the cache by the viewer', async () => {
    const {client, queryClient, wrapper} = setup('did:plc:one')
    client.call.mockResolvedValue(data)

    const first = renderHook(() => useAtmosphereExploreQuery(), {wrapper})
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
    first.unmount()

    jest
      .mocked(useAppviewClient)
      .mockReturnValue({did: 'did:plc:two', call: client.call} as never)
    const second = renderHook(() => useAtmosphereExploreQuery(), {wrapper})
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true))

    expect(client.call).toHaveBeenCalledTimes(2)
    expect(queryClient.getQueryCache().getAll()).toHaveLength(2)
  })

  it('surfaces failures and recovers on refetch', async () => {
    const {client, wrapper} = setup()
    client.call.mockRejectedValueOnce(new Error('offline'))

    const {result} = renderHook(() => useAtmosphereExploreQuery(), {wrapper})
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()

    client.call.mockResolvedValueOnce(data)
    await result.current.refetch()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe(data)
    expect(client.call).toHaveBeenCalledTimes(2)
  })
})
