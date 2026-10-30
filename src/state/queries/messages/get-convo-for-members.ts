import {type DidString} from '@atproto/syntax'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useChatClient} from '#/state/session'
import {chat} from '#/lexicons'
import {precacheConvoQuery} from './conversation'

export function useGetConvoForMembers({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: chat.bsky.convo.getConvoForMembers.$OutputBody) => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()
  const client = useChatClient()

  return useMutation({
    mutationFn: async (members: string[]) => {
      return await client.call(chat.bsky.convo.getConvoForMembers, {
        // callers pass already-resolved actor dids
        members: members as DidString[],
      })
    },
    onSuccess: data => {
      precacheConvoQuery(queryClient, data.convo)
      onSuccess?.(data)
    },
    onError: error => {
      logger.error(error)
      onError?.(error)
    },
  })
}
