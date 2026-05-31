import {ChatBskyConvoDefs, type ChatBskyGroupEnableJoinLink} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {logger} from '#/logger'
import {useAgent} from '#/state/session'
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
    onSuccess?: (data: ChatBskyGroupEnableJoinLink.OutputSchema) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationFn: async () => {
      if (!convoId) throw new Error('No convoId provided')
      const {data} = await agent.chat.bsky.group.enableJoinLink(
        {convoId},
        {headers: DM_SERVICE_HEADERS, encoding: 'application/json'},
      )
      return data
    },
    onMutate: () => {
      if (!convoId) return
      return updateConvoOptimistic(queryClient, convoId, prev => {
        if (!ChatBskyConvoDefs.isGroupConvo(prev.kind) || !prev.kind.joinLink) {
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
