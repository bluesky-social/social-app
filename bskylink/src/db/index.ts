import assert from 'assert'
import {
  Kysely,
  type KyselyPlugin,
  Migrator,
  type PluginTransformQueryArgs,
  type PluginTransformResultArgs,
  PostgresDialect,
  type QueryResult,
  type RootOperationNode,
  type UnknownRow,
} from 'kysely'
import {default as Pg} from 'pg'

import {dbLogger as log} from '../logger.js'
import {default as migrations} from './migrations/index.js'
import {DbMigrationProvider} from './migrations/provider.js'
import {type DbSchema} from './schema.js'

export class Database {
  migrator: Migrator
  destroyed = false

  constructor(
    public db: Kysely<DbSchema>,
    public cfg: PgConfig,
  ) {
    this.migrator = new Migrator({
      db,
      migrationTableSchema: cfg.schema,
      provider: new DbMigrationProvider(migrations),
    })
  }

  static postgres(opts: PgOptions): Database {
    const {schema, url, txLockNonce} = opts
    log.info(
      {
        schema,
        poolSize: opts.poolSize,
        poolMaxUses: opts.poolMaxUses,
        poolIdleTimeoutMs: opts.poolIdleTimeoutMs,
      },
      'Creating database connection',
    )

    const pool =
      opts.pool ??
      new Pg.Pool({
        connectionString: url,
        max: opts.poolSize,
        maxUses: opts.poolMaxUses,
        idleTimeoutMillis: opts.poolIdleTimeoutMs,
      })

    // Select count(*) and other pg bigints as js integer
    Pg.types.setTypeParser(Pg.types.builtins.INT8, n => parseInt(n, 10))

    // Setup schema usage, primarily for test parallelism (each test suite runs in its own pg schema)
    if (schema && !/^[a-z_]+$/i.test(schema)) {
      throw new Error(`Postgres schema must only contain [A-Za-z_]: ${schema}`)
    }

    pool.on('error', onPoolError)

    const db = new Kysely<DbSchema>({
      dialect: new PostgresDialect({pool}),
    })

    return new Database(db, {
      pool,
      schema,
      url,
      txLockNonce,
    })
  }

  async transaction<T>(fn: (db: Database) => Promise<T>): Promise<T> {
    const leakyTxPlugin = new LeakyTxPlugin()
    return this.db
      .withPlugin(leakyTxPlugin)
      .transaction()
      .execute(txn => {
        const dbTxn = new Database(txn, this.cfg)
        return fn(dbTxn)
          .catch(async err => {
            leakyTxPlugin.endTx()
            // ensure that all in-flight queries are flushed & the connection is open
            await dbTxn.db.getExecutor().provideConnection(async () => {})
            throw err
          })
          .finally(() => leakyTxPlugin.endTx())
      })
  }

  get schema(): string | undefined {
    return this.cfg.schema
  }

  get isTransaction() {
    return this.db.isTransaction
  }

  assertTransaction() {
    assert(this.isTransaction, 'Transaction required')
  }

  assertNotTransaction() {
    assert(!this.isTransaction, 'Cannot be in a transaction')
  }

  async close(): Promise<void> {
    if (this.destroyed) return
    await this.db.destroy()
    this.destroyed = true
  }

  async migrateToOrThrow(migration: string) {
    if (this.schema) {
      await this.db.schema.createSchema(this.schema).ifNotExists().execute()
    }
    const {error, results} = await this.migrator.migrateTo(migration)
    if (error) {
      throw error
    }
    if (!results) {
      throw new Error('An unknown failure occurred while migrating')
    }
    return results
  }

  async migrateToLatestOrThrow() {
    if (this.schema) {
      await this.db.schema.createSchema(this.schema).ifNotExists().execute()
    }
    const {error, results} = await this.migrator.migrateToLatest()
    if (error) {
      throw error
    }
    if (!results) {
      throw new Error('An unknown failure occurred while migrating')
    }
    return results
  }
}

export default Database

export type PgConfig = {
  pool: Pg.Pool
  url: string
  schema?: string
  txLockNonce?: string
}

type PgOptions = {
  url: string
  pool?: Pg.Pool
  schema?: string
  poolSize?: number
  poolMaxUses?: number
  poolIdleTimeoutMs?: number
  txLockNonce?: string
}

class LeakyTxPlugin implements KyselyPlugin {
  private txOver = false

  endTx() {
    this.txOver = true
  }

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    if (this.txOver) {
      throw new Error('tx already failed')
    }
    return args.node
  }

  async transformResult(
    args: PluginTransformResultArgs,
  ): Promise<QueryResult<UnknownRow>> {
    return args.result
  }
}

const onPoolError = (err: Error) => log.error({err}, 'db pool error')
