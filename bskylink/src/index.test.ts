import assert from 'node:assert'
import {type AddressInfo} from 'node:net'
import {test} from 'node:test'

import express from 'express'
import {Gauge, register} from 'prom-client'

import {type AppContext} from './context.js'
import {LinkService} from './index.js'

void test('serves and terminates the Prometheus listener', async () => {
  const metricName = 'bskylink_metrics_listener_test'
  const gauge = new Gauge({
    name: metricName,
    help: 'Test metric for the Blink Prometheus listener',
  })
  gauge.set(1)

  const ctx = {
    abortController: new AbortController(),
    cfg: {
      service: {
        metricsPort: 0,
        port: 0,
      },
    },
    db: {
      close: async () => {},
    },
    metrics: {
      start: () => {},
      stop: () => {},
    },
  } as unknown as AppContext
  const service = new LinkService(express(), ctx)

  try {
    await service.start()
    const {port} = service.metricsServer?.address() as AddressInfo
    const res = await fetch(`http://127.0.0.1:${port}/metrics`)

    assert.strictEqual(res.status, 200)
    assert.match(res.headers.get('content-type') ?? '', /text\/plain/)
    assert.match(await res.text(), new RegExp(`${metricName} 1`))
  } finally {
    await service.destroy()
    register.removeSingleMetric(metricName)
  }

  assert.strictEqual(service.metricsServer?.listening, false)
})
