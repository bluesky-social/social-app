import {useMutation, useQueryClient} from '@tanstack/react-query'

import {useChatClient} from '#/state/session'
import * as ChatBskyConvoDefs from '#/lexicons/chat/bsky/convo/defs'
import * as ChatBskyConvoLockConvo from '#/lexicons/chat/bsky/convo/lockConvo'
import * as ChatBskyConvoUnlockConvo from '#/lexicons/chat/bsky/convo/unlockConvo'
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
      data: ChatBskyConvoLockConvo.$OutputBody,
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
        return await client.call(ChatBskyConvoLockConvo, {convoId})
      } else {
        return await client.call(ChatBskyConvoUnlockConvo, {convoId})
      }
    },
    onMutate: ({lock}) => {
      if (!convoId) return
      return updateConvoOptimistic(queryClient, convoId, prev => {
        if (!bsky.isType(ChatBskyConvoDefs.groupConvo, prev.kind))
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
