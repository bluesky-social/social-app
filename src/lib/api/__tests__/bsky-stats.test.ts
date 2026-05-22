import {beforeEach, describe, expect, it, jest} from '@jest/globals'

import {
  BskyStatsError,
  type ChatStreamCallbacks,
  configureBskyStats,
  createPersona,
  deleteChatHistory,
  fetchChatHistory,
  fetchPersonaStatus,
  fetchStats,
  listPersonas,
  sendChatMessage,
} from '../bsky-stats'
import {parseSSEChunk} from '../bsky-stats-sse'

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const MOCK_BASE = 'https://bsky.example.com'
const MOCK_KEY = 'test-api-key-123'

beforeEach(() => {
  configureBskyStats(MOCK_BASE, MOCK_KEY)
  jest.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// Helper: mock fetch
// ---------------------------------------------------------------------------

function mockFetchJson(body: unknown, status = 200) {
  const fn = jest.fn<typeof fetch>().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
    body: null,
  } as Response)
  global.fetch = fn
  return fn
}

function mockFetchFailure(errorMessage: string) {
  const fn = jest.fn<typeof fetch>().mockRejectedValue(new Error(errorMessage))
  global.fetch = fn
  return fn
}

// ---------------------------------------------------------------------------
// API client: URL construction
// ---------------------------------------------------------------------------

