/**
 * API client for the Bluesky Feed Consumer backend.
 *
 * Typed fetch wrapper covering /stats, /personas, and /sse endpoints.
 * All requests include the X-Api-Key header for authentication.
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

let _baseUrl = ''
let _apiKey = ''

/**
 * Initialise the client. Call once at app startup before any fetches.
 * Values typically come from EXPO_PUBLIC_* env vars.
 */
export function configureBskyStats(baseUrl: string, apiKey: string): void {
  // Strip trailing slash so callers can just append paths
  _baseUrl = baseUrl.replace(/\/+$/, '')
  _apiKey = apiKey
}

export function getBaseUrl(): string {
  return _baseUrl
}

// ---------------------------------------------------------------------------
// Types — Stats
// ---------------------------------------------------------------------------

export interface StatsMetrics {
  post_count: number
  user_count: number
  like_count: number
  repost_count: number
  reply_count: number
}

export interface StatsDeltas {
  post_count: number | null
  user_count: number | null
  like_count: number | null
  repost_count: number | null
  reply_count: number | null
}

export interface TopItem {
  uri: string
  did: string
  text: string
  count: number
  timestamp: string
}

export interface WindowStats {
  window_seconds: number
  window_start: string
  metrics: StatsMetrics
  deltas: StatsDeltas | null
  top_liked: TopItem[]
  top_reposted: TopItem[]
  language_breakdown: Record<string, number>
}

export interface VelocityData {
  current: number
  history: number[]
}

/** Shape of the SSE snapshot/update event data. */
export interface StatsSnapshot {
  timestamp: string
  windows: Record<string, WindowStats>
  velocity: VelocityData
}

// ---------------------------------------------------------------------------
// Types — Personas
// ---------------------------------------------------------------------------

export interface PersonaInfo {
  handle: string
  display_name: string | null
  status: 'loading' | 'ready' | 'error'
  post_count: number
  reply_count: number
  last_corpus_update: string | null
  avatar_url: string | null
}

export interface PersonaStatusInfo extends PersonaInfo {
  created_at: string
  error_message: string | null
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface ChatHistory {
  handle: string
  messages: ChatMessage[]
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class BskyStatsError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: string,
  ) {
    super(message)
    this.name = 'BskyStatsError'
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function headers(): Record<string, string> {
  return {
    'X-Api-Key': _apiKey,
    'Content-Type': 'application/json',
  }
}

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  if (!_baseUrl) {
    throw new BskyStatsError('BskyStats client not configured', 0)
  }

  const url = `${_baseUrl}${path}`

  let res: Response
  try {
    res = await fetch(url, {
      ...opts,
      headers: {
        ...headers(),
        ...(opts?.headers as Record<string, string>),
      },
    })
  } catch (err) {
    throw new BskyStatsError(
      `Network error: ${err instanceof Error ? err.message : String(err)}`,
      0,
    )
  }

  if (!res.ok) {
    let detail: string | undefined
    try {
      const body = await res.json()
      detail = body.detail
    } catch {
      // body wasn't JSON — that's fine
    }
    throw new BskyStatsError(
      `HTTP ${res.status}: ${detail ?? res.statusText}`,
      res.status,
      detail,
    )
  }

  // 204 No Content
  if (res.status === 204) {
    return undefined as unknown as T
  }

  return res.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Stats API
// ---------------------------------------------------------------------------

export async function fetchStats(
  window: number,
  topN: number = 10,
): Promise<WindowStats> {
  return request<WindowStats>(`/stats/${window}?top_n=${topN}`)
}

// ---------------------------------------------------------------------------
// Persona API
// ---------------------------------------------------------------------------

export async function createPersona(handle: string): Promise<PersonaInfo> {
  return request<PersonaInfo>('/personas', {
    method: 'POST',
    body: JSON.stringify({handle}),
  })
}

export async function listPersonas(): Promise<PersonaInfo[]> {
  return request<PersonaInfo[]>('/personas')
}

export async function fetchPersonaStatus(
  handle: string,
): Promise<PersonaStatusInfo> {
  return request<PersonaStatusInfo>(
    `/personas/${encodeURIComponent(handle)}/status`,
  )
}

export async function fetchChatHistory(handle: string): Promise<ChatHistory> {
  return request<ChatHistory>(`/personas/${encodeURIComponent(handle)}/chat`)
}

export async function deleteChatHistory(handle: string): Promise<void> {
  return request<void>(`/personas/${encodeURIComponent(handle)}/chat`, {
    method: 'DELETE',
  })
}

// ---------------------------------------------------------------------------
// Chat SSE (persona streaming response)
//
// sendChatMessage posts to /personas/{handle}/chat and returns an
// EventSource-like reader for the SSE stream. This is intentionally
// separate from the stats SSE stream.
// ---------------------------------------------------------------------------

export interface ChatStreamCallbacks {
  onToken: (text: string) => void
  onDone: (fullText: string, contextPostsUsed: number) => void
  onError: (error: string) => void
}

/**
 * Send a chat message and stream the AI response token-by-token.
 * Returns an AbortController the caller can use to cancel.
 */
export function sendChatMessage(
  handle: string,
  message: string,
  callbacks: ChatStreamCallbacks,
): AbortController {
  const controller = new AbortController()
  const url = `${_baseUrl}/personas/${encodeURIComponent(handle)}/chat`

  fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({message}),
    signal: controller.signal,
  })
    .then(async res => {
      if (!res.ok) {
        let detail: string | undefined
        try {
          const body = await res.json()
          detail = body.detail
        } catch {
          // not JSON
        }
        callbacks.onError(detail ?? `HTTP ${res.status}`)
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        callbacks.onError('No response body')
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const {done, value} = await reader.read()
        if (done) break

        buffer += decoder.decode(value, {stream: true})
        const lines = buffer.split('\n')
        // Keep the last (possibly incomplete) line in the buffer
        buffer = lines.pop() ?? ''

        let currentEvent = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim()
          } else if (line.startsWith('data: ')) {
            const data = line.slice(6)
            try {
              const parsed = JSON.parse(data)
              if (currentEvent === 'token') {
                callbacks.onToken(parsed.text)
              } else if (currentEvent === 'done') {
                callbacks.onDone(parsed.full_text, parsed.context_posts_used)
              } else if (currentEvent === 'error') {
                callbacks.onError(parsed.error)
              }
            } catch {
              // Malformed JSON — skip
            }
            currentEvent = ''
          }
        }
      }
    })
    .catch(err => {
      if (controller.signal.aborted) return
      callbacks.onError(err instanceof Error ? err.message : String(err))
    })

  return controller
}
