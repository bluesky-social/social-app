import {AtpAgent} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

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

export function useJoinLinkPreviewsQuery({
  codes,
  hasSession,
}: {
  codes?: string[]
  hasSession: boolean
}) {
  const agent = useAgent()

  return useQuery({
    queryKey: createJoinLinkPreviewQueryKey({codes: codes ?? [], hasSession}),
    queryFn: async () => {
      if (!codes) throw new Error('No invite code')
      try {
        const previewAgent = new AtpAgent({service: CHAT_SERVICE})
        const res = hasSession
          ? await agent.chat.bsky.group.getJoinLinkPreviews(
              {codes},
              {headers: DM_SERVICE_HEADERS},
            )
          : await previewAgent.chat.bsky.group.getJoinLinkPreviews({codes})
        return res.data
      } catch (error) {
        logger.error('Failed to fetch join link preview', {safeMessage: error})
        throw error
      }
    },
    enabled: codes != null && codes.length > 0,
    staleTime: STALE.SECONDS.FIFTEEN,
  })
}
