import {onAppStateChange} from '#/lib/appState'
import * as env from '#/env'
import {MetricsClient} from './client'

const mockAppStateListeners = new Set<(state: string) => void>()

function appStateCallback(state: string) {
  for (const listener of [...mockAppStateListeners]) listener(state)
}

jest.mock('#/lib/appState', () => ({
  onAppStateChange: jest.fn(cb => {
    mockAppStateListeners.add(cb)
    return {remove: () => mockAppStateListeners.delete(cb)}
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
  'atmosphere:tab:duration': {
    tab: string
    durationMs: number
    endReason: 'backgrounded'
  }
}

type TestBatch = {
  events: {
    event: keyof TestEvents
    payload: TestEvents[keyof TestEvents]
  }[]
}

describe('MetricsClient', () => {
  let fetchMock: jest.Mock
  let fetchRequests: {body: TestBatch}[]

  beforeEach(() => {
    jest.useFakeTimers({advanceTimers: true})
    mockAppStateListeners.clear()
    fetchRequests = []
    fetchMock = jest
      .fn()
      .mockImplementation(async (_url, options: {body: string}) => {
        const body = JSON.parse(options.body)
        fetchRequests.push({body})
        return {ok: true, status: 200}
      })
    global.fetch = fetchMock
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
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

    fetchMock.mockImplementation(async (_url, options: {body: string}) => {
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

  it('backs off instead of retrying every flush when the endpoint is unreachable', async () => {
    let requestCount = 0

    fetchMock.mockImplementation(() => {
      requestCount++
      return Promise.resolve({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      })
    })

    const client = new MetricsClient<TestEvents>()
    client.track('click', {button: 'first'})

    await jest.advanceTimersByTimeAsync(10_000)
    expect(requestCount).toBe(1)

    // No further requests go out during the backoff, even though the flush
    // interval keeps firing and events keep arriving.
    client.track('click', {button: 'during-backoff'})
    await jest.advanceTimersByTimeAsync(25_000)
    expect(requestCount).toBe(1)

    // Backoff expires, and a single further attempt is made.
    await jest.advanceTimersByTimeAsync(15_000)
    expect(requestCount).toBe(2)

    // That one fails too, so the backoff doubles.
    client.track('click', {button: 'after-second-failure'})
    await jest.advanceTimersByTimeAsync(40_000)
    expect(requestCount).toBe(2)
  })

  it('caps the failed queue at maxBatchSize', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      }),
    )

    const client = new MetricsClient<TestEvents>()
    client.maxBatchSize = 5

    // Exceeding maxBatchSize flushes all six events as one failing batch.
    for (let i = 0; i < 6; i++) {
      client.track('click', {button: `btn-${i}`})
    }
    await jest.advanceTimersByTimeAsync(0)

    let retried: {payload: {button: string}}[] = []
    fetchMock.mockImplementation((_url: string, options: {body: string}) => {
      retried = (
        JSON.parse(options.body) as {events: {payload: {button: string}}[]}
      ).events
      return Promise.resolve({ok: true, status: 200})
    })

    appStateCallback('active')
    await jest.advanceTimersByTimeAsync(0)

    // The oldest event was dropped rather than buffered indefinitely.
    expect(retried).toHaveLength(5)
    expect(retried[0].payload.button).toBe('btn-1')
    expect(retried[4].payload.button).toBe('btn-5')
  })

  it.each(['before', 'after'])(
    'flushes duration from an app-state listener registered %s the client',
    order => {
      const client = new MetricsClient<TestEvents>()
      const duration = {
        tab: 'discover',
        durationMs: 2000,
        endReason: 'backgrounded' as const,
      }
      const recordDuration = (state: string) => {
        if (state === 'background') {
          client.track('atmosphere:tab:duration', duration)
        }
      }
      if (order === 'before') onAppStateChange(recordDuration)
      client.track('view', {screen: 'discover'})
      if (order === 'after') onAppStateChange(recordDuration)

      appStateCallback('background')
      jest.runAllTicks()

      expect(fetchRequests).toHaveLength(1)
      expect(fetchRequests[0].body.events).toEqual([
        expect.objectContaining({event: 'view'}),
        expect.objectContaining({
          event: 'atmosphere:tab:duration',
          payload: duration,
        }),
      ])
      client.flush()
      expect(fetchRequests).toHaveLength(1)
    },
  )

  it('flushes background duration even after an inactive flush', () => {
    const client = new MetricsClient<TestEvents>()
    client.track('view', {screen: 'discover'})
    onAppStateChange(state => {
      if (state === 'background') {
        client.track('atmosphere:tab:duration', {
          tab: 'discover',
          durationMs: 2000,
          endReason: 'backgrounded',
        })
      }
    })

    appStateCallback('inactive')
    jest.runAllTicks()
    expect(fetchRequests).toHaveLength(1)

    appStateCallback('background')
    jest.runAllTicks()
    expect(fetchRequests).toHaveLength(2)
    expect(fetchRequests[1].body.events).toEqual([
      expect.objectContaining({event: 'atmosphere:tab:duration'}),
    ])
    client.flush()
    expect(fetchRequests).toHaveLength(2)
  })

  it('includes background duration in the web beacon', async () => {
    jest.replaceProperty(env, 'IS_WEB', true)
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
    const sendBeacon = jest.fn<boolean, [string, Blob]>(() => true)
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {sendBeacon},
    })

    try {
      const client = new MetricsClient<TestEvents>()
      client.track('view', {screen: 'discover'})
      onAppStateChange(state => {
        if (state === 'background') {
          client.track('atmosphere:tab:duration', {
            tab: 'discover',
            durationMs: 2000,
            endReason: 'backgrounded',
          })
        }
      })

      appStateCallback('background')
      jest.runAllTicks()

      expect(sendBeacon).toHaveBeenCalledTimes(1)
      const [url, blob] = sendBeacon.mock.calls[0]
      expect(url).toBe('https://test.metrics.api/t')
      const {events} = JSON.parse(await blob.text()) as TestBatch
      expect(events.map(event => event.event)).toEqual([
        'view',
        'atmosphere:tab:duration',
      ])
      expect(fetchMock).not.toHaveBeenCalled()
      client.flush()
      expect(sendBeacon).toHaveBeenCalledTimes(1)
    } finally {
      if (descriptor) {
        Object.defineProperty(globalThis, 'navigator', descriptor)
      } else {
        Reflect.deleteProperty(globalThis, 'navigator')
      }
    }
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
