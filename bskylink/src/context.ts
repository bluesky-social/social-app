import {Counter, Histogram} from 'prom-client'

import {SafelinkClient} from './cache/safelinkClient.js'
import {type Config} from './config.js'
import Database from './db/index.js'

export type AppContextOptions = {
  cfg: Config
  db: Database
}

export class AppContext {
  cfg: Config
  db: Database
  safelinkClient: SafelinkClient
  abortController = new AbortController()

  // Custom business metrics
  shortLinkRequests = new Counter({
    name: 'blink_short_link_requests_total',
    help: 'Number of short link requests handled',
    labelNames: ['method', 'status_code'],
  })

  redirects = new Counter({
    name: 'blink_redirects_total',
    help: 'Number of link redirects handled',
    labelNames: ['safelink_rule', 'status_code'],
  })

  safeLinkLookups = new Counter({
    name: 'blink_safe_link_lookups_total',
    help: 'Number of safelink lookups handled',
    labelNames: ['status', 'cached'],
  })

  safeLinkLookupDuration = new Histogram({
    name: 'blink_safe_link_lookup_duration_milliseconds',
    help: 'Safelink lookup duration in milliseconds',
    labelNames: ['status', 'cached'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  })

  constructor(private opts: AppContextOptions) {
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
