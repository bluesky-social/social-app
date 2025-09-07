import {once} from 'events'
import express, {type Application} from 'express'
import * as prometheus from 'prom-client'

export class Metrics {
  private app: Application

  private registry: prometheus.Registry

  requestDuration: prometheus.Histogram
  redirects: prometheus.Counter
  shortLinkRequests: prometheus.Counter
  safeLinkLookups: prometheus.Counter
  safeLinkLookupDuration: prometheus.Histogram

  constructor() {
    const app = express()
    this.app = app

    const registry = new prometheus.Registry()
    this.registry = registry

    // Add add metrics route to express
    app.get('/metrics', async (_req, res) => {
      res.set('content-type', registry.contentType)
      res.end(await registry.metrics())
    })

    // Collect default service metrics
    prometheus.collectDefaultMetrics({
      prefix: 'blink_',
      register: this.registry,
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
    })

    // Add other metrics
    this.requestDuration = new prometheus.Histogram({
      name: 'blink_request_duration_millis',
      help: 'Request duration in mmillis',
      labelNames: ['path', 'method', 'code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [registry],
    })

    this.redirects = new prometheus.Counter({
      name: 'blink_redirects',
      help: 'Number of link redirects handled',
      labelNames: ['safelink_rule', 'code'],
      registers: [registry],
    })

    this.shortLinkRequests = new prometheus.Counter({
      name: 'blink_shortlink_requests',
      help: 'Number of shortlink requests handled',
      labelNames: ['method', 'code'],
      registers: [registry],
    })

    this.safeLinkLookups = new prometheus.Counter({
      name: 'blink_safelink_lookups',
      help: 'Number of safelink lookups handled',
      labelNames: ['status', 'cached'],
      registers: [registry],
    })

    this.safeLinkLookupDuration = new prometheus.Histogram({
      name: 'blink_safelink_lookup_duration_millis',
      help: 'Request duration in millis',
      labelNames: ['status', 'cached'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [registry],
    })
  }

  async start(port: number) {
    const server = this.app.listen(port)
    await once(server, 'listening')
  }
}
