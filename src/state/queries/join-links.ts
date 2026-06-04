import {useCallback} from 'react'
import {
  AtpAgent,
  type BskyAgent,
  type ChatBskyGroupDefs,
  type ChatBskyGroupGetJoinLinkPreviews,
} from '@atproto/api'
import {useQuery, useQueryClient} from '@tanstack/react-query'

import {CHAT_SERVICE, DM_SERVICE_HEADERS} from '#/lib/constants'
import {logger} from '#/logger'
import {STALE} from '#/state/queries/index'
import {createQueryKey} from '#/state/queries/util'
import {useAgent} from '#/state/session'

const joinLinkPreviewQueryKeyRoot = 'join-link-preview'

export const createJoinLinkPreviewQueryKey = (args: {
  codes: string[]
  hasSession: boolean
}) =>
  createQueryKey(joinLinkPreviewQueryKeyRoot, args, {
    persistedVersion: 1,
  })

async function fetchJoinLinkPreviews({
  agent,
  codes,
  hasSession,
}: {
  agent: BskyAgent
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
      staleTime: STALE.MINUTES.ONE,
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
    }): Promise<ChatBskyGroupDefs.JoinLinkPreviewView | undefined> => {
      try {
        const data = await queryClient.fetchQuery({
          queryKey: createJoinLinkPreviewQueryKey({codes: [code], hasSession}),
          queryFn: () =>
            fetchJoinLinkPreviews({agent, codes: [code], hasSession}),
          staleTime: STALE.MINUTES.ONE,
        })
        return data.joinLinkPreviews[0]
      } catch (error) {
        logger.error('Failed to fetch join link preview', {safeMessage: error})
        return undefined
      }
    },
    [agent, queryClient],
  )
}
