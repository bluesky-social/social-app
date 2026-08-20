import {useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useChatClient} from '#/state/session'
import * as ChatBskyConvoDefs from '#/lexicons/chat/bsky/convo/defs'
import type * as ChatBskyGroupDefs from '#/lexicons/chat/bsky/group/defs'
import * as ChatBskyGroupEditJoinLink from '#/lexicons/chat/bsky/group/editJoinLink'
import * as bsky from '#/types/bsky'
import {
  rollbackConvoOptimistic,
  updateConvoOptimistic,
} from './utils/convo-cache'

export function useEditJoinLink(
  convoId: string | undefined,
  {
    onSuccess,
    onError,
  }: {
    onSuccess?: (data: ChatBskyGroupEditJoinLink.$OutputBody) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const client = useChatClient()

  return useMutation({
    mutationFn: async ({
      joinRule,
      requireApproval,
    }: {
      joinRule: ChatBskyGroupDefs.JoinRule
      requireApproval: boolean
    }) => {
      if (!convoId) throw new Error('No convoId provided')
      return await client.call(ChatBskyGroupEditJoinLink, {
        convoId,
        joinRule,
        requireApproval,
      })
    },
    onMutate: ({joinRule, requireApproval}) => {
      if (!convoId) return
      return updateConvoOptimistic(queryClient, convoId, prev => {
        if (
          !bsky.isType(ChatBskyConvoDefs.groupConvo, prev.kind) ||
          !prev.kind.joinLink
        ) {
          return undefined
        }
        return {
          ...prev,
          kind: {
            ...prev.kind,
            joinLink: {...prev.kind.joinLink, joinRule, requireApproval},
          },
        }
      })
    },
    onSuccess: data => {
      if (convoId) {
        updateConvoOptimistic(queryClient, convoId, prev => {
          if (!bsky.isType(ChatBskyConvoDefs.groupConvo, prev.kind))
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
