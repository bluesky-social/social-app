import {type ChatBskyConvoMuteConvo} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {useAgent} from '#/state/session'
import {
  rollbackConvoOptimistic,
  updateConvoOptimistic,
} from './utils/convo-cache'

export function useMuteConvo(
  convoId: string | undefined,
  {
    onSuccess,
    onError,
  }: {
    onSuccess?: (data: ChatBskyConvoMuteConvo.OutputSchema) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationFn: async ({mute}: {mute: boolean}) => {
      if (!convoId) throw new Error('No convoId provided')
      if (mute) {
        const {data} = await agent.chat.bsky.convo.muteConvo(
          {convoId},
          {headers: DM_SERVICE_HEADERS, encoding: 'application/json'},
        )
        return data
      } else {
        const {data} = await agent.chat.bsky.convo.unmuteConvo(
          {convoId},
          {headers: DM_SERVICE_HEADERS, encoding: 'application/json'},
        )
        return data
      }
    },
    onMutate: ({mute}) => {
      if (!convoId) return
      return updateConvoOptimistic(queryClient, convoId, prev => ({
        ...prev,
        muted: mute,
      }))
    },
    onSuccess: data => {
      onSuccess?.(data)
    },
    onError: (e, _variables, context) => {
      if (convoId && context) {
        rollbackConvoOptimistic(queryClient, convoId, context)
      }
      onError?.(e)
    },
  })
}
