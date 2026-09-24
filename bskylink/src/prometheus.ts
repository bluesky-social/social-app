import {collectDefaultMetrics, Gauge, Registry} from 'prom-client'

import {type AppContext} from './context.js'

let runtimeRegistry: Registry | undefined

const getRuntimeRegistry = (): Registry => {
  if (!runtimeRegistry) {
    runtimeRegistry = new Registry()

    // Beyla already exports HTTP RED metrics and traces for Blink. These
    // process metrics cover the runtime-only failure modes it cannot see,
    // particularly event-loop stalls, GC pauses, and V8 heap pressure.
    collectDefaultMetrics({register: runtimeRegistry})
  }

  return runtimeRegistry
}

export const createPrometheusRegistry = (ctx: AppContext): Registry => {
  const poolRegistry = new Registry()

  new Gauge<'state'>({
    name: 'bskylink_db_pool_connections',
    help: 'PostgreSQL client connections by usage state.',
    labelNames: ['state'],
    registers: [poolRegistry],
    collect() {
      const {idleCount, totalCount} = ctx.db.cfg.pool
      this.set({state: 'idle'}, idleCount)
      this.set({state: 'in_use'}, totalCount - idleCount)
    },
  })

  new Gauge({
    name: 'bskylink_db_pool_max_connections',
    help: 'Configured maximum PostgreSQL client connections.',
    registers: [poolRegistry],
    collect() {
      this.set(ctx.cfg.db.pool.size)
    },
  })

  new Gauge({
    name: 'bskylink_db_pool_waiting_requests',
    help: 'Requests waiting for a PostgreSQL client connection.',
    registers: [poolRegistry],
    collect() {
      this.set(ctx.db.cfg.pool.waitingCount)
    },
  })

  return Registry.merge([getRuntimeRegistry(), poolRegistry])
}
