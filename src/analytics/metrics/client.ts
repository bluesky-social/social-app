import {onAppStateChange} from '#/lib/appState'
import {isNetworkError} from '#/lib/strings/errors'
import {Logger} from '#/logger'
import * as env from '#/env'

type Event<M extends Record<string, Record<string, unknown>>> = {
  source: 'app'
  time: number
  event: keyof M
  payload: M[keyof M]
  metadata: Record<string, unknown>
}

const TRACKING_ENDPOINT = env.POSTHOG_HOST + '/batch/'
const logger = Logger.create(Logger.Context.Metric, {})

/**
 * Transform an internal metrics event into a PostHog capture event.
 *
 * PostHog requires a `distinct_id` (we key on the device id) and a flat-ish
 * `properties` bag. We spread the event payload and metadata into properties,
 * hoisting the `base` metadata (deviceId, sessionId, platform, appVersion, ...)
 * to the top level so it is queryable in PostHog.
 */
function toPostHogEvent<M extends Record<string, Record<string, unknown>>>(
  e: Event<M>,
) {
  const metadata = e.metadata ?? {}
  const base =
    typeof metadata.base === 'object' && metadata.base !== null
      ? (metadata.base as Record<string, unknown>)
      : {}
  const distinctId =
    typeof base.deviceId === 'string'
      ? base.deviceId
      : typeof base.sessionId === 'string'
        ? base.sessionId
        : 'unknown'
  return {
    event: e.event as string,
    distinct_id: distinctId,
    timestamp: new Date(e.time).toISOString(),
    properties: {
      ...e.payload,
      ...metadata,
      ...base,
      distinct_id: distinctId,
      source: e.source,
    },
  }
}

export class MetricsClient<M extends Record<string, Record<string, unknown>>> {
  maxBatchSize = 100

  private started: boolean = false
  private queue: Event<M>[] = []
  private failedQueue: Event<M>[] = []
  private flushInterval: NodeJS.Timeout | null = null

  start() {
    if (this.started) return
    this.started = true
    this.flushInterval = setInterval(() => {
      this.flush()
    }, 10_000)
    onAppStateChange(state => {
      if (state === 'active') {
        this.retryFailedLogs()
      } else {
        this.flush()
      }
    })
  }

  track<E extends keyof M>(
    event: E,
    payload: M[E],
    metadata: Record<string, unknown> = {},
  ) {
    this.start()

    const e: Event<M> = {
      source: 'app',
      time: Date.now(),
      event,
      payload,
      metadata,
    }
    this.queue.push(e)

    logger.debug(`event: ${e.event as string}`, e)

    if (this.queue.length > this.maxBatchSize) {
      this.flush()
    }
  }

  flush() {
    if (!this.queue.length) return
    const events = this.queue.splice(0, this.queue.length)
    this.sendBatch(events)
  }

  private async sendBatch(events: Event<M>[], isRetry: boolean = false) {
    // No API key configured - PostHog reporting is disabled. Drop the batch
    // rather than queueing it forever.
    if (!env.POSTHOG_API_KEY) return

    try {
      const body = JSON.stringify({
        api_key: env.POSTHOG_API_KEY,
        historical_migration: false,
        batch: events.map(toPostHogEvent),
      })
      if (env.IS_WEB && 'navigator' in globalThis && navigator.sendBeacon) {
        const success = navigator.sendBeacon(
          TRACKING_ENDPOINT,
          new Blob([body], {type: 'application/json'}),
        )
        if (!success) {
          // construct a "network error" for `isNetworkError` to work
          throw new Error(`Failed to fetch: sendBeacon returned false`)
        }
      } else {
        const res = await fetch(TRACKING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body,
          keepalive: true,
        })

        if (!res.ok) {
          const error = await res.text().catch(() => 'Unknown error')
          // construct a "network error" for `isNetworkError` to work
          throw new Error(`${res.status} Failed to fetch — ${error}`)
        }
      }
    } catch (e) {
      if (isNetworkError(e)) {
        if (isRetry) return // retry once
        this.failedQueue.push(...events)
        return
      }
      logger.error(`Failed to send metrics`, {
        safeMessage: String(e),
      })
    }
  }

  private retryFailedLogs() {
    if (!this.failedQueue.length) return
    const events = this.failedQueue.splice(0, this.failedQueue.length)
    this.sendBatch(events, true)
  }
}
