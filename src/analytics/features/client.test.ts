import {
  clearCache,
  type FeatureApiResponse,
  setPolyfills,
} from '@growthbook/growthbook'

import {createGrowthBook} from '#/analytics/features/client'

const mockLogInfo = jest.fn()
jest.mock('#/logger', () => ({
  Logger: {
    Context: {Growthbook: 'growthbook'},
    create: () => ({info: (...args: unknown[]) => mockLogInfo(...args)}),
  },
}))

const options = {apiHost: 'https://events.test/gb', clientKey: 'sdk-test'}
const fallback: FeatureApiResponse = {
  dateUpdated: '2026-09-10T00:00:00Z',
  features: {
    demo: {
      defaultValue: false,
      rules: [{condition: {did: {$inGroup: 'beta'}}, force: true}],
    },
  },
  savedGroups: {beta: ['did:plc:beta']},
  experiments: [],
}

const primary: FeatureApiResponse = {
  dateUpdated: '2026-09-11T00:00:00Z',
  features: {demo: {defaultValue: 'primary'}},
  savedGroups: {},
  experiments: [],
}

const fetchMock = jest.fn()
let storage: Map<string, string>

beforeEach(async () => {
  storage = new Map()
  setPolyfills({
    fetch: fetchMock,
    EventSource: undefined,
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value)
      },
    },
  })
  await clearCache()
  fetchMock.mockReset()
  mockLogInfo.mockClear()
  fetchMock.mockRejectedValue(new TypeError('Blocked'))
})

afterEach(async () => {
  jest.useRealTimers()
  await clearCache()
})

function respond(payload: FeatureApiResponse) {
  return {
    ok: true,
    headers: {get: () => null},
    json: () => Promise.resolve(payload),
  }
}

it('keeps the primary request and evaluates saved-group rules after a blocked init', async () => {
  const client = createGrowthBook(options, fallback)
  await client.setAttributes({did: 'did:plc:beta'})
  const result = await client.init()
  expect(result.success).toBe(false)
  expect(fetchMock).toHaveBeenCalledWith(
    'https://events.test/gb/api/features/sdk-test',
    expect.anything(),
  )
  expect(client.isOn('demo')).toBe(true)
  await client.setAttributes({did: 'did:plc:other'})
  expect(client.isOn('demo')).toBe(false)
  client.destroy()
})

it('prefers a successful primary response and retains it through later failures', async () => {
  const client = createGrowthBook(options, fallback)
  fetchMock.mockResolvedValueOnce(respond(primary))
  expect((await client.init()).source).toBe('network')
  expect(client.getFeatureValue('demo', '')).toBe('primary')
  await client.refreshFeatures({skipCache: true})
  expect(client.getFeatureValue('demo', '')).toBe('primary')
  client.destroy()
})

it('uses the fallback within the session refresh budget even while init is pending', async () => {
  jest.useFakeTimers()
  let resolve!: (value: ReturnType<typeof respond>) => void
  fetchMock.mockImplementationOnce(
    () =>
      new Promise(res => {
        resolve = res
      }),
  )
  const client = createGrowthBook(options, fallback)
  const init = client.init({timeout: 2000})
  const refresh = client.refreshFeatures({timeout: 250})
  await jest.advanceTimersByTimeAsync(250)
  await refresh
  expect(client.getPayload()).toEqual(fallback)
  expect(mockLogInfo).toHaveBeenCalledWith(
    'GrowthBook HTML fallback applied',
    expect.objectContaining({source: 'html-fallback'}),
  )

  resolve(respond(primary))
  await init
  expect(client.getPayload()).toEqual(primary)
  client.destroy()
})

it('retains the fallback when both startup waits time out and recovers on refresh', async () => {
  jest.useFakeTimers()
  let resolve!: (value: ReturnType<typeof respond>) => void
  fetchMock.mockImplementationOnce(
    () =>
      new Promise(res => {
        resolve = res
      }),
  )
  const client = createGrowthBook(options, fallback)
  const init = client.init({timeout: 2000})
  const refresh = client.refreshFeatures({timeout: 250})
  await jest.advanceTimersByTimeAsync(2000)
  await Promise.all([init, refresh])
  expect(client.getPayload()).toEqual(fallback)
  expect(mockLogInfo).toHaveBeenCalledTimes(1)
  resolve(respond(primary))
  await jest.advanceTimersByTimeAsync(0)
  await client.refreshFeatures()
  expect(client.getPayload()).toEqual(primary)
  client.destroy()
})

