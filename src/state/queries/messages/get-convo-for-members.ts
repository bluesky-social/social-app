import {ChatBskyConvoGetConvoForMembers} from '@atproto/api'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {DM_SERVICE_HEADERS} from '#/state/queries/messages/const'
import {useAgent} from '#/state/session'
import {STALE} from '..'
import {RQKEY as CONVO_KEY} from './conversation'

const RQKEY_ROOT = 'convo-for-user'
export const RQKEY = (did: string) => [RQKEY_ROOT, did]

export function useGetConvoForMembers({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: ChatBskyConvoGetConvoForMembers.OutputSchema) => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationFn: async (members: string[]) => {
      const {data} = await agent.api.chat.bsky.convo.getConvoForMembers(
        {members: members},
        {headers: DM_SERVICE_HEADERS},
      )

      return data
    },
    onSuccess: data => {
      queryClient.setQueryData(CONVO_KEY(data.convo.id), data.convo)
      onSuccess?.(data)
    },
    onError: error => {
      logger.error(error)
      onError?.(error)
    },
  })
}

/**
 * Gets the conversation ID for a given DID. Returns null if it's not possible to message them.
 */
export function useMaybeConvoForUser(did: string) {
  const agent = useAgent()

  return useQuery({
    queryKey: RQKEY(did),
    queryFn: async () => {
      const convo = await agent.api.chat.bsky.convo
        .getConvoForMembers({members: [did]}, {headers: DM_SERVICE_HEADERS})
        .catch(() => ({success: null}))

      if (convo.success) {
        return convo.data.convo
      } else {
        return null
      }
    },
    staleTime: STALE.INFINITY,
  })
}
