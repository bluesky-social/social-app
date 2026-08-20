import {useMutation, useQueryClient} from '@tanstack/react-query'

import {useChatClient} from '#/state/session'
import * as ChatBskyConvoMuteConvo from '#/lexicons/chat/bsky/convo/muteConvo'
import * as ChatBskyConvoUnmuteConvo from '#/lexicons/chat/bsky/convo/unmuteConvo'
import {
  rollbackConvoOptimistic,
  updateConvoOptimistic,
} from './utils/convo-cache'

export function useMuteConvo(
  convoId: string | undefined,
  {
    onSuccess,
    onError,
  }: {
    onSuccess?: (data: ChatBskyConvoMuteConvo.$OutputBody) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const client = useChatClient()

  return useMutation({
    mutationFn: async ({mute}: {mute: boolean}) => {
      if (!convoId) throw new Error('No convoId provided')
      if (mute) {
        return await client.call(ChatBskyConvoMuteConvo, {convoId})
      } else {
        return await client.call(ChatBskyConvoUnmuteConvo, {convoId})
      }
    },
    onMutate: ({mute}) => {
      if (!convoId) return
      return updateConvoOptimistic(queryClient, convoId, prev => ({
        ...prev,
        muted: mute,
      }))
    },
    onSuccess: data => {
      onSuccess?.(data)
    },
    onError: (e, _variables, context) => {
      if (convoId && context) {
        rollbackConvoOptimistic(queryClient, convoId, context)
      }
      onError?.(e)
    },
  })
}
