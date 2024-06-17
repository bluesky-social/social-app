import {Config} from './config.js'
import Database from './db/index.js'

export type AppContextOptions = {
  cfg: Config
  db: Database
}

export class AppContext {
  cfg: Config
  db: Database
  abortController = new AbortController()

  constructor(private opts: AppContextOptions) {
    this.cfg = this.opts.cfg
    this.db = this.opts.db
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