describe('bsky-stats API client', () => {
  describe('URL construction', () => {
    it('builds correct stats URL with default top_n', async () => {
      const fetchMock = mockFetchJson({window_seconds: 60})
      await fetchStats(60)
      expect(fetchMock).toHaveBeenCalledTimes(1)
      const url = fetchMock.mock.calls[0][0]
      expect(url).toBe(`${MOCK_BASE}/stats/60?top_n=10`)
    })

    it('builds correct stats URL with custom top_n', async () => {
      const fetchMock = mockFetchJson({window_seconds: 300})
      await fetchStats(300, 25)
      const url = fetchMock.mock.calls[0][0]
      expect(url).toBe(`${MOCK_BASE}/stats/300?top_n=25`)
    })

    it('builds correct persona status URL with handle encoding', async () => {
      const fetchMock = mockFetchJson({handle: 'test.bsky.social'})
      await fetchPersonaStatus('test.bsky.social')
      const url = fetchMock.mock.calls[0][0]
      expect(url).toBe(`${MOCK_BASE}/personas/test.bsky.social/status`)
    })

    it('builds correct chat history URL', async () => {
      const fetchMock = mockFetchJson({
        handle: 'alice.bsky.social',
        messages: [],
      })
      await fetchChatHistory('alice.bsky.social')
      const url = fetchMock.mock.calls[0][0]
      expect(url).toBe(`${MOCK_BASE}/personas/alice.bsky.social/chat`)
    })

    it('builds correct persona list URL', async () => {
      const fetchMock = mockFetchJson([])
      await listPersonas()
      const url = fetchMock.mock.calls[0][0]
      expect(url).toBe(`${MOCK_BASE}/personas`)
    })

    it('strips trailing slash from base URL', async () => {
      configureBskyStats('https://example.com/', MOCK_KEY)
      const fetchMock = mockFetchJson({})
      await fetchStats(60)
      const url = fetchMock.mock.calls[0][0]
      expect(url).toBe('https://example.com/stats/60?top_n=10')
    })
  })

  // ---------------------------------------------------------------------------
  // Header injection
  // ---------------------------------------------------------------------------

  describe('header injection', () => {
    it('always includes X-Api-Key header', async () => {
      const fetchMock = mockFetchJson({})
      await fetchStats(60)
      const opts = fetchMock.mock.calls[0][1] as RequestInit
      const hdrs = opts.headers as Record<string, string>
      expect(hdrs['X-Api-Key']).toBe(MOCK_KEY)
    })

    it('includes Content-Type: application/json', async () => {
      const fetchMock = mockFetchJson({})
      await fetchStats(60)
      const opts = fetchMock.mock.calls[0][1] as RequestInit
      const hdrs = opts.headers as Record<string, string>
      expect(hdrs['Content-Type']).toBe('application/json')
    })

    it('POST requests include correct method and body', async () => {
      const fetchMock = mockFetchJson({handle: 'test.bsky.social'}, 201)
      await createPersona('test.bsky.social')
      const opts = fetchMock.mock.calls[0][1] as RequestInit
      expect(opts.method).toBe('POST')
      expect(JSON.parse(opts.body as string)).toEqual({
        handle: 'test.bsky.social',
      })
    })

    it('DELETE requests use correct method', async () => {
      const fn = jest.fn<typeof fetch>().mockResolvedValue({
        ok: true,
        status: 204,
        statusText: 'No Content',
        json: () => Promise.resolve(undefined),
        body: null,
      } as unknown as Response)
      global.fetch = fn
      await deleteChatHistory('alice.bsky.social')
      const opts = fn.mock.calls[0][1] as RequestInit
      expect(opts.method).toBe('DELETE')
    })
  })

  // ---------------------------------------------------------------------------
  // Error handling
  // ---------------------------------------------------------------------------

  describe('error handling', () => {
    it('throws BskyStatsError on HTTP 401', async () => {
      mockFetchJson({detail: 'Invalid API key'}, 401)
      await expect(fetchStats(60)).rejects.toThrow(BskyStatsError)
      try {
        await fetchStats(60)
      } catch (e) {
        const err = e as BskyStatsError
        expect(err.status).toBe(401)
        expect(err.detail).toBe('Invalid API key')
      }
    })

    it('throws BskyStatsError on HTTP 500', async () => {
      mockFetchJson({detail: 'Internal error'}, 500)
      await expect(fetchStats(60)).rejects.toThrow(BskyStatsError)
    })

    it('throws BskyStatsError on HTTP 400 with detail', async () => {
      mockFetchJson({detail: 'Invalid window 999. Valid: [60, 300, 600]'}, 400)
      try {
        await fetchStats(999)
      } catch (e) {
        const err = e as BskyStatsError
        expect(err.status).toBe(400)
        expect(err.detail).toContain('Invalid window')
      }
    })

    it('throws on network failure', async () => {
      mockFetchFailure('Failed to fetch')
      await expect(fetchStats(60)).rejects.toThrow(BskyStatsError)
      try {
        await fetchStats(60)
      } catch (e) {
        const err = e as BskyStatsError
        expect(err.status).toBe(0)
        expect(err.message).toContain('Network error')
      }
    })

    it('throws when client not configured', async () => {
      configureBskyStats('', '')
      await expect(fetchStats(60)).rejects.toThrow('not configured')
    })

    it('handles non-JSON error responses gracefully', async () => {
      const fn = jest.fn<typeof fetch>().mockResolvedValue({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        json: () => Promise.reject(new Error('not json')),
        body: null,
      } as unknown as Response)
      global.fetch = fn
      try {
        await fetchStats(60)
      } catch (e) {
        const err = e as BskyStatsError
        expect(err.status).toBe(502)
        expect(err.detail).toBeUndefined()
      }
    })

    it('throws 409 on duplicate persona creation', async () => {
      mockFetchJson({detail: 'Persona @test.bsky.social already exists'}, 409)
      try {
        await createPersona('test.bsky.social')
      } catch (e) {
        const err = e as BskyStatsError
        expect(err.status).toBe(409)
        expect(err.detail).toContain('already exists')
      }
    })

    it('throws 404 for unknown persona', async () => {
      mockFetchJson({detail: 'Persona @unknown not found'}, 404)
      try {
        await fetchPersonaStatus('unknown')
      } catch (e) {
        const err = e as BskyStatsError
        expect(err.status).toBe(404)
      }
    })
  })

  // ---------------------------------------------------------------------------
  // Response parsing
  // ---------------------------------------------------------------------------

  describe('response parsing', () => {
    it('returns typed WindowStats from fetchStats', async () => {
      const mockData = {
        window_seconds: 60,
        window_start: '2026-05-21T12:00:00Z',
        metrics: {
          post_count: 2241,
          user_count: 1500,
          like_count: 5000,
          repost_count: 300,
          reply_count: 800,
        },
        deltas: {
          post_count: 0.12,
          user_count: null,
          like_count: -0.05,
          repost_count: null,
          reply_count: 0.03,
        },
        top_liked: [
          {
            uri: 'at://did:plc:abc/app.bsky.feed.post/123',
            did: 'did:plc:abc',
            text: 'Hello world',
            count: 42,
            timestamp: '2026-05-21T12:00:00Z',
          },
        ],
        top_reposted: [],
        language_breakdown: {en: 0.65, ja: 0.12, pt: 0.08, other: 0.15},
      }
      mockFetchJson(mockData)
      const result = await fetchStats(60)
      expect(result.metrics.post_count).toBe(2241)
      expect(result.top_liked).toHaveLength(1)
      expect(result.top_liked[0].uri).toBe(
        'at://did:plc:abc/app.bsky.feed.post/123',
      )
      expect(result.language_breakdown.en).toBe(0.65)
      expect(result.deltas?.post_count).toBe(0.12)
    })

    it('returns typed PersonaInfo from createPersona', async () => {
      const mockData = {
        handle: 'test.bsky.social',
        display_name: 'Test User',
        status: 'loading',
        post_count: 0,
        reply_count: 0,
        last_corpus_update: null,
        avatar_url: null,
      }
      mockFetchJson(mockData, 201)
      const result = await createPersona('test.bsky.social')
      expect(result.handle).toBe('test.bsky.social')
      expect(result.status).toBe('loading')
    })

    it('returns typed ChatHistory from fetchChatHistory', async () => {
      const mockData = {
        handle: 'alice.bsky.social',
        messages: [
          {role: 'user', content: 'Hi!', created_at: '2026-05-21T12:00:00Z'},
          {
            role: 'assistant',
            content: 'Hey there!',
            created_at: '2026-05-21T12:00:01Z',
          },
        ],
      }
      mockFetchJson(mockData)
      const result = await fetchChatHistory('alice.bsky.social')
      expect(result.messages).toHaveLength(2)
      expect(result.messages[0].role).toBe('user')
      expect(result.messages[1].role).toBe('assistant')
    })
  })
})

