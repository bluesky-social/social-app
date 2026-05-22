/**
 * SSE client for the live stats stream from /sse/stats.
 *
 * Uses a plain fetch + ReadableStream approach (works in both web and RN)
 * rather than the EventSource API, which has spotty RN support.
 *
 * Provides auto-reconnect with exponential backoff.
 */
import {type StatsSnapshot} from './bsky-stats'
import {getBaseUrl} from './bsky-stats'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StatsSSECallbacks {
  onSnapshot: (data: StatsSnapshot) => void
  onUpdate: (data: StatsSnapshot) => void
  onError: (error: Error) => void
  onConnected?: () => void
  onDisconnected?: () => void
}

export interface StatsSSEConnection {
  /** Close the connection and stop reconnecting. */
  close: () => void
}

// ---------------------------------------------------------------------------
// SSE line parser (shared with tests)
// ---------------------------------------------------------------------------

export interface ParsedSSEEvent {
  event: string
  data: string
}

/**
 * Parse a chunk of SSE text into events.
 * Returns the parsed events and any remaining incomplete text.
 */
export function parseSSEChunk(buffer: string): {
  events: ParsedSSEEvent[]
  remainder: string
} {
  const events: ParsedSSEEvent[] = []
  const lines = buffer.split('\n')
  // Last element may be an incomplete line
  const remainder = lines.pop() ?? ''

  let currentEvent = ''
  let currentData = ''

  for (const line of lines) {
    if (line.startsWith('event: ')) {
      currentEvent = line.slice(7).trim()
    } else if (line.startsWith('data: ')) {
      currentData = line.slice(6)
    } else if (line === '' && currentEvent && currentData) {
      // Empty line = end of event
      events.push({event: currentEvent, data: currentData})
      currentEvent = ''
      currentData = ''
    }
  }

  // If we have a partial event in progress, put it back in the remainder
  let partialPrefix = ''
  if (currentEvent) {
    partialPrefix += `event: ${currentEvent}\n`
  }
  if (currentData) {
    partialPrefix += `data: ${currentData}\n`
  }

  return {events, remainder: partialPrefix + remainder}
}

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

const INITIAL_BACKOFF_MS = 1_000
const MAX_BACKOFF_MS = 30_000

export function connectStatsSSE(
  apiKey: string,
  callbacks: StatsSSECallbacks,
): StatsSSEConnection {
  let closed = false
  let controller: AbortController | null = null
  let backoff = INITIAL_BACKOFF_MS
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  function scheduleReconnect() {
    if (closed) return
    callbacks.onDisconnected?.()
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      if (!closed) connect()
    }, backoff)
    backoff = Math.min(backoff * 2, MAX_BACKOFF_MS)
  }

  async function connect() {
    if (closed) return

    const baseUrl = getBaseUrl()
    if (!baseUrl) {
      callbacks.onError(new Error('BskyStats client not configured'))
      return
    }

    controller = new AbortController()

    try {
      const res = await fetch(`${baseUrl}/sse/stats`, {
        headers: {'X-Api-Key': apiKey},
        signal: controller.signal,
      })

      if (!res.ok) {
        throw new Error(`SSE connect failed: HTTP ${res.status}`)
      }

      const reader = res.body?.getReader()
      if (!reader) {
        throw new Error('No response body for SSE stream')
      }

      // Connected successfully — reset backoff
      backoff = INITIAL_BACKOFF_MS
      callbacks.onConnected?.()

      const decoder = new TextDecoder()
      let buffer = ''

      while (!closed) {
        const {done, value} = await reader.read()
        if (done) break

        buffer += decoder.decode(value, {stream: true})
        const {events, remainder} = parseSSEChunk(buffer)
        buffer = remainder

        for (const evt of events) {
          try {
            const parsed = JSON.parse(evt.data) as StatsSnapshot
            if (evt.event === 'snapshot') {
              callbacks.onSnapshot(parsed)
            } else if (evt.event === 'update') {
              callbacks.onUpdate(parsed)
            }
          } catch {
            // Malformed JSON — skip this event
          }
        }
      }
    } catch (err) {
      if (closed) return
      if (err instanceof Error && err.name === 'AbortError') return
      callbacks.onError(err instanceof Error ? err : new Error(String(err)))
    }

    // Stream ended or errored — reconnect
    if (!closed) {
      scheduleReconnect()
    }
  }

  // Start first connection
  connect()

  return {
    close() {
      closed = true
      controller?.abort()
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    },
  }
}
