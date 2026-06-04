import {type ChatBskyGroupWithdrawJoinRequest} from '@atproto/api'
import {useMutation} from '@tanstack/react-query'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {logger} from '#/logger'
import {useAgent, useSession} from '#/state/session'

export function useWithdrawJoinGroupChatRequest({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: ChatBskyGroupWithdrawJoinRequest.OutputSchema) => void
  onError?: (error: Error) => void
} = {}) {
  const agent = useAgent()
  const {hasSession} = useSession()

  return useMutation({
    mutationFn: async ({convoId}: {convoId: string}) => {
      if (!hasSession)
        throw new Error('Must be logged in to withdraw a join request')
      if (!convoId) throw new Error('No convoId provided')

      const res = await agent.chat.bsky.group.withdrawJoinRequest(
        {convoId},
        {headers: DM_SERVICE_HEADERS},
      )
      return res.data
    },
    onSuccess: data => {
      onSuccess?.(data)
    },
    onError: error => {
      logger.error('Failed to withdraw join request', {safeMessage: error})
      onError?.(error)
    },
  })
}
