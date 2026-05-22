/**
 * TanStack Query hooks for the Bluesky Feed Consumer backend.
 *
 * Provides reactive data access for stats, personas, and chat.
 */
import {useCallback, useEffect, useRef} from 'react'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'

import {
  type ChatHistory,
  type ChatMessage,
  createPersona,
  deleteChatHistory,
  fetchChatHistory,
  fetchPersonaStatus,
  fetchStats,
  listPersonas,
  type PersonaInfo,
  type PersonaStatusInfo,
  sendChatMessage,
  type StatsSnapshot,
  type WindowStats,
} from '#/lib/api/bsky-stats'
import {
  connectStatsSSE,
  type StatsSSEConnection,
} from '#/lib/api/bsky-stats-sse'

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const BSKY_STATS_KEYS = {
  stats: (window: number, topN?: number) =>
    ['bsky-stats', 'stats', window, topN ?? 10] as const,
  statsStream: () => ['bsky-stats', 'stream'] as const,
  personas: () => ['bsky-stats', 'personas'] as const,
  personaStatus: (handle: string) =>
    ['bsky-stats', 'persona-status', handle] as const,
  chatHistory: (handle: string) =>
    ['bsky-stats', 'chat-history', handle] as const,
}

// ---------------------------------------------------------------------------
// Stats queries
// ---------------------------------------------------------------------------

export function useStatsQuery(
  window: number,
  topN: number = 10,
): UseQueryResult<WindowStats> {
  return useQuery({
    queryKey: BSKY_STATS_KEYS.stats(window, topN),
    queryFn: () => fetchStats(window, topN),
    refetchOnWindowFocus: true,
    staleTime: 5_000,
  })
}

// ---------------------------------------------------------------------------
// Live stats stream
// ---------------------------------------------------------------------------

/**
 * Subscribe to the live SSE stats stream.
 * Writes snapshot data directly into the query cache so any component
 * using useStatsQuery gets updates automatically.
 *
 * @param apiKey  The API key for SSE authentication.
 * @param enabled Whether the stream should be active.
 */
export function useStatsStream(apiKey: string, enabled: boolean = true) {
  const queryClient = useQueryClient()
  const connectionRef = useRef<StatsSSEConnection | null>(null)

  const handleData = useCallback(
    (data: StatsSnapshot) => {
      // Update the stream cache (useful for velocity data)
      queryClient.setQueryData(BSKY_STATS_KEYS.statsStream(), data)

      // Also update individual window caches
      for (const [windowKey, windowStats] of Object.entries(data.windows)) {
        const window = Number(windowKey)
        queryClient.setQueryData(BSKY_STATS_KEYS.stats(window), windowStats)
      }
    },
    [queryClient],
  )

  useEffect(() => {
    if (!enabled || !apiKey) return

    const connection = connectStatsSSE(apiKey, {
      onSnapshot: handleData,
      onUpdate: handleData,
      onError: _err => {
        // Errors are handled by the SSE client (auto-reconnect).
        // Could add logging here in future.
      },
    })
    connectionRef.current = connection

    return () => {
      connection.close()
      connectionRef.current = null
    }
  }, [apiKey, enabled, handleData])

  return {
    /** The latest full snapshot from the stream. */
    data: queryClient.getQueryData<StatsSnapshot>(
      BSKY_STATS_KEYS.statsStream(),
    ),
    /** Close the stream early. */
    close: () => connectionRef.current?.close(),
  }
}

// ---------------------------------------------------------------------------
// Persona queries
// ---------------------------------------------------------------------------

export function usePersonasQuery() {
  return useQuery({
    queryKey: BSKY_STATS_KEYS.personas(),
    queryFn: listPersonas,
    staleTime: 30_000,
  })
}

export function usePersonaStatusQuery(
  handle: string,
  opts?: {enabled?: boolean},
): UseQueryResult<PersonaStatusInfo> {
  return useQuery({
    queryKey: BSKY_STATS_KEYS.personaStatus(handle),
    queryFn: () => fetchPersonaStatus(handle),
    enabled: opts?.enabled ?? true,
    refetchInterval: query => {
      // Poll while loading, stop once ready or errored
      if (query.state.data?.status === 'loading') return 3_000
      return false
    },
  })
}

