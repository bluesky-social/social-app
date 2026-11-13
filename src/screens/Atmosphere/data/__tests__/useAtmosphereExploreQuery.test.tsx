import {type PropsWithChildren} from 'react'
import {Platform} from 'react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {act, renderHook, waitFor} from '@testing-library/react-native'

import {useLanguagePrefs} from '#/state/preferences/languages'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useAppviewClient} from '#/state/session'
import {useAtmosphereExploreQuery} from '#/screens/Atmosphere/data/useAtmosphereExploreQuery'
import {app} from '#/lexicons'
import {device} from '#/storage'

jest.mock('#/state/preferences/languages', () => ({
  useLanguagePrefs: jest.fn(),
}))

jest.mock('#/state/queries/preferences', () => ({
  usePreferencesQuery: jest.fn(),
}))

jest.mock('#/state/session', () => ({
  useAppviewClient: jest.fn(),
}))

jest.mock('#/state/cache/profile-shadow', () => ({
  useApplyProfileShadow: () => (profile: unknown) => profile,
}))

jest.mock('#/env', () => ({IS_WEB: false}))
jest.mock('#/storage', () => ({device: {get: jest.fn()}}))

const defaultHeaders = {
  'x-atproto-bsky-platform': Platform.OS,
  'x-atproto-bsky-topics': '',
}

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

function setInterests(tags: string[], updatedAt?: string) {
  jest.mocked(usePreferencesQuery).mockReturnValue({
    data: {interests: {tags, updatedAt}},
  } as ReturnType<typeof usePreferencesQuery>)
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
  jest.mocked(device.get).mockReset()
  jest.mocked(usePreferencesQuery).mockReturnValue({
    data: undefined,
  } as ReturnType<typeof usePreferencesQuery>)
})

describe('useAtmosphereExploreQuery', () => {
  it('calls the appview client with the generated query, langs, and a signal', async () => {
    const {client, wrapper} = setup()
    client.call.mockResolvedValue(data)

    const {result} = renderHook(() => useAtmosphereExploreQuery(), {wrapper})

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(data)
    expect(client.call).toHaveBeenCalledTimes(1)
    expect(client.call).toHaveBeenCalledWith(
      app.bsky.unspecced.getAtmosphereExploreTab,
      {langs: ['en']},
      {
        signal: expect.any(AbortSignal),
        headers: {...defaultHeaders, 'Accept-Language': 'en'},
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
          headers: {...defaultHeaders, 'Accept-Language': header},
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
        headers: {...defaultHeaders, 'Accept-Language': 'fr,en'},
      },
    )
    expect(queryClient.getQueryCache().getAll()).toHaveLength(2)
  })

  it('sends the Discover platform, service geo, and timestamped topics headers', async () => {
    const {client, wrapper} = setup()
    client.call.mockResolvedValue(data)
    setLanguages(['en', 'fr'])
    setInterests(['animals', 'music'], '2026-09-03T17:00:00.000Z')
    jest.mocked(device.get).mockReturnValue({
      countryCode: 'JP',
      regionCode: '13',
      city: '東京',
      ip: '2001:db8::1',
    })

    const {result} = renderHook(() => useAtmosphereExploreQuery(), {wrapper})
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(client.call).toHaveBeenCalledWith(
      app.bsky.unspecced.getAtmosphereExploreTab,
      {langs: ['en', 'fr']},
      {
        signal: expect.any(AbortSignal),
        headers: {
          'Accept-Language': 'en,fr',
          'x-atproto-bsky-platform': Platform.OS,
          'x-atproto-bsky-topics': 'animals,music;2026-09-03T17:00:00.000Z',
          'x-atproto-bsky-geo-country': 'JP',
          'x-atproto-bsky-geo-region': '13',
          'x-atproto-bsky-geo-city': '%E6%9D%B1%E4%BA%AC',
          'x-atproto-bsky-geo-ip': '2001:db8::1',
        },
      },
    )
    expect(device.get).toHaveBeenCalledWith(['geolocationServiceResponse'])
  })

  it('reads updated service geolocation on refetch, including when logged out', async () => {
    const {client, wrapper} = setup()
    jest
      .mocked(useAppviewClient)
      .mockReturnValue({...client, did: undefined} as never)
    client.call.mockResolvedValue(data)
    jest
      .mocked(device.get)
      .mockReturnValue({countryCode: 'JP', regionCode: '13'})

    const {result} = renderHook(() => useAtmosphereExploreQuery(), {wrapper})
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    jest
      .mocked(device.get)
      .mockReturnValue({countryCode: 'US', regionCode: undefined})
    await act(async () => {
      await result.current.refetch()
    })

    expect(client.call).toHaveBeenCalledTimes(2)
    expect(client.call).toHaveBeenLastCalledWith(
      app.bsky.unspecced.getAtmosphereExploreTab,
      {langs: ['en']},
      {
        signal: expect.any(AbortSignal),
        headers: {
          ...defaultHeaders,
          'Accept-Language': 'en',
          'x-atproto-bsky-geo-country': 'US',
        },
      },
    )
  })

  it('refetches with an interests-specific key when preferences change', async () => {
    const {client, queryClient, wrapper} = setup()
    client.call.mockResolvedValue(data)
    setInterests(['music'])

    const {result, rerender} = renderHook(() => useAtmosphereExploreQuery(), {
      wrapper,
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    setInterests(['animals'], '2026-09-03T17:00:00.000Z')
    rerender({})

    await waitFor(() => expect(client.call).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.call).toHaveBeenLastCalledWith(
      app.bsky.unspecced.getAtmosphereExploreTab,
      {langs: ['en']},
      {
        signal: expect.any(AbortSignal),
        headers: {
          ...defaultHeaders,
          'Accept-Language': 'en',
          'x-atproto-bsky-topics': 'animals;2026-09-03T17:00:00.000Z',
        },
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

    expect(result.current.data).toEqual(response)
    expect(queryClient.getQueryCache().getAll()[0].state.data).toBe(response)
    expect(result.current.data?.articles.recIdStr).toBe('18446744073709551615')
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

    expect(result.current.data).toEqual(data)
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
    expect(result.current.data).toEqual(data)
    expect(client.call).toHaveBeenCalledTimes(3)
  })

  describe('cache and refresh', () => {
    const refreshed = {
      ...data,
      apps: [{id: 'a', title: 'A', url: 'https://a.test'}],
    }

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
      expect(result.current[1].data).toEqual(data)
    })

    it('shows cached data and refetches on remount', async () => {
      const {client, queryClient, wrapper} = setup()
      client.call.mockResolvedValue(data)

      const first = renderHook(() => useAtmosphereExploreQuery(), {wrapper})
      await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
      first.unmount()

      const second = renderHook(() => useAtmosphereExploreQuery(), {wrapper})
      expect(second.result.current.data).toEqual(data)
      await waitFor(() => expect(client.call).toHaveBeenCalledTimes(2))
      expect(queryClient.getQueryCache().getAll()).toHaveLength(1)
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
