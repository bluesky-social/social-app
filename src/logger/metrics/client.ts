import {onAppStateChange} from '#/lib/appState'
import {isNetworkError} from '#/lib/strings/errors'
import {
  type Attributes,
  getGrowthBook,
  getGrowthBookAttributes,
} from '#/logger/growthbook'
import {type Metrics} from '#/logger/metrics/events'
import {Sentry} from '#/logger/sentry/lib'
import * as env from '#/env'

type Event<M extends Metrics> = {
  time: number
  event: keyof M
  payload: M[keyof M]
  metadata: Attributes
}

const TRACKING_ENDPOINT = env.METRICS_API_HOST + '/track'

export class MetricsClient {
  private started: boolean = false
  private queue: Event<Metrics>[] = []
  private failedQueue: Event<Metrics>[] = []
  private flushInterval: NodeJS.Timeout | null = null

  start() {
    if (this.started) return
    if (!getGrowthBook().ready) return
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

  track<E extends keyof Metrics>(event: E, payload: Metrics[E]) {
    this.start()

    this.queue.push({
      time: Date.now(),
      event,
      payload,
      metadata: getGrowthBookAttributes(),
    })

    if (this.queue.length > 100) {
      this.flush()
    }
  }

  flush() {
    if (!this.queue.length) return
    const events = this.queue.splice(0, this.queue.length)
    this.queue = []
    this.sendBatch(events)
  }

  private async sendBatch(events: Event<Metrics>[], isRetry: boolean = false) {
    try {
      const body = JSON.stringify(events)
      if (env.IS_WEB && 'navigator' in globalThis && navigator.sendBeacon) {
        navigator.sendBeacon(
          TRACKING_ENDPOINT,
          new Blob([body], {type: 'application/json'}),
        )
      } else {
        const res = await fetch(TRACKING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(events),
          keepalive: true,
        })

        if (!res.ok) {
          const error = await res.text().catch(() => 'Unknown error')
          // construct a "network error" for `isNetworkError` to work
          throw new Error(`${res.status} Failed to fetch — ${error}`)
        }
      }
    } catch (e: any) {
      if (isNetworkError(e)) {
        if (isRetry) return // retry once
        this.failedQueue.push(...events)
        return
      }
      Sentry.captureException(`Failed to send metrics`, {
        extra: {
          safeMessage: e.toString(),
        },
      })
    }
  }

  private retryFailedLogs() {
    if (!this.failedQueue.length) return
    const events = this.failedQueue.splice(0, this.failedQueue.length)
    this.failedQueue = []
    this.sendBatch(events, true)
  }
}
