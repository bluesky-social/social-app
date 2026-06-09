import {useCallback} from 'react'
import {
  type $Typed,
  AtpAgent,
  ChatBskyGroupDefs,
  type ChatBskyGroupGetJoinLinkPreviews,
} from '@atproto/api'
import {type QueryClient, useQuery, useQueryClient} from '@tanstack/react-query'

import {CHAT_SERVICE, DM_SERVICE_HEADERS} from '#/lib/constants'
import {logger} from '#/logger'
import {STALE} from '#/state/queries/index'
import {createQueryKey, type StructuredQueryKey} from '#/state/queries/util'
import {useAgent} from '#/state/session'

/**
 * The three preview shapes we currently support. Excludes the `{$type: string}`
 * open-union fallback for unrecognized future variants - use
 * `ChatInvitePreview` for that.
 */
export type KnownChatInvitePreview =
  | $Typed<ChatBskyGroupDefs.JoinLinkPreviewView>
  | $Typed<ChatBskyGroupDefs.DisabledJoinLinkPreviewView>
  | $Typed<ChatBskyGroupDefs.InvalidJoinLinkPreviewView>

/**
 * The full open-union shape, including the `{$type: string}` fallback for
 * future variants.
 */
export type ChatInvitePreview = KnownChatInvitePreview | {$type: string}

/**
 * Narrows a preview to one of the three known variants, filtering out the
 * `{$type: string}` open-union fallback for unrecognized future shapes.
 */
export function isKnownJoinLinkPreview(
  preview: unknown,
): preview is KnownChatInvitePreview {
  return (
    ChatBskyGroupDefs.isJoinLinkPreviewView(preview) ||
    ChatBskyGroupDefs.isDisabledJoinLinkPreviewView(preview) ||
    ChatBskyGroupDefs.isInvalidJoinLinkPreviewView(preview)
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

async function fetchJoinLinkPreviews({
  agent,
  codes,
  hasSession,
}: {
  agent: AtpAgent
  codes: string[]
  hasSession: boolean
}) {
  const previewAgent = new AtpAgent({service: CHAT_SERVICE})
  const res = hasSession
    ? await agent.chat.bsky.group.getJoinLinkPreviews(
        {codes},
        {headers: DM_SERVICE_HEADERS},
      )
    : await previewAgent.chat.bsky.group.getJoinLinkPreviews({codes})
  return res.data
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
  initialData?: ChatBskyGroupGetJoinLinkPreviews.OutputSchema
}) {
  const agent = useAgent()

  return useQuery({
    queryKey: createJoinLinkPreviewQueryKey({codes: codes ?? [], hasSession}),
    queryFn: async () => {
      if (!codes) throw new Error('No invite code')
      try {
        return await fetchJoinLinkPreviews({agent, codes, hasSession})
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
  const agent = useAgent()
  const queryClient = useQueryClient()

  return ({codes, hasSession}: {codes: string[]; hasSession: boolean}) => {
    return queryClient.prefetchQuery({
      queryKey: createJoinLinkPreviewQueryKey({codes, hasSession}),
      queryFn: () => fetchJoinLinkPreviews({agent, codes, hasSession}),
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
  const agent = useAgent()
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
            fetchJoinLinkPreviews({agent, codes: [code], hasSession}),
          staleTime: STALE.SECONDS.FIFTEEN,
        })
        const found = data.joinLinkPreviews[0]
        return isKnownJoinLinkPreview(found) ? found : undefined
      } catch (error) {
        logger.error('Failed to fetch join link preview', {safeMessage: error})
        return undefined
      }
    },
    [agent, queryClient],
  )
}
