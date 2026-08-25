import {type DidString} from '@atproto/syntax'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useChatClient} from '#/state/session'
import {chat} from '#/lexicons'
import {precacheConvoQuery} from './conversation'

export function useCreateGroupChat({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: chat.bsky.group.createGroup.$OutputBody) => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()
  const client = useChatClient()

  return useMutation({
    mutationFn: async ({name, members}: {name: string; members: string[]}) => {
      return await client.call(chat.bsky.group.createGroup, {
        name,
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
