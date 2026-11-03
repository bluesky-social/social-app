import {type PropsWithChildren} from 'react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {act, renderHook, waitFor} from '@testing-library/react-native'

import {useAppviewClient} from '#/state/session'
import {useAtmosphereAppsQuery} from '#/screens/Atmosphere/data/useAtmosphereAppsQuery'
import {app} from '#/lexicons'

jest.mock('#/state/session', () => ({
  useAppviewClient: jest.fn(),
}))

const data: app.bsky.unspecced.getAtmosphereApps.$OutputBody = {
  apps: [{id: 'a', title: 'A', url: 'https://a.test', category: 'social'}],
}
const refreshed: app.bsky.unspecced.getAtmosphereApps.$OutputBody = {
  apps: [{id: 'b', title: 'B', url: 'https://b.test', category: 'dev'}],
}

function setup(did: string | undefined = 'did:plc:viewer') {
  const queryClient = new QueryClient()
  const client = {did, call: jest.fn()}
  jest.mocked(useAppviewClient).mockReturnValue(client as never)

  const wrapper = ({children}: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  return {client, queryClient, wrapper}
}

/* The failed-refetch retry delay runs on a timer, so advance past it. */
async function refetchAndFlush(refetch: () => Promise<unknown>) {
  await act(async () => {
    const refetching = refetch()
    await jest.advanceTimersByTimeAsync(5000)
    await refetching
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('useAtmosphereAppsQuery', () => {
  it('calls the generated query once with no params, language, or category', async () => {
    const {client, wrapper} = setup()
    client.call.mockResolvedValue(data)

    const {result} = renderHook(() => useAtmosphereAppsQuery(), {wrapper})
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toBe(data)
    expect(client.call).toHaveBeenCalledTimes(1)
    expect(client.call).toHaveBeenCalledWith(
      app.bsky.unspecced.getAtmosphereApps,
      {},
      {signal: expect.any(AbortSignal)},
    )
  })

  it('shares an in-flight request and refetches cached data on remount', async () => {
    const {client, queryClient, wrapper} = setup()
    client.call.mockResolvedValue(data)

    const first = renderHook(
      () => [useAtmosphereAppsQuery(), useAtmosphereAppsQuery()],
      {wrapper},
    )
    await waitFor(() => expect(first.result.current[0].isSuccess).toBe(true))
    expect(first.result.current[1].data).toBe(data)
    expect(client.call).toHaveBeenCalledTimes(1)
    first.unmount()

    const second = renderHook(() => useAtmosphereAppsQuery(), {wrapper})
    expect(second.result.current.data).toBe(data)
    await waitFor(() => expect(client.call).toHaveBeenCalledTimes(2))
    expect(queryClient.getQueryCache().getAll()).toHaveLength(1)
  })

  it.each(['did:plc:two', undefined])(
    'isolates the cache for viewer %s',
    async did => {
      const {client, queryClient, wrapper} = setup('did:plc:one')
      client.call.mockResolvedValue(data)

      const first = renderHook(() => useAtmosphereAppsQuery(), {wrapper})
      await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
      first.unmount()

      jest
        .mocked(useAppviewClient)
        .mockReturnValue({did, call: client.call} as never)
      const second = renderHook(() => useAtmosphereAppsQuery(), {wrapper})
      await waitFor(() => expect(second.result.current.isSuccess).toBe(true))

      expect(client.call).toHaveBeenCalledTimes(2)
      expect(queryClient.getQueryCache().getAll()).toHaveLength(2)
    },
  )

  it('retries once, then recovers on an explicit refetch', async () => {
    const {client, wrapper} = setup()
    client.call.mockRejectedValue(new Error('offline'))

    const {result} = renderHook(() => useAtmosphereAppsQuery(), {wrapper})
    await act(async () => {
      await jest.advanceTimersByTimeAsync(5000)
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
    expect(client.call).toHaveBeenCalledTimes(2)

    client.call.mockResolvedValue(data)
    await refetchAndFlush(result.current.refetch)

    expect(result.current.data).toBe(data)
    expect(client.call).toHaveBeenCalledTimes(3)
  })

  it('updates every consumer on an explicit refetch and keeps data when it fails', async () => {
    const {client, wrapper} = setup()
    client.call.mockResolvedValueOnce(data).mockResolvedValueOnce(refreshed)

    const {result} = renderHook(
      () => [useAtmosphereAppsQuery(), useAtmosphereAppsQuery()],
      {wrapper},
    )
    await waitFor(() => expect(result.current[0].isSuccess).toBe(true))

    await refetchAndFlush(result.current[0].refetch)
    expect(result.current[0].data).toEqual(refreshed)
    expect(result.current[1].data).toEqual(refreshed)

    client.call.mockRejectedValue(new Error('offline'))
    await refetchAndFlush(result.current[1].refetch)
    expect(result.current[0].isError).toBe(true)
    expect(result.current[0].data).toEqual(refreshed)
    expect(result.current[1].data).toEqual(refreshed)
  })
})
