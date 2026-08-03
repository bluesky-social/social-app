import {ChatBskyConvoDefs, type ChatBskyGroupEditGroup} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useChatClient} from '#/state/session'
import {chat} from '#/lexicons'
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
    onSuccess?: (data: ChatBskyGroupEditGroup.OutputSchema) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const client = useChatClient()

  return useMutation({
    mutationFn: async ({name: groupName}: {name: string}) => {
      if (!convoId) throw new Error('No convoId provided')
      return await client.call(chat.bsky.group.editGroup, {
        convoId,
        name: groupName,
      })
    },
    onMutate: ({name: groupName}) => {
      if (!convoId) return
      return updateConvoOptimistic(queryClient, convoId, prev => {
        if (!ChatBskyConvoDefs.isGroupConvo(prev.kind)) return undefined
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
