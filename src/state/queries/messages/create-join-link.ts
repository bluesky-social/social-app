import {
  ChatBskyConvoDefs,
  type ChatBskyGroupCreateJoinLink,
  type ChatBskyGroupDefs,
} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useChatClient} from '#/state/session'
import {chat} from '#/lexicons'
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
    onSuccess?: (data: ChatBskyGroupCreateJoinLink.OutputSchema) => void
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
      return await client.call(chat.bsky.group.createJoinLink, {
        convoId,
        joinRule,
        requireApproval,
      })
    },
    onMutate: ({joinRule, requireApproval}) => {
      if (!convoId) return
      return updateConvoOptimistic(queryClient, convoId, prev => {
        if (!ChatBskyConvoDefs.isGroupConvo(prev.kind)) return undefined
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
              createdAt: new Date().toISOString(),
            },
          },
        }
      })
    },
    onSuccess: data => {
      if (convoId) {
        updateConvoOptimistic(queryClient, convoId, prev => {
          if (!ChatBskyConvoDefs.isGroupConvo(prev.kind)) return undefined
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
