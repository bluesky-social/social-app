import {useMutation, useQueryClient} from '@tanstack/react-query'

import {useChatClient} from '#/state/session'
import {chat} from '#/lexicons'
import * as bsky from '#/types/bsky'
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
    onSuccess?: (
      data: chat.bsky.convo.lockConvo.$OutputBody,
      variables: {lock: boolean; silent?: boolean},
    ) => void
    onError?: (
      error: Error,
      variables: {lock: boolean; silent?: boolean},
    ) => void
  },
) {
  const queryClient = useQueryClient()
  const client = useChatClient()

  return useMutation({
    mutationFn: async ({lock}: {lock: boolean; silent?: boolean}) => {
      if (!convoId) throw new Error('No convoId provided')
      if (lock) {
        return await client.call(chat.bsky.convo.lockConvo, {convoId})
      } else {
        return await client.call(chat.bsky.convo.unlockConvo, {convoId})
      }
    },
    onMutate: ({lock}) => {
      if (!convoId) return
      return updateConvoOptimistic(queryClient, convoId, prev => {
        if (!bsky.isType(chat.bsky.convo.defs.groupConvo, prev.kind))
          return undefined
        return {
          ...prev,
          kind: {
            ...prev.kind,
            lockStatus: lock ? 'locked' : 'unlocked',
          },
        }
      })
    },
    onSuccess: (data, variables) => {
      onSuccess?.(data, variables)
    },
    onError: (e, variables, context) => {
      if (convoId && context) {
        rollbackConvoOptimistic(queryClient, convoId, context)
      }
      onError?.(e, variables)
    },
  })
}
