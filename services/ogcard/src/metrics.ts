import {type Worker} from 'node:cluster'
import events from 'node:events'
import {type Server} from 'node:http'

import express from 'express'
import {createHttpTerminator} from 'http-terminator'
import {AggregatorRegistry, type Registry} from 'prom-client'

import {httpLogger} from './logger.js'

const METRICS_MESSAGE = 'bskyogcard:metrics'
const COLLECTION_TIMEOUT_MS = 5000

type WorkerMetrics = Awaited<ReturnType<Registry['getMetricsAsJSON']>>

/** Installs a worker's metrics responder; the returned function removes it. */
export function serveWorkerMetrics(registry: Registry) {
  const onMessage = async (message: unknown) => {
    if (
      !message ||
      typeof message !== 'object' ||
      !('type' in message) ||
      message.type !== METRICS_MESSAGE ||
      !('requestId' in message) ||
      typeof message.requestId !== 'number'
    ) {
      return
    }
    const {requestId} = message
    let response: object
    try {
      response = {metrics: await registry.getMetricsAsJSON()}
    } catch {
      response = {error: 'Worker metrics collection failed'}
    }
    if (process.connected) {
      process.send?.({type: METRICS_MESSAGE, requestId, ...response}, () => {})
    }
  }
  process.on('message', onMessage)
  return () => process.off('message', onMessage)
}

let nextRequestId = 0

/**
 * Collects one complete worker snapshot, with bounded, request-scoped listeners.
 * prom-client's clusterMetrics() skips disconnected workers and retains failed
 * requests after timeouts, so its transport cannot provide this guarantee.
 */
export function collectWorkerMetrics(workers: Worker[], signal: AbortSignal) {
  return new Promise<Registry>((resolve, reject) => {
    const requestId = nextRequestId++
    const responses = new Map<Worker, WorkerMetrics>()
    const cleanups: (() => void)[] = []
    let settled = false
    const finish = (error?: Error) => {
      if (settled) return
      settled = true
      for (const cleanup of cleanups) cleanup()
      if (error) return reject(error)
      try {
        /*
         * Each series already has a worker-slot label. Preserve those distinct
         * series, including default metrics otherwise omitted by aggregation;
         * counters must be rated before summing and percentiles stay per-worker.
         */
        resolve(
          AggregatorRegistry.aggregate(
            [...responses.values()].map(metrics =>
              metrics.map(metric => ({...metric, aggregator: 'sum'})),
            ),
          ),
        )
      } catch (err) {
        reject(err)
      }
    }
    const fail = () => finish(new Error('Incomplete worker metrics collection'))
    const timer = setTimeout(fail, COLLECTION_TIMEOUT_MS)
    cleanups.push(() => clearTimeout(timer))
    signal.addEventListener('abort', fail, {once: true})
    cleanups.push(() => signal.removeEventListener('abort', fail))
    if (signal.aborted || !workers.length) return fail()

    for (const worker of workers) {
      if (!worker.isConnected() || worker.isDead()) return fail()
      const onMessage = (message: {
        type?: string
        requestId?: number
        error?: string
        metrics?: WorkerMetrics
      }) => {
        if (
          message?.type !== METRICS_MESSAGE ||
          message.requestId !== requestId ||
          responses.has(worker)
        ) {
          return
        }
        if (message.error || !Array.isArray(message.metrics)) return fail()
        responses.set(worker, message.metrics)
        if (responses.size === workers.length) finish()
      }
      worker.on('message', onMessage)
      worker.once('exit', fail)
      worker.once('disconnect', fail)
      worker.once('error', fail)
      cleanups.push(() => {
        worker.off('message', onMessage)
        worker.off('exit', fail)
        worker.off('disconnect', fail)
        worker.off('error', fail)
      })
      try {
        worker.send({type: METRICS_MESSAGE, requestId}, err => {
          if (err) fail()
        })
      } catch {
        return fail()
      }
    }
  })
}

/** Shared by the single-process service and the cluster's primary process. */
export async function startMetricsServer(
  port: number,
  contentType: string,
  collect: () => Promise<string>,
): Promise<{server: Server; stop: () => Promise<void>}> {
  const app = express()
  app.get('/metrics', (_req, res) => {
    void Promise.resolve()
      .then(collect)
      .then(
        metrics => res.type(contentType).end(metrics),
        err => {
          httpLogger.warn({err}, 'could not collect metrics')
          res.status(503).type('text/plain').end('Metrics collection failed\n')
        },
      )
  })
  const server = app.listen(port)
  await events.once(server, 'listening')
  const terminator = createHttpTerminator({
    server,
    gracefulTerminationTimeout: 2000,
  })
  return {server, stop: () => terminator.terminate()}
}
