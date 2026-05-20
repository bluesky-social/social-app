import {ChatBskyConvoDefs, type ChatBskyConvoLockConvo} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {useAgent} from '#/state/session'
import {
  rollbackConvoOptimistic,
  updateConvoOptimistic,
} from './utils/convo-cache'

export function useLockConvo(
  convoId: string | undefined,
  {
    onSuccess,
    onError,
  }: {
    onSuccess?: (data: ChatBskyConvoLockConvo.OutputSchema) => void
    onError?: (error: Error, variables: {lock: boolean}) => void
  },
) {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationFn: async ({lock}: {lock: boolean}) => {
      if (!convoId) throw new Error('No convoId provided')
      if (lock) {
        const {data} = await agent.chat.bsky.convo.lockConvo(
          {convoId},
          {headers: DM_SERVICE_HEADERS, encoding: 'application/json'},
        )
        return data
      } else {
        const {data} = await agent.chat.bsky.convo.unlockConvo(
          {convoId},
          {headers: DM_SERVICE_HEADERS, encoding: 'application/json'},
        )
        return data
      }
    },
    onMutate: ({lock}) => {
      if (!convoId) return
      return updateConvoOptimistic(queryClient, convoId, prev => {
        if (!ChatBskyConvoDefs.isGroupConvo(prev.kind)) return undefined
        return {
          ...prev,
          kind: {
            ...prev.kind,
            lockStatus: lock ? 'locked' : 'unlocked',
          },
        }
      })
    },
    onSuccess: data => {
      onSuccess?.(data)
    },
    onError: (e, variables, context) => {
      if (convoId && context) {
        rollbackConvoOptimistic(queryClient, convoId, context)
      }
      onError?.(e, variables)
    },
  })
}
