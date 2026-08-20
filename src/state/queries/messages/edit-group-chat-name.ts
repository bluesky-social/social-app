import {useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useChatClient} from '#/state/session'
import * as ChatBskyConvoDefs from '#/lexicons/chat/bsky/convo/defs'
import * as ChatBskyGroupEditGroup from '#/lexicons/chat/bsky/group/editGroup'
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
    onSuccess?: (data: ChatBskyGroupEditGroup.$OutputBody) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const client = useChatClient()

  return useMutation({
    mutationFn: async ({name: groupName}: {name: string}) => {
      if (!convoId) throw new Error('No convoId provided')
      return await client.call(ChatBskyGroupEditGroup, {
        convoId,
        name: groupName,
      })
    },
    onMutate: ({name: groupName}) => {
      if (!convoId) return
      return updateConvoOptimistic(queryClient, convoId, prev => {
        if (!bsky.isType(ChatBskyConvoDefs.groupConvo, prev.kind))
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
