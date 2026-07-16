import {useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useChatClient} from '#/state/session'
import {chat} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {
  rollbackConvoOptimistic,
  updateConvoOptimistic,
} from './utils/convo-cache'

export function useEditGroupChatName(
  convoId: string | undefined,
  {
    onSuccess,
    onError,
  }: {
    onSuccess?: (data: chat.bsky.group.editGroup.$OutputBody) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const chatClient = useChatClient()

  return useMutation({
    mutationFn: async ({name: groupName}: {name: string}) => {
      if (!convoId) throw new Error('No convoId provided')
      const data = await chatClient.call(chat.bsky.group.editGroup, {
        convoId,
        name: groupName,
      })
      return data
    },
    onMutate: ({name: groupName}) => {
      if (!convoId) return
      return updateConvoOptimistic(queryClient, convoId, prev => {
        if (!bsky.isType(chat.bsky.convo.defs.groupConvo, prev.kind))
          return undefined
        return {
          ...prev,
          kind: {...prev.kind, name: groupName},
        }
      })
    },
    onSuccess: data => {
      onSuccess?.(data)
    },
    onError: (e, _variables, context) => {
      logger.error(e)
      if (convoId && context) {
        rollbackConvoOptimistic(queryClient, convoId, context)
      }
      onError?.(e)
    },
  })
}
