import {useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {invalidateJoinLinkPreviewsForCode} from '#/state/queries/join-links'
import {useChatClient} from '#/state/session'
import * as ChatBskyConvoDefs from '#/lexicons/chat/bsky/convo/defs'
import * as ChatBskyGroupDisableJoinLink from '#/lexicons/chat/bsky/group/disableJoinLink'
import * as bsky from '#/types/bsky'
import {
  rollbackConvoOptimistic,
  updateConvoOptimistic,
} from './utils/convo-cache'

export function useDisableJoinLink(
  convoId: string | undefined,
  {
    onSuccess,
    onError,
  }: {
    onSuccess?: (data: ChatBskyGroupDisableJoinLink.$OutputBody) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const client = useChatClient()

  return useMutation({
    mutationFn: async () => {
      if (!convoId) throw new Error('No convoId provided')
      return await client.call(ChatBskyGroupDisableJoinLink, {convoId})
    },
    onMutate: () => {
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
            joinLink: {...prev.kind.joinLink, enabledStatus: 'disabled'},
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
