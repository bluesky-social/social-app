import {type PropsWithChildren} from 'react'
import {
  focusManager,
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import {act, renderHook, waitFor} from '@testing-library/react-native'

import {useLanguagePrefs} from '#/state/preferences/languages'
import {useAppviewClient} from '#/state/session'
import {useAtmosphereExploreQuery} from '#/screens/Atmosphere/data/useAtmosphereExploreQuery'
import {app} from '#/lexicons'

jest.mock('#/state/preferences/languages', () => ({
  useLanguagePrefs: jest.fn(),
}))

jest.mock('#/state/session', () => ({
  useAppviewClient: jest.fn(),
}))

const data: app.bsky.unspecced.getAtmosphereExploreTab.$OutputBody = {
  articles: {items: []},
  publications: {items: []},
  photos: {items: []},
  livestreams: {items: []},
  apps: [],
}

function setLanguages(contentLanguages: string[]) {
  jest
    .mocked(useLanguagePrefs)
    .mockReturnValue({contentLanguages} as ReturnType<typeof useLanguagePrefs>)
}

function setup(
  did: string | undefined = 'did:plc:viewer',
  queryClient = new QueryClient({
    defaultOptions: {queries: {gcTime: Infinity, retry: false}},
  }),
) {
  const client = {did, call: jest.fn()}
  jest.mocked(useAppviewClient).mockReturnValue(client as never)
  setLanguages(['en'])

  const wrapper = ({children}: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  return {client, queryClient, wrapper}
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('useAtmosphereExploreQuery', () => {
  it('calls the appview client with the generated query, langs, and a signal', async () => {
    const {client, wrapper} = setup()
    client.call.mockResolvedValue(data)

    const {result} = renderHook(() => useAtmosphereExploreQuery(), {wrapper})

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe(data)
    expect(client.call).toHaveBeenCalledTimes(1)
    expect(client.call).toHaveBeenCalledWith(
      app.bsky.unspecced.getAtmosphereExploreTab,
      {langs: ['en']},
      {
        signal: expect.any(AbortSignal),
        headers: {'Accept-Language': 'en'},
      },
    )
  })

  it.each([
    {languages: ['en', 'fr'], header: 'en,fr'},
    {languages: ['pt-BR'], header: 'pt-BR'},
    {languages: [], header: ''},
  ])(
    'sends content languages $languages as langs and Accept-Language "$header"',
    async ({languages, header}) => {
      const {client, wrapper} = setup()
      setLanguages(languages)
      client.call.mockResolvedValue(data)

      const {result} = renderHook(() => useAtmosphereExploreQuery(), {wrapper})

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(client.call).toHaveBeenCalledWith(
        app.bsky.unspecced.getAtmosphereExploreTab,
        languages.length ? {langs: languages} : {},
        {
          signal: expect.any(AbortSignal),
          headers: {'Accept-Language': header},
        },
      )
    },
  )

  it('refetches with a language-specific key when preferences change', async () => {
    const {client, queryClient, wrapper} = setup()
    client.call.mockResolvedValue(data)

    const {result, rerender} = renderHook(() => useAtmosphereExploreQuery(), {
      wrapper,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    setLanguages(['fr', 'en'])
    rerender({})

    await waitFor(() => expect(client.call).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.call).toHaveBeenLastCalledWith(
      app.bsky.unspecced.getAtmosphereExploreTab,
      {langs: ['fr', 'en']},
      {
        signal: expect.any(AbortSignal),
        headers: {'Accept-Language': 'fr,en'},
      },
    )
    expect(queryClient.getQueryCache().getAll()).toHaveLength(2)
  })

  it('retains every list recommendation ID in the response and cache', async () => {
    const {client, queryClient, wrapper} = setup()
    const response = {
      ...data,
      articles: {items: [], recIdStr: '18446744073709551615'},
      publications: {items: [], recIdStr: '18446744073709551614'},
      photos: {items: [], recIdStr: '18446744073709551613'},
      livestreams: {items: [], recIdStr: '18446744073709551612'},
    }
    client.call.mockResolvedValue(response)

    const {result} = renderHook(() => useAtmosphereExploreQuery(), {wrapper})
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toBe(response)
    expect(queryClient.getQueryCache().getAll()[0].state.data).toBe(response)
    expect(result.current.data?.articles.recIdStr).toBe('18446744073709551615')
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

  it.each(['did:plc:two', undefined])(
    'isolates the cache for viewer %s',
    async did => {
      const {client, queryClient, wrapper} = setup('did:plc:one')
      client.call.mockResolvedValue(data)

      const first = renderHook(() => useAtmosphereExploreQuery(), {wrapper})
      await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
      first.unmount()

      jest
        .mocked(useAppviewClient)
        .mockReturnValue({did, call: client.call} as never)
      const second = renderHook(() => useAtmosphereExploreQuery(), {wrapper})
      await waitFor(() => expect(second.result.current.isSuccess).toBe(true))

      expect(client.call).toHaveBeenCalledTimes(2)
      expect(queryClient.getQueryCache().getAll()).toHaveLength(2)
    },
  )

  it('retries once before surfacing a failure', async () => {
    const {client, wrapper} = setup()
    client.call.mockRejectedValue(new Error('offline'))

    const {result} = renderHook(() => useAtmosphereExploreQuery(), {wrapper})
    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 3000,
    })

    expect(client.call).toHaveBeenCalledTimes(2)
  })

  it('recovers when the retry succeeds', async () => {
    const {client, wrapper} = setup()
    client.call
      .mockRejectedValueOnce(new Error('502'))
      .mockResolvedValueOnce(data)

    const {result} = renderHook(() => useAtmosphereExploreQuery(), {wrapper})
    await waitFor(() => expect(result.current.isSuccess).toBe(true), {
      timeout: 3000,
    })

    expect(result.current.data).toBe(data)
    expect(result.current.isError).toBe(false)
    expect(client.call).toHaveBeenCalledTimes(2)
  })

  it('surfaces failures and recovers on refetch', async () => {
    const {client, wrapper} = setup()
    client.call.mockRejectedValue(new Error('offline'))

    const {result} = renderHook(() => useAtmosphereExploreQuery(), {wrapper})
    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 3000,
    })
    expect(result.current.data).toBeUndefined()
    expect(client.call).toHaveBeenCalledTimes(2)

    client.call.mockResolvedValue(data)
    await result.current.refetch()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe(data)
    expect(client.call).toHaveBeenCalledTimes(3)
  })

  describe('shared memory cache', () => {
    const refreshed = {
      ...data,
      apps: [{id: 'a', title: 'A', url: 'https://a.test'}],
    }

    /*
     * The shared setup() overrides gcTime and retry by default, which would
     * hide this hook's own options, so these tests use library defaults.
     */
    function setupDefaults() {
      return setup('did:plc:viewer', new QueryClient())
    }

    /*
     * Notifications and the failed-refetch retry delay both run on timers, so
     * advance past them instead of waiting in real time.
     */
    async function refetchAndFlush(refetch: () => Promise<unknown>) {
      await act(async () => {
        const refetching = refetch()
        await jest.advanceTimersByTimeAsync(5000)
        await refetching
      })
    }

    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
      focusManager.setFocused(undefined)
      onlineManager.setOnline(true)
    })

    it('coalesces concurrent consumers into one request', async () => {
      const {client, wrapper} = setupDefaults()
      client.call.mockResolvedValue(data)

      const {result} = renderHook(
        () => [useAtmosphereExploreQuery(), useAtmosphereExploreQuery()],
        {wrapper},
      )
      await waitFor(() => expect(result.current[0].isSuccess).toBe(true))

      expect(client.call).toHaveBeenCalledTimes(1)
      expect(result.current[1].data).toBe(data)
    })

    it('reuses a cached response on remount long after the stale and gc windows', async () => {
      const {client, wrapper} = setupDefaults()
      client.call.mockResolvedValue(data)

      const first = renderHook(() => useAtmosphereExploreQuery(), {wrapper})
      await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
      first.unmount()

      act(() => {
        jest.advanceTimersByTime(24 * 60 * 60 * 1000)
      })

      const second = renderHook(() => useAtmosphereExploreQuery(), {wrapper})
      expect(second.result.current.data).toBe(data)
      expect(second.result.current.isFetching).toBe(false)
      expect(client.call).toHaveBeenCalledTimes(1)
    })

    it('does not refetch on focus or reconnect', async () => {
      const {client, wrapper} = setupDefaults()
      client.call.mockResolvedValue(data)

      const {result} = renderHook(() => useAtmosphereExploreQuery(), {wrapper})
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      /*
       * The client reacts to focus and reconnect asynchronously, so flush
       * microtasks before asserting that nothing was requested.
       */
      await act(async () => {
        await jest.advanceTimersByTimeAsync(60 * 60 * 1000)
        focusManager.setFocused(false)
        focusManager.setFocused(true)
        onlineManager.setOnline(false)
        onlineManager.setOnline(true)
        await jest.advanceTimersByTimeAsync(0)
      })

      expect(result.current.isFetching).toBe(false)
      expect(client.call).toHaveBeenCalledTimes(1)
    })

    it('updates every consumer on an explicit refetch and keeps data when it fails', async () => {
      const {client, wrapper} = setupDefaults()
      client.call.mockResolvedValueOnce(data).mockResolvedValueOnce(refreshed)

      const {result} = renderHook(
        () => [useAtmosphereExploreQuery(), useAtmosphereExploreQuery()],
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
})
