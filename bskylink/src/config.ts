import {envInt, envList, envStr} from '@atproto/common'

export type Config = {
  service: ServiceConfig
  db: DbConfig
}

export type ServiceConfig = {
  port: number
  version?: string
  hostnames: string[]
  appHostname: string
}

export type DbConfig = {
  url: string
  migrationUrl?: string
  pool: DbPoolConfig
  schema?: string
}

export type DbPoolConfig = {
  size: number
  maxUses: number
  idleTimeoutMs: number
}

export type Environment = {
  port?: number
  version?: string
  hostnames: string[]
  appHostname?: string
  dbPostgresUrl?: string
  dbPostgresMigrationUrl?: string
  dbPostgresSchema?: string
  dbPostgresPoolSize?: number
  dbPostgresPoolMaxUses?: number
  dbPostgresPoolIdleTimeoutMs?: number
}

export const readEnv = (): Environment => {
  return {
    port: envInt('LINK_PORT'),
    version: envStr('LINK_VERSION'),
    hostnames: envList('LINK_HOSTNAMES'),
    appHostname: envStr('LINK_APP_HOSTNAME'),
    dbPostgresUrl: envStr('LINK_DB_POSTGRES_URL'),
    dbPostgresMigrationUrl: envStr('LINK_DB_POSTGRES_MIGRATION_URL'),
    dbPostgresSchema: envStr('LINK_DB_POSTGRES_SCHEMA'),
    dbPostgresPoolSize: envInt('LINK_DB_POSTGRES_POOL_SIZE'),
    dbPostgresPoolMaxUses: envInt('LINK_DB_POSTGRES_POOL_MAX_USES'),
    dbPostgresPoolIdleTimeoutMs: envInt(
      'LINK_DB_POSTGRES_POOL_IDLE_TIMEOUT_MS',
    ),
  }
}

export const envToCfg = (env: Environment): Config => {
  const serviceCfg: ServiceConfig = {
    port: env.port ?? 3000,
    version: env.version,
    hostnames: env.hostnames,
    appHostname: env.appHostname || 'bsky.app',
  }
  if (!env.dbPostgresUrl) {
    throw new Error('Must configure postgres url (LINK_DB_POSTGRES_URL)')
  }
  const dbCfg: DbConfig = {
    url: env.dbPostgresUrl,
    migrationUrl: env.dbPostgresMigrationUrl,
    schema: env.dbPostgresSchema,
    pool: {
      idleTimeoutMs: env.dbPostgresPoolIdleTimeoutMs ?? 10000,
      maxUses: env.dbPostgresPoolMaxUses ?? Infinity,
      size: env.dbPostgresPoolSize ?? 10,
    },
  }
  return {
    service: serviceCfg,
    db: dbCfg,
  }
}
