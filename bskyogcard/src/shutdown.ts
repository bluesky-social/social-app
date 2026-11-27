import cluster from 'node:cluster'

import {httpLogger} from './logger.js'

/** Drains once, then exits failed processes so their supervisor replaces them. */
export function installShutdown(destroy: () => Promise<void>) {
  let stopping = false
  let exitCode = 0
  const shutdown = (code = 0) => {
    exitCode = Math.max(exitCode, code)
    if (stopping) return
    stopping = true
    void destroy().then(
      () => {
        httpLogger.info('card service is stopped')
        process.exitCode = exitCode
        if (cluster.isWorker || exitCode !== 0) process.exit(exitCode)
      },
      err => {
        httpLogger.error({err}, 'card service shutdown failed')
        process.exitCode = 1
        if (cluster.isWorker || exitCode !== 0) process.exit(1)
      },
    )
  }
  process.on('SIGTERM', () => shutdown())
  process.on('SIGINT', () => shutdown())
  return shutdown
}