// ---------------------------------------------------------------------------
// Persona mutations
// ---------------------------------------------------------------------------

export function useRegisterPersonaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (handle: string) => createPersona(handle),
    onSuccess: (_data: PersonaInfo, handle: string) => {
      queryClient.invalidateQueries({queryKey: BSKY_STATS_KEYS.personas()})
      queryClient.invalidateQueries({
        queryKey: BSKY_STATS_KEYS.personaStatus(handle),
      })
    },
  })
}

// ---------------------------------------------------------------------------
// Chat queries
// ---------------------------------------------------------------------------

export function useChatHistoryQuery(
  handle: string,
  opts?: {enabled?: boolean},
): UseQueryResult<ChatHistory> {
  return useQuery({
    queryKey: BSKY_STATS_KEYS.chatHistory(handle),
    queryFn: () => fetchChatHistory(handle),
    enabled: opts?.enabled ?? true,
  })
}

export function useDeleteChatMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (handle: string) => deleteChatHistory(handle),
    onSuccess: (_data: void, handle: string) => {
      queryClient.setQueryData(BSKY_STATS_KEYS.chatHistory(handle), {
        handle,
        messages: [],
      })
    },
  })
}

// ---------------------------------------------------------------------------
// Chat streaming mutation
// ---------------------------------------------------------------------------

/**
 * Hook for sending a chat message with streaming AI response.
 *
 * Returns a function that accepts a message string.
 * The streaming tokens are accumulated and the chat history cache
 * is optimistically updated as tokens arrive.
 */
export function useSendChatMessage(handle: string) {
  const queryClient = useQueryClient()
  const controllerRef = useRef<AbortController | null>(null)

  const send = useCallback(
    (message: string) => {
      // Optimistically add the user message to the cache
      queryClient.setQueryData<ChatHistory>(
        BSKY_STATS_KEYS.chatHistory(handle),
        old => {
          const userMsg: ChatMessage = {
            role: 'user',
            content: message,
            created_at: new Date().toISOString(),
          }
          return {
            handle,
            messages: [...(old?.messages ?? []), userMsg],
          }
        },
      )

      // Add a placeholder for the assistant response
      queryClient.setQueryData<ChatHistory>(
        BSKY_STATS_KEYS.chatHistory(handle),
        old => {
          const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: '',
            created_at: new Date().toISOString(),
          }
          return {
            handle,
            messages: [...(old?.messages ?? []), assistantMsg],
          }
        },
      )

      const controller = sendChatMessage(handle, message, {
        onToken: (text: string) => {
          // Append token to the last (assistant) message
          queryClient.setQueryData<ChatHistory>(
            BSKY_STATS_KEYS.chatHistory(handle),
            old => {
              if (!old) return old
              const msgs = [...old.messages]
              const last = msgs[msgs.length - 1]
              if (last?.role === 'assistant') {
                msgs[msgs.length - 1] = {
                  ...last,
                  content: last.content + text,
                }
              }
              return {...old, messages: msgs}
            },
          )
        },
        onDone: (_fullText: string, _contextPostsUsed: number) => {
          // Refetch to get the server-authoritative history
          queryClient.invalidateQueries({
            queryKey: BSKY_STATS_KEYS.chatHistory(handle),
          })
        },
        onError: (error: string) => {
          // Remove the placeholder assistant message on error
          queryClient.setQueryData<ChatHistory>(
            BSKY_STATS_KEYS.chatHistory(handle),
            old => {
              if (!old) return old
              const msgs = [...old.messages]
              const last = msgs[msgs.length - 1]
              if (last?.role === 'assistant' && last.content === '') {
                msgs.pop()
              }
              return {...old, messages: msgs}
            },
          )
          // TODO: expose error to UI via a state callback
          console.error('Chat stream error:', error)
        },
      })

      controllerRef.current = controller
    },
    [handle, queryClient],
  )

  const cancel = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
  }, [])

  return {send, cancel}
}
