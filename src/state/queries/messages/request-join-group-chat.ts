import {useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useChatClient, useSession} from '#/state/session'
import * as ChatBskyGroupRequestJoin from '#/lexicons/chat/bsky/group/requestJoin'
import {RQKEY_ROOT as REQUESTS_RQKEY_ROOT} from './list-conversation-requests'

export function useRequestJoinGroupChat({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: ChatBskyGroupRequestJoin.$OutputBody) => void
  onError?: (error: Error) => void
} = {}) {
  const client = useChatClient()
  const queryClient = useQueryClient()
  const {hasSession} = useSession()

  return useMutation({
    mutationFn: async ({code}: {code: string}) => {
      if (!hasSession) throw new Error('Must be logged in to join')
      if (!code) throw new Error('No invite code')

      return await client.call(ChatBskyGroupRequestJoin, {code})
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