it('prefers newer HTML to the persisted SDK cache and prevents later stale overwrites', async () => {
  const old = {...primary, dateUpdated: '2026-09-01T00:00:00Z'}
  storage.set(
    'gbFeaturesCache',
    JSON.stringify([
      [
        `${options.apiHost}||${options.clientKey}`,
        {
          data: old,
          version: old.dateUpdated,
          staleAt: new Date(Date.now() + 60_000).toISOString(),
        },
      ],
    ]),
  )
  const client = createGrowthBook(options, fallback)
  expect((await client.init()).source).toBe('cache')
  expect(client.getPayload()).toEqual(fallback)
  await client.refreshFeatures()
  expect(client.getPayload()).toEqual(fallback)
  await Promise.all([
    client.setPayload(primary),
    client.setPayload(old),
    client.setPayload({}),
  ])
  expect(client.getPayload()).toEqual(primary)
  client.destroy()
})

it('accepts removal of all gates from a newer primary response', async () => {
  const client = createGrowthBook(options, fallback)
  await client.init()
  const empty = {...primary, features: {}}
  fetchMock.mockResolvedValueOnce(respond(empty))
  await client.refreshFeatures({skipCache: true})
  expect(client.getFeatures()).toEqual({})
  client.destroy()
})

it('preserves normal SDK initialization without an HTML snapshot', async () => {
  const client = createGrowthBook(options)
  await client.init()
  expect(client.getFeatures()).toEqual({})
  fetchMock.mockResolvedValueOnce(respond(primary))
  await client.refreshFeatures({skipCache: true})
  expect(client.getPayload()).toEqual(primary)
  client.destroy()
})

it('clears old targeting groups when a later response omits them', async () => {
  const client = createGrowthBook(options, fallback)
  await client.setAttributes({did: 'did:plc:beta'})
  await client.init()
  expect(client.isOn('demo')).toBe(true)
  fetchMock.mockResolvedValueOnce(
    respond({
      features: fallback.features,
      dateUpdated: primary.dateUpdated,
    }),
  )
  await client.refreshFeatures({skipCache: true})
  expect(client.isOn('demo')).toBe(false)
  client.destroy()
})

it('logs the applied fallback once, then records SDK recovery without mislabeling refreshes', async () => {
  const client = createGrowthBook(options, fallback)
  expect(mockLogInfo).not.toHaveBeenCalled()
  await client.init()
  expect(mockLogInfo).toHaveBeenLastCalledWith(
    'GrowthBook HTML fallback applied',
    {
      source: 'html-fallback',
      dateUpdated: fallback.dateUpdated,
      featureCount: 1,
      savedGroupCount: 1,
    },
  )
  await client.refreshFeatures({skipCache: true})
  await client.refreshFeatures({skipCache: true})
  expect(mockLogInfo).toHaveBeenCalledTimes(1)

  fetchMock.mockResolvedValueOnce(respond(primary))
  await client.refreshFeatures({skipCache: true})
  expect(mockLogInfo).toHaveBeenLastCalledWith(
    'GrowthBook SDK configuration applied',
    {
      source: 'sdk',
      dateUpdated: primary.dateUpdated,
      featureCount: 1,
      savedGroupCount: 0,
    },
  )
  await client.refreshFeatures({skipCache: true})
  expect(mockLogInfo).toHaveBeenCalledTimes(2)
  client.destroy()
})

it('does not report a fallback application when the SDK supplies the configuration', async () => {
  const client = createGrowthBook(options, fallback)
  fetchMock.mockResolvedValueOnce(respond(primary))
  await client.init()
  expect(mockLogInfo).toHaveBeenCalledTimes(1)
  expect(mockLogInfo).toHaveBeenCalledWith(
    'GrowthBook SDK configuration applied',
    expect.objectContaining({source: 'sdk', dateUpdated: primary.dateUpdated}),
  )
  client.destroy()
})
