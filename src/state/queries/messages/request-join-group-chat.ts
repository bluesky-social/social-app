import {type ChatBskyGroupRequestJoin} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {logger} from '#/logger'
import {useAgent, useSession} from '#/state/session'
import {RQKEY_ROOT as REQUESTS_RQKEY_ROOT} from './list-conversation-requests'

export function useRequestJoinGroupChat({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: ChatBskyGroupRequestJoin.OutputSchema) => void
  onError?: (error: Error) => void
} = {}) {
  const agent = useAgent()
  const queryClient = useQueryClient()
  const {hasSession} = useSession()

  return useMutation({
    mutationFn: async ({code}: {code: string}) => {
      if (!hasSession) throw new Error('Must be logged in to join')
      if (!code) throw new Error('No invite code')

      const res = await agent.chat.bsky.group.requestJoin(
        {code},
        {headers: DM_SERVICE_HEADERS},
      )
      return res.data
    },
    onSuccess: data => {
      void queryClient.invalidateQueries({queryKey: [REQUESTS_RQKEY_ROOT]})
      onSuccess?.(data)
    },
    onError: error => {
      logger.error('Failed to join group chat', {safeMessage: error})
      onError?.(error)
    },
  })
}
