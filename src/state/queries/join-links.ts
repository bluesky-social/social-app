import {useCallback} from 'react'
import {type $Typed, type Client} from '@atproto/lex'
import {toDatetimeString} from '@atproto/syntax'
import {type QueryClient, useQuery, useQueryClient} from '@tanstack/react-query'

import {CHAT_SERVICE} from '#/lib/constants'
import {createLexClient} from '#/lib/lexClient'
import {logger} from '#/logger'
import {STALE} from '#/state/queries/index'
import {createQueryKey, type StructuredQueryKey} from '#/state/queries/util'
import {useMaybeChatClient} from '#/state/session'
import {chat} from '#/lexicons'
import * as bsky from '#/types/bsky'

/**
 * Unauthenticated client pointed directly at the chat service, for the
 * logged-out join-link preview path (mirrors the old public `AtpAgent` at
 * `CHAT_SERVICE`). Chat requires no `atproto-proxy` here since we hit the
 * service directly.
 */
let publicChatClient: Client | undefined
function getPublicChatClient(): Client {
  publicChatClient ??= createLexClient({service: CHAT_SERVICE})
  return publicChatClient
}

/**
 * The three preview shapes we currently support. Excludes the `{$type: string}`
 * open-union fallback for unrecognized future variants - use
 * `ChatInvitePreview` for that.
 */
export type KnownChatInvitePreview =
  | $Typed<chat.bsky.group.defs.JoinLinkPreviewView>
  | $Typed<chat.bsky.group.defs.DisabledJoinLinkPreviewView>
  | $Typed<chat.bsky.group.defs.InvalidJoinLinkPreviewView>

/**
 * The full open-union shape, including the open-union fallback for future
 * variants. Sourced from the endpoint's output element type so it matches the
 * lex `Unknown$TypedObject` fallback exactly.
 */
export type ChatInvitePreview =
  chat.bsky.group.getJoinLinkPreviews.$OutputBody['joinLinkPreviews'][number]

/**
 * Narrows a preview to one of the three known variants, filtering out the
 * `{$type: string}` open-union fallback for unrecognized future shapes.
 */
export function isKnownJoinLinkPreview(
  preview: unknown,
): preview is KnownChatInvitePreview {
  return (
    bsky.isType(chat.bsky.group.defs.joinLinkPreviewView, preview) ||
    bsky.isType(chat.bsky.group.defs.disabledJoinLinkPreviewView, preview) ||
    bsky.isType(chat.bsky.group.defs.invalidJoinLinkPreviewView, preview)
  )
}

const joinLinkPreviewQueryKeyRoot = 'join-link-preview'

export const createJoinLinkPreviewQueryKey = (args: {
  codes: string[]
  hasSession: boolean
}) =>
  createQueryKey(joinLinkPreviewQueryKeyRoot, args, {
    persistedVersion: 1,
  })

/**
 * Invalidate any join link preview queries whose `codes` include the given
 * code. Use this when a link's state changes (e.g. it's disabled) so cached
 * previews refetch and reflect the new state.
 */
export function invalidateJoinLinkPreviewsForCode(
  queryClient: QueryClient,
  code: string,
) {
  return queryClient.invalidateQueries({
    predicate: query => {
      const [root, args] = query.queryKey as Partial<
        StructuredQueryKey<{codes?: string[]}>
      >
      return (
        root === joinLinkPreviewQueryKeyRoot &&
        Array.isArray(args?.codes) &&
        args.codes.includes(code)
      )
    },
  })
}

/**
 * Optimistically set whether the viewer has requested to join the link with the
 * given code, across any cached join link preview queries. Used right after a
 * successful join request (requested = true) or withdrawal (requested = false)
 * so the UI ("Requested" vs "Request to join") updates immediately, without
 * waiting on a server refetch that can lag behind the write.
 */
export function setJoinLinkPreviewRequestedForCode(
  queryClient: QueryClient,
  code: string,
  requested: boolean,
) {
  queryClient.setQueriesData<chat.bsky.group.getJoinLinkPreviews.$OutputBody>(
    {
      predicate: query => {
        const [root, args] = query.queryKey as Partial<
          StructuredQueryKey<{codes?: string[]}>
        >
        return (
          root === joinLinkPreviewQueryKeyRoot &&
          Array.isArray(args?.codes) &&
          args.codes.includes(code)
        )
      },
    },
    old => {
      if (!old) return old
      return {
        ...old,
        joinLinkPreviews: old.joinLinkPreviews.map(preview => {
          if (
            bsky.isType(chat.bsky.group.defs.joinLinkPreviewView, preview) &&
            preview.code === code
          ) {
            return {
              ...preview,
              viewer: {
                ...preview.viewer,
                requestedAt: requested
                  ? toDatetimeString(new Date())
                  : undefined,
              },
            }
          }
          return preview
        }),
      }
    },
  )
}

