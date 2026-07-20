import {useMutation, useQueryClient} from '@tanstack/react-query'

import {useChatClient} from '#/state/session'
import {chat} from '#/lexicons'
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
    onSuccess?: (data: chat.bsky.convo.muteConvo.$OutputBody) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const chatClient = useChatClient()

  return useMutation({
    mutationFn: async ({mute}: {mute: boolean}) => {
      if (!convoId) throw new Error('No convoId provided')
      if (mute) {
        const data = await chatClient.call(chat.bsky.convo.muteConvo, {convoId})
        return data
      } else {
        const data = await chatClient.call(chat.bsky.convo.unmuteConvo, {
          convoId,
        })
        return data
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
