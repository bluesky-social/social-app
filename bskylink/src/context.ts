import {type MetricConfig, Metrics} from '@haileyok/ts-util'

import {SafelinkClient} from './cache/safelinkClient.js'
import {type Config} from './config.js'
import Database from './db/index.js'

export type AppContextOptions = {
  cfg: Config
  db: Database
}

type BlinkMetricNames =
  | 'requestDuration'
  | 'redirects'
  | 'shortLinkRequests'
  | 'safeLinkLookups'
  | 'safeLinkLookupDuration'

type BlinkMetricConfig = Record<BlinkMetricNames, MetricConfig>

export class AppContext {
  cfg: Config
  db: Database
  metrics: Metrics<BlinkMetricConfig>
  safelinkClient: SafelinkClient
  abortController = new AbortController()

  constructor(private opts: AppContextOptions) {
    const metricsConfig: BlinkMetricConfig = {
      requestDuration: {
        type: 'histogram',
        name: 'request_duration_millis',
        help: 'Request duration in millis',
        labelNames: ['path', 'method', 'code'],
        buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      },
      redirects: {
        type: 'counter',
        name: 'redirects',
        help: 'Number of link redirects handled',
        labelNames: ['safelink_rule', 'code'],
      },
      shortLinkRequests: {
        type: 'counter',
        name: 'shortlink_requests',
        help: 'Number of shortlink requests handled',
        labelNames: ['method', 'code'],
      },
      safeLinkLookups: {
        type: 'counter',
        name: 'safelink_lookups',
        help: 'Number of safelink lookups handled',
        labelNames: ['status', 'cached'],
      },
      safeLinkLookupDuration: {
        type: 'histogram',
        name: 'safelink_lookup_duration_millis',
        help: 'Request duration in millis',
        labelNames: ['status', 'cached'],
        buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      },
    }

    this.metrics = new Metrics(metricsConfig, {
      prefix: 'blink_',
      collectDefaultMetrics: true,
    })

    this.cfg = this.opts.cfg
    this.db = this.opts.db
    this.safelinkClient = new SafelinkClient(this)
  }

  static async fromConfig(cfg: Config, overrides?: Partial<AppContextOptions>) {
    const db = Database.postgres({
      url: cfg.db.url,
      schema: cfg.db.schema,
      poolSize: cfg.db.pool.size,
      poolMaxUses: cfg.db.pool.maxUses,
      poolIdleTimeoutMs: cfg.db.pool.idleTimeoutMs,
    })
    return new AppContext({
      cfg,
      db,
      ...overrides,
    })
  }
}
