import {
  clearCache,
  type FeatureApiResponse,
  setPolyfills,
} from '@growthbook/growthbook'

import {createGrowthBook, refreshGrowthBook} from '#/analytics/features/client'

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

it('synchronously evaluates fallback saved-group rules before refreshing', async () => {
  const client = createGrowthBook(options, fallback)
  await client.setAttributes({did: 'did:plc:beta'})
  expect(client.isOn('demo')).toBe(true)
  await client.setAttributes({did: 'did:plc:other'})
  expect(client.isOn('demo')).toBe(false)

  await refreshGrowthBook(client)
  expect(fetchMock).toHaveBeenCalledWith(
    'https://events.test/gb/api/features/sdk-test',
    expect.anything(),
  )
  expect(client.getPayload()).toEqual(fallback)
  client.destroy()
})

it('prefers a successful primary response and retains it through later failures', async () => {
  const client = createGrowthBook(options, fallback)
  fetchMock.mockResolvedValueOnce(respond(primary))
  await refreshGrowthBook(client)
  expect(client.getFeatureValue('demo', '')).toBe('primary')
  await refreshGrowthBook(client)
  expect(client.getFeatureValue('demo', '')).toBe('primary')
  client.destroy()
})

it('uses the fallback within concurrent startup refresh budgets', async () => {
  jest.useFakeTimers()
  let resolve!: (value: ReturnType<typeof respond>) => void
  fetchMock.mockImplementationOnce(
    () =>
      new Promise(res => {
        resolve = res
      }),
  )
  const client = createGrowthBook(options, fallback)
  const initialRefresh = refreshGrowthBook(client, {timeout: 2000})
  const sessionRefresh = refreshGrowthBook(client, {timeout: 250})
  await jest.advanceTimersByTimeAsync(250)
  await sessionRefresh
  expect(client.getPayload()).toEqual(fallback)

  resolve(respond(primary))
  await initialRefresh
  expect(client.getPayload()).toEqual(primary)
  client.destroy()
})

it('bypasses an older persisted SDK cache', async () => {
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
  await refreshGrowthBook(client)
  expect(client.getPayload()).toEqual(fallback)
  client.destroy()
})

it('rejects an older primary response', async () => {
  const old = {...primary, dateUpdated: '2026-09-01T00:00:00Z'}
  const client = createGrowthBook(options, fallback)
  fetchMock.mockResolvedValueOnce(respond(old))
  await refreshGrowthBook(client)
  expect(client.getPayload()).toEqual(fallback)
  client.destroy()
})

it('rejects a primary response without a revision', async () => {
  const client = createGrowthBook(options, fallback)
  fetchMock.mockResolvedValueOnce(respond({features: primary.features}))
  await refreshGrowthBook(client)
  expect(client.getPayload()).toEqual(fallback)
  client.destroy()
})

it('accepts removal of gates and targeting groups from a newer response', async () => {
  const client = createGrowthBook(options, fallback)
  await client.setAttributes({did: 'did:plc:beta'})
  expect(client.isOn('demo')).toBe(true)
  fetchMock.mockResolvedValueOnce(
    respond({
      features: {},
      dateUpdated: primary.dateUpdated,
    }),
  )
  await refreshGrowthBook(client)
  expect(client.getFeatures()).toEqual({})
  expect(client.getDecryptedPayload().savedGroups).toEqual({})
  client.destroy()
})

it('preserves normal SDK initialization without an HTML snapshot', async () => {
  const client = createGrowthBook(options)
  await client.init()
  expect(client.getFeatures()).toEqual({})
  fetchMock.mockResolvedValueOnce(respond(primary))
  await client.refreshFeatures({skipCache: true})
  expect(client.getPayload()).toEqual(primary)
  expect(mockLogInfo).not.toHaveBeenCalled()
  client.destroy()
})

it('logs the fallback once, then records SDK recovery without duplicates', async () => {
  const client = createGrowthBook(options, fallback)
  expect(mockLogInfo).toHaveBeenCalledWith('GrowthBook HTML fallback applied', {
    source: 'html-fallback',
    dateUpdated: fallback.dateUpdated,
    featureCount: 1,
    savedGroupCount: 1,
  })
  await refreshGrowthBook(client)
  await refreshGrowthBook(client)
  expect(mockLogInfo).toHaveBeenCalledTimes(1)

  fetchMock.mockResolvedValueOnce(respond(primary))
  await refreshGrowthBook(client)
  expect(mockLogInfo).toHaveBeenLastCalledWith(
    'GrowthBook SDK configuration applied',
    {
      source: 'sdk',
      dateUpdated: primary.dateUpdated,
      featureCount: 1,
      savedGroupCount: 0,
    },
  )
  await refreshGrowthBook(client)
  expect(mockLogInfo).toHaveBeenCalledTimes(2)
  client.destroy()
})
