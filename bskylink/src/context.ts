import {SafelinkClient} from './cache/safelinkClient.js'
import {type Config} from './config.js'
import Database from './db/index.js'
import {MetricsClient} from './metrics.js'

export type AppContextOptions = {
  cfg: Config
  db: Database
}

export class AppContext {
  cfg: Config
  db: Database
  safelinkClient: SafelinkClient
  abortController = new AbortController()
  metrics: MetricsClient

  constructor(private opts: AppContextOptions) {
    this.cfg = this.opts.cfg
    this.db = this.opts.db
    this.safelinkClient = new SafelinkClient({
      cfg: this.opts.cfg.service,
      db: this.opts.db,
    })
    this.metrics = new MetricsClient({
      trackingEndpoint: this.opts.cfg.service.metricsApiHost,
    })
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
