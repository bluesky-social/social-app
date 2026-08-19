import assert from 'node:assert'
import {type AddressInfo} from 'node:net'
import {test} from 'node:test'

import {envToCfg} from './config.js'
import {LinkService} from './index.js'

const testConfig = () =>
  envToCfg({
    dbPostgresUrl: 'postgres://localhost:1/blink',
    hostnames: ['go.bsky.app'],
    metricsPort: 0,
    port: 0,
    safelinkAgentIdentifier: 'test',
    safelinkAgentPass: 'test',
    safelinkPdsUrl: 'https://example.com',
  })

void test('serves and terminates the Prometheus listener', async () => {
  const service = await LinkService.create(testConfig())

  try {
    await service.start()
    const {port} = service.metricsServer?.address() as AddressInfo
    const res = await fetch(`http://127.0.0.1:${port}/metrics`)

    assert.strictEqual(res.status, 200)
    assert.match(res.headers.get('content-type') ?? '', /text\/plain/)
    const metrics = await res.text()
    assert.match(metrics, /process_cpu_user_seconds_total/)
    assert.match(metrics, /nodejs_eventloop_lag_max_seconds/)
    assert.match(metrics, /bskylink_db_pool_connections\{state="idle"\} 0/)
    assert.match(metrics, /bskylink_db_pool_connections\{state="in_use"\} 0/)
    assert.match(metrics, /bskylink_db_pool_max_connections 10/)
    assert.match(metrics, /bskylink_db_pool_waiting_requests 0/)
    assert.doesNotMatch(metrics, /http_request_duration_seconds/)
  } finally {
    await service.destroy()
  }

  assert.strictEqual(service.metricsServer?.listening, false)
})

void test('isolates the Prometheus registry per service', async () => {
  const first = await LinkService.create(testConfig())
  const second = await LinkService.create(testConfig())

  await Promise.all([first.destroy(), second.destroy()])
})