/**
 * Invalidate any join link preview queries that resolved to the given convo.
 * The code isn't always known to the viewer (e.g. when they're a regular
 * member), so we match on the convoId carried by the resolved preview instead.
 * Use this when the viewer's membership changes (e.g. they leave or are removed)
 * so cached previews refetch and reflect their new viewer state.
 */
export function invalidateJoinLinkPreviewsForConvo(
  queryClient: QueryClient,
  convoId: string,
) {
  return queryClient.invalidateQueries({
    predicate: query => {
      const [root] = query.queryKey
      if (root !== joinLinkPreviewQueryKeyRoot) return false
      const data = query.state.data as
        | chat.bsky.group.getJoinLinkPreviews.$OutputBody
        | undefined
      return (
        data?.joinLinkPreviews.some(
          preview =>
            bsky.isType(chat.bsky.group.defs.joinLinkPreviewView, preview) &&
            preview.convoId === convoId,
        ) ?? false
      )
    },
  })
}

async function fetchJoinLinkPreviews({
  chatClient,
  codes,
  hasSession,
}: {
  /**
   * Authed chat client (proxied to the chat service via `atproto-proxy`), or
   * null when logged out - the logged-out path uses the public chat client.
   */
  chatClient: Client | null
  codes: string[]
  hasSession: boolean
}) {
  const client = hasSession && chatClient ? chatClient : getPublicChatClient()
  return await client.call(chat.bsky.group.getJoinLinkPreviews, {codes})
}

export function useJoinLinkPreviewsQuery({
  codes,
  hasSession,
  staleTime = STALE.MINUTES.ONE,
  initialData,
}: {
  codes?: string[]
  hasSession: boolean
  staleTime?: number
  /**
   * Seed the query with an already-known preview (e.g. a DM message embed
   * already carries the resolved view), avoiding a duplicate fetch.
   */
  initialData?: chat.bsky.group.getJoinLinkPreviews.$OutputBody
}) {
  const chatClient = useMaybeChatClient()

  return useQuery({
    queryKey: createJoinLinkPreviewQueryKey({codes: codes ?? [], hasSession}),
    queryFn: async () => {
      if (!codes) throw new Error('No invite code')
      try {
        return await fetchJoinLinkPreviews({chatClient, codes, hasSession})
      } catch (error) {
        logger.error('Failed to fetch join link preview', {safeMessage: error})
        throw error
      }
    },
    enabled: codes != null && codes.length > 0,
    staleTime,
    initialData,
  })
}

export function usePrefetchJoinLinkPreviews() {
  const chatClient = useMaybeChatClient()
  const queryClient = useQueryClient()

  return ({codes, hasSession}: {codes: string[]; hasSession: boolean}) => {
    return queryClient.prefetchQuery({
      queryKey: createJoinLinkPreviewQueryKey({codes, hasSession}),
      queryFn: () => fetchJoinLinkPreviews({chatClient, codes, hasSession}),
      staleTime: STALE.SECONDS.FIFTEEN,
    })
  }
}

/**
 * Imperatively fetch (or read from cache) a single join link preview by code.
 * Used when sending a DM invite embed so we can build an optimistic view.
 * Returns undefined if the preview can't be resolved.
 */
export function useGetJoinLinkPreview() {
  const chatClient = useMaybeChatClient()
  const queryClient = useQueryClient()

  return useCallback(
    async ({
      code,
      hasSession,
    }: {
      code: string
      hasSession: boolean
    }): Promise<KnownChatInvitePreview | undefined> => {
      try {
        const data = await queryClient.fetchQuery({
          queryKey: createJoinLinkPreviewQueryKey({codes: [code], hasSession}),
          queryFn: () =>
            fetchJoinLinkPreviews({chatClient, codes: [code], hasSession}),
          staleTime: STALE.SECONDS.FIFTEEN,
        })
        const found = data.joinLinkPreviews[0]
        return isKnownJoinLinkPreview(found) ? found : undefined
      } catch (error) {
        logger.error('Failed to fetch join link preview', {safeMessage: error})
        return undefined
      }
    },
    [chatClient, queryClient],
  )
}