// ---------------------------------------------------------------------------
// SSE parsing
// ---------------------------------------------------------------------------

describe('SSE event parsing', () => {
  it('parses a complete snapshot event', () => {
    const input =
      'event: snapshot\ndata: {"timestamp":"2026-05-21T12:00:00Z","windows":{},"velocity":{"current":0,"history":[]}}\n\n'
    const {events, remainder} = parseSSEChunk(input)
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('snapshot')
    const data = JSON.parse(events[0].data)
    expect(data.timestamp).toBe('2026-05-21T12:00:00Z')
    expect(remainder).toBe('')
  })

  it('parses an update event', () => {
    const input =
      'event: update\ndata: {"timestamp":"2026-05-21T12:00:02Z","windows":{},"velocity":{"current":5.2,"history":[1,2,3]}}\n\n'
    const {events} = parseSSEChunk(input)
    expect(events).toHaveLength(1)
    expect(events[0].event).toBe('update')
    const data = JSON.parse(events[0].data)
    expect(data.velocity.current).toBe(5.2)
  })

  it('parses multiple events in one chunk', () => {
    const input =
      'event: snapshot\ndata: {"a":1}\n\nevent: update\ndata: {"b":2}\n\n'
    const {events} = parseSSEChunk(input)
    expect(events).toHaveLength(2)
    expect(events[0].event).toBe('snapshot')
    expect(events[1].event).toBe('update')
  })

  it('handles incomplete event (no trailing newline)', () => {
    const input = 'event: update\ndata: {"partial":'
    const {events, remainder} = parseSSEChunk(input)
    expect(events).toHaveLength(0)
    expect(remainder).toContain('update')
  })

  it('handles empty input', () => {
    const {events, remainder} = parseSSEChunk('')
    expect(events).toHaveLength(0)
    expect(remainder).toBe('')
  })

  it('skips events with empty data', () => {
    const input = 'event: heartbeat\n\n'
    const {events} = parseSSEChunk(input)
    // heartbeat has no data line, so no complete event
    expect(events).toHaveLength(0)
  })

  it('handles malformed JSON in data gracefully (parser returns raw string)', () => {
    const input = 'event: update\ndata: {not valid json}\n\n'
    const {events} = parseSSEChunk(input)
    expect(events).toHaveLength(1)
    expect(events[0].data).toBe('{not valid json}')
    // Caller is responsible for JSON.parse — this tests the parser layer
    expect(() => JSON.parse(events[0].data)).toThrow()
  })
})

// ---------------------------------------------------------------------------
// Chat SSE streaming (sendChatMessage)
// ---------------------------------------------------------------------------

describe('sendChatMessage', () => {
  it('sends POST with correct URL, headers, and body', () => {
    const chunks = [
      'event: token\ndata: {"text":"Hello"}\n\n',
      'event: done\ndata: {"full_text":"Hello","context_posts_used":10}\n\n',
    ]
    let chunkIndex = 0

    const mockReader = {
      read: jest
        .fn<() => Promise<{done: boolean; value: Uint8Array | undefined}>>()
        .mockImplementation(() => {
          if (chunkIndex < chunks.length) {
            const chunk = new TextEncoder().encode(chunks[chunkIndex++])
            return Promise.resolve({done: false, value: chunk})
          }
          return Promise.resolve({done: true, value: undefined})
        }),
    }

    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      status: 200,
      body: {getReader: () => mockReader},
    } as unknown as Response)
    global.fetch = fetchMock

    const callbacks: ChatStreamCallbacks = {
      onToken: jest.fn(),
      onDone: jest.fn(),
      onError: jest.fn(),
    }

    sendChatMessage('test.bsky.social', 'Hi there', callbacks)

    // Verify fetch was called with correct params
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe(`${MOCK_BASE}/personas/test.bsky.social/chat`)
    expect((opts as RequestInit).method).toBe('POST')
    expect(JSON.parse((opts as RequestInit).body as string)).toEqual({
      message: 'Hi there',
    })
  })

  it('calls onError when HTTP response is not ok', async () => {
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({detail: 'Persona not ready'}),
      body: null,
    } as unknown as Response)
    global.fetch = fetchMock

    const callbacks: ChatStreamCallbacks = {
      onToken: jest.fn(),
      onDone: jest.fn(),
      onError: jest.fn(),
    }

    sendChatMessage('test.bsky.social', 'Hi', callbacks)

    // Wait for the async error handling
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(callbacks.onError).toHaveBeenCalledWith('Persona not ready')
  })

  it('returns an AbortController for cancellation', () => {
    mockFetchJson({}, 200)
    const callbacks: ChatStreamCallbacks = {
      onToken: jest.fn(),
      onDone: jest.fn(),
      onError: jest.fn(),
    }
    const controller = sendChatMessage('test.bsky.social', 'Hi', callbacks)
    expect(controller).toBeInstanceOf(AbortController)
    expect(controller.signal.aborted).toBe(false)
    controller.abort()
    expect(controller.signal.aborted).toBe(true)
  })
})
