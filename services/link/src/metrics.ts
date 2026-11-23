import crypto from 'node:crypto'

import {httpLogger} from './logger.js'

/**
 * New metrics events should be added here
 */
type Events = {
  redirect: {
    link: string
    whitelisted: 'unknown' | 'yes'
    blocked: boolean
    warned: boolean
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    utm_content?: string
    utm_term?: string
  }
  invalid_redirect: {
    link: string
  }
}

type Event<M extends Record<string, any>> = {
  time: number
  event: keyof M
  payload: M[keyof M]
  metadata: Record<string, any>
}

export type Config = {
  trackingEndpoint?: string
}

/**
 * This MetricsClient is duplicated from both `social-app` and `atproto`
 * codebases.
 */
export class MetricsClient<M extends Record<string, any> = Events> {
  maxBatchSize = 100

  private disabled: boolean = false
  private started: boolean = false
  private queue: Event<M>[] = []
  private flushInterval: NodeJS.Timeout | null = null
  constructor(private config: Config) {
    this.disabled = !config.trackingEndpoint
  }

  start() {
    if (this.disabled) return
    if (this.started) return
    this.started = true
    this.flushInterval = setInterval(() => {
      this.flush()
    }, 10_000)
  }

  stop() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
    this.flush()
  }

  track<E extends keyof M>(event: E, payload: M[E]) {
    if (this.disabled) return

    this.start()

    /**
     * deviceId is required for sharding events in Middleman. To avoid a hot
     * shard, we generate a random anonymous IDs for this client.
     *
     * @see https://github.com/bluesky-social/tango/blob/d5819cde419d13e0d2cf837f4b30d48529d64060/middleman/handlers_tracking.go#L195
     */
    const anonId = `anon-${crypto.randomUUID()}`

    /**
     * Event structure is like this to ensure compat with Middleman, which
     * receives events like this from other codebases, including `social-app`.
     */
    const e = {
      source: 'blink',
      time: Date.now(),
      event,
      payload,
      metadata: {
        base: {
          deviceId: anonId,
          sessionId: anonId,
        },
        session: {
          did: undefined,
        },
      },
    }
    this.queue.push(e)

    if (this.queue.length > this.maxBatchSize) {
      this.flush()
    }
  }

  flush() {
    if (this.disabled) return
    if (!this.queue.length) return
    const events = this.queue.splice(0, this.queue.length)
    this.sendBatch(events)
  }

  private async sendBatch(events: Event<M>[]) {
    if (this.disabled || !this.config.trackingEndpoint) return

    try {
      const res = await fetch(this.config.trackingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({events}),
        keepalive: true,
      })

      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Unknown error')
        httpLogger.error(
          {err: new Error(`${res.status} Failed to fetch - ${errorText}`)},
          'Failed to send metrics',
        )
      } else {
        // Drain response body to allow connection reuse.
        await res.text().catch(() => {})
      }
    } catch (err) {
      httpLogger.error({err}, 'Failed to send metrics')
    }
  }
}
