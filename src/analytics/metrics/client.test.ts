import {MetricsClient} from './client'

let appStateCallback: (state: string) => void

jest.mock('#/lib/appState', () => ({
  onAppStateChange: jest.fn(cb => {
    appStateCallback = cb
    return {remove: jest.fn()}
  }),
}))

jest.mock('#/logger', () => ({
  Logger: {
    create: () => ({
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    }),
    Context: {Metric: 'metric'},
  },
}))

jest.mock('#/env', () => ({
  METRICS_API_HOST: 'https://test.metrics.api',
  IS_WEB: false,
}))

type TestEvents = {
  click: {button: string}
  view: {screen: string}
}

describe('MetricsClient', () => {
  let fetchMock: jest.Mock
  let fetchRequests: {body: any}[]

  beforeEach(() => {
    jest.useFakeTimers({advanceTimers: true})
    fetchRequests = []
    fetchMock = jest.fn().mockImplementation(async (_url, options) => {
      const body = JSON.parse(options.body)
      fetchRequests.push({body})
      return {ok: true, status: 200}
    })
    global.fetch = fetchMock
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it('flushes events on interval', async () => {
    const client = new MetricsClient<TestEvents>()
    client.track('click', {button: 'submit'})
    client.track('view', {screen: 'home'})

    expect(fetchRequests).toHaveLength(0)

    // Advance past the 10 second interval
    await jest.advanceTimersByTimeAsync(10_000)

    expect(fetchRequests).toHaveLength(1)
    expect(fetchRequests[0].body.events).toHaveLength(2)
    expect(fetchRequests[0].body.events[0].event).toBe('click')
    expect(fetchRequests[0].body.events[1].event).toBe('view')
  })

  it('flushes when maxBatchSize is exceeded', async () => {
    const client = new MetricsClient<TestEvents>()
    client.maxBatchSize = 5

    // Add events up to maxBatchSize (should not flush yet)
    for (let i = 0; i < 5; i++) {
      client.track('click', {button: `btn-${i}`})
    }

    expect(fetchRequests).toHaveLength(0)

    // One more event should trigger flush (> maxBatchSize)
    client.track('click', {button: 'btn-trigger'})

    // Allow microtasks to run
    await jest.advanceTimersByTimeAsync(0)

    expect(fetchRequests).toHaveLength(1)
    expect(fetchRequests[0].body.events).toHaveLength(6)
  })

  it('retries failed events once on 500 response', async () => {
    let requestCount = 0

    fetchMock.mockImplementation(async (_url, options) => {
      requestCount++
      const body = JSON.parse(options.body)

      if (requestCount === 1) {
        // First request fails with 500 - "Failed to fetch" triggers isNetworkError
        return {
          ok: false,
          status: 500,
          text: async () => 'Internal Server Error',
        }
      }

      // Retry succeeds
      fetchRequests.push({body})
      return {ok: true, status: 200}
    })

    const client = new MetricsClient<TestEvents>()
    client.track('click', {button: 'submit'})

    // Trigger flush via interval
    await jest.advanceTimersByTimeAsync(10_000)

    expect(requestCount).toBe(1)
    expect(fetchRequests).toHaveLength(0)

    // Simulate app coming to foreground to trigger retry
    appStateCallback('active')
    await jest.advanceTimersByTimeAsync(0)

    expect(requestCount).toBe(2)
    expect(fetchRequests).toHaveLength(1)
    expect(fetchRequests[0].body.events).toHaveLength(1)
    expect(fetchRequests[0].body.events[0].event).toBe('click')
  })

  it('does not retry more than once', async () => {
    let requestCount = 0

    fetchMock.mockImplementation(async () => {
      requestCount++
      // Always fail with network-like error
      return {
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      }
    })

    const client = new MetricsClient<TestEvents>()
    client.track('click', {button: 'submit'})

    // First flush fails
    await jest.advanceTimersByTimeAsync(10_000)

    expect(requestCount).toBe(1)

    // Retry also fails
    appStateCallback('active')
    await jest.advanceTimersByTimeAsync(0)

    expect(requestCount).toBe(2)

    // Another foreground event should not retry again (events are dropped)
    appStateCallback('active')
    await jest.advanceTimersByTimeAsync(0)

    expect(requestCount).toBe(2) // No additional requests
  })

  it('flushes when app goes to background', async () => {
    const client = new MetricsClient<TestEvents>()
    client.track('click', {button: 'submit'})

    expect(fetchRequests).toHaveLength(0)

    // Simulate app going to background
    appStateCallback('background')
    await jest.advanceTimersByTimeAsync(0)

    expect(fetchRequests).toHaveLength(1)
  })
})
