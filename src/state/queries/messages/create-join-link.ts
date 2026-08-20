import {toDatetimeString} from '@atproto/syntax'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useChatClient} from '#/state/session'
import * as ChatBskyConvoDefs from '#/lexicons/chat/bsky/convo/defs'
import * as ChatBskyGroupCreateJoinLink from '#/lexicons/chat/bsky/group/createJoinLink'
import type * as ChatBskyGroupDefs from '#/lexicons/chat/bsky/group/defs'
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
    onSuccess?: (data: ChatBskyGroupCreateJoinLink.$OutputBody) => void
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
      return await client.call(ChatBskyGroupCreateJoinLink, {
        convoId,
        joinRule,
        requireApproval,
      })
    },
    onMutate: ({joinRule, requireApproval}) => {
      if (!convoId) return
      return updateConvoOptimistic(queryClient, convoId, prev => {
        if (!bsky.isType(ChatBskyConvoDefs.groupConvo, prev.kind))
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
              createdAt: toDatetimeString(new Date()),
            },
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
