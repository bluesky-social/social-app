import {type DatetimeString} from '@atproto/syntax'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useChatClient} from '#/state/session'
import {chat} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {
  rollbackConvoOptimistic,
  updateConvoOptimistic,
} from './utils/convo-cache'

export function useCreateJoinLink(
  convoId: string | undefined,
  {
    onSuccess,
    onError,
  }: {
    onSuccess?: (data: chat.bsky.group.createJoinLink.$OutputBody) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const chatClient = useChatClient()

  return useMutation({
    mutationFn: async ({
      joinRule,
      requireApproval,
    }: {
      joinRule: chat.bsky.group.defs.JoinRule
      requireApproval: boolean
    }) => {
      if (!convoId) throw new Error('No convoId provided')
      const data = await chatClient.call(chat.bsky.group.createJoinLink, {
        convoId,
        joinRule,
        requireApproval,
      })
      return data
    },
    onMutate: ({joinRule, requireApproval}) => {
      if (!convoId) return
      return updateConvoOptimistic(queryClient, convoId, prev => {
        if (!bsky.isType(chat.bsky.convo.defs.groupConvo, prev.kind))
          return undefined
        return {
          ...prev,
          kind: {
            ...prev.kind,
            joinLink: {
              $type: 'chat.bsky.group.defs#joinLinkView',
              code: '',
              enabledStatus: 'enabled',
              joinRule,
              requireApproval,
              // ISO string is a valid datetime; assert the branded type the
              // generated JoinLinkView expects for this optimistic-only value.
              createdAt: new Date().toISOString() as DatetimeString,
            },
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
