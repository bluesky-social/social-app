import assert from 'node:assert'
import {afterEach, beforeEach, describe, it, mock} from 'node:test'

import {httpLogger} from './logger.js'
import {MetricsClient} from './metrics.js'

type TestEvents = {
  click: {button: string}
  view: {screen: string}
}

describe('MetricsClient', () => {
  let fetchMock: ReturnType<typeof mock.fn>
  let fetchRequests: {body: any}[]
  let client: MetricsClient<TestEvents>
  let loggerErrorMock: ReturnType<typeof mock.fn>

  beforeEach(() => {
    mock.timers.enable({apis: ['setInterval', 'setTimeout']})
    fetchRequests = []
    fetchMock = mock.fn(async (_url: any, options: any) => {
      const body = JSON.parse(options.body)
      fetchRequests.push({body})
      return {ok: true, status: 200, text: async () => ''}
    })
    ;(globalThis as any).fetch = fetchMock
    loggerErrorMock = mock.fn()
    httpLogger.error = loggerErrorMock as any
  })

  afterEach(() => {
    client?.stop()
    mock.timers.reset()
    mock.restoreAll()
  })

  it('flushes events on interval', async () => {
    client = new MetricsClient<TestEvents>({
      trackingEndpoint: 'https://test.metrics.api',
    })
    client.track('click', {button: 'submit'})
    client.track('view', {screen: 'home'})

    assert.strictEqual(fetchRequests.length, 0)

    mock.timers.tick(10_000)
    await flush()

    assert.strictEqual(fetchRequests.length, 1)
    assert.strictEqual(fetchRequests[0].body.events.length, 2)
    assert.strictEqual(fetchRequests[0].body.events[0].event, 'click')
    assert.strictEqual(fetchRequests[0].body.events[1].event, 'view')
  })

  it('flushes when maxBatchSize is exceeded', async () => {
    client = new MetricsClient<TestEvents>({
      trackingEndpoint: 'https://test.metrics.api',
    })
    client.maxBatchSize = 5

    for (let i = 0; i < 5; i++) {
      client.track('click', {button: `btn-${i}`})
    }

    assert.strictEqual(fetchRequests.length, 0)

    client.track('click', {button: 'btn-trigger'})
    await flush()

    assert.strictEqual(fetchRequests.length, 1)
    assert.strictEqual(fetchRequests[0].body.events.length, 6)
  })

  it('logs error on failed request', async () => {
    fetchMock.mock.mockImplementation(async () => {
      return {
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      }
    })

    client = new MetricsClient<TestEvents>({
      trackingEndpoint: 'https://test.metrics.api',
    })
    client.track('click', {button: 'submit'})

    mock.timers.tick(10_000)
    await flush()

    assert.strictEqual(fetchMock.mock.callCount(), 1)
    assert.strictEqual(loggerErrorMock.mock.callCount(), 1)
    const call = loggerErrorMock.mock.calls[0]
    const arg = call.arguments[0] as {err: Error}
    assert.ok(arg.err instanceof Error)
    assert.strictEqual(call.arguments[1], 'Failed to send metrics')
  })

  it('handles fetch text() error gracefully', async () => {
    fetchMock.mock.mockImplementation(async () => {
      return {
        ok: false,
        status: 500,
        text: async () => {
          throw new Error('Failed to read response')
        },
      }
    })

    client = new MetricsClient<TestEvents>({
      trackingEndpoint: 'https://test.metrics.api',
    })
    client.track('click', {button: 'submit'})

    mock.timers.tick(10_000)
    await flush()

    assert.strictEqual(fetchMock.mock.callCount(), 1)
    assert.strictEqual(loggerErrorMock.mock.callCount(), 1)
    const call = loggerErrorMock.mock.calls[0]
    const arg = call.arguments[0] as {err: Error}
    assert.ok(arg.err instanceof Error)
    assert.match(arg.err.message, /Unknown error/)
    assert.strictEqual(call.arguments[1], 'Failed to send metrics')
  })

  it('flushes when stop() is called', async () => {
    client = new MetricsClient<TestEvents>({
      trackingEndpoint: 'https://test.metrics.api',
    })
    client.track('click', {button: 'submit'})

    assert.strictEqual(fetchRequests.length, 0)

    client.stop()
    await flush()

    assert.strictEqual(fetchRequests.length, 1)
    assert.strictEqual(fetchRequests[0].body.events.length, 1)
    assert.strictEqual(fetchRequests[0].body.events[0].event, 'click')
  })

  it('does not send if trackingEndpoint is not configured', async () => {
    client = new MetricsClient<TestEvents>({})
    client.track('click', {button: 'submit'})

    mock.timers.tick(10_000)
    await flush()

    assert.strictEqual(fetchMock.mock.callCount(), 0)
  })

  it('start() is idempotent', async () => {
    client = new MetricsClient<TestEvents>({
      trackingEndpoint: 'https://test.metrics.api',
    })

    client.track('click', {button: 'submit'})
    client.start()
    client.start()

    mock.timers.tick(10_000)
    await flush()

    assert.strictEqual(fetchRequests.length, 1)
  })

  it('does not flush if queue is empty', async () => {
    client = new MetricsClient<TestEvents>({
      trackingEndpoint: 'https://test.metrics.api',
    })
    client.start()

    mock.timers.tick(10_000)
    await flush()

    assert.strictEqual(fetchMock.mock.callCount(), 0)
  })
})

function flush() {
  return new Promise(r => setImmediate(r))
}
