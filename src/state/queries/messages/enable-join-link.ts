import {useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {invalidateJoinLinkPreviewsForCode} from '#/state/queries/join-links'
import {useChatClient} from '#/state/session'
import {chat} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {
  rollbackConvoOptimistic,
  updateConvoOptimistic,
} from './utils/convo-cache'

export function useEnableJoinLink(
  convoId: string | undefined,
  {
    onSuccess,
    onError,
  }: {
    onSuccess?: (data: chat.bsky.group.enableJoinLink.$OutputBody) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const chatClient = useChatClient()

  return useMutation({
    mutationFn: async () => {
      if (!convoId) throw new Error('No convoId provided')
      const data = await chatClient.call(chat.bsky.group.enableJoinLink, {
        convoId,
      })
      return data
    },
    onMutate: () => {
      if (!convoId) return
      return updateConvoOptimistic(queryClient, convoId, prev => {
        if (
          !bsky.isType(chat.bsky.convo.defs.groupConvo, prev.kind) ||
          !prev.kind.joinLink
        ) {
          return undefined
        }
        return {
          ...prev,
          kind: {
            ...prev.kind,
            joinLink: {...prev.kind.joinLink, enabledStatus: 'enabled'},
          },
        }
      })
    },
    onSuccess: data => {
      if (convoId) {
        updateConvoOptimistic(queryClient, convoId, prev => {
          if (!bsky.isType(chat.bsky.convo.defs.groupConvo, prev.kind))
            return undefined
          return {
            ...prev,
            kind: {...prev.kind, joinLink: data.joinLink},
          }
        })
      }
      void invalidateJoinLinkPreviewsForCode(queryClient, data.joinLink.code)
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
