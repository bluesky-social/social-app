import {ChatBskyConvoGetConvoForMembers} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {DM_SERVICE_HEADERS} from '#/state/queries/messages/const'
import {useAgent} from '#/state/session'
import {RQKEY as CONVO_KEY} from './conversation'

export function useGetConvoForMembers({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: ChatBskyConvoGetConvoForMembers.OutputSchema) => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()
  const {getAgent} = useAgent()

  return useMutation({
    mutationFn: async (members: string[]) => {
      const {data} = await getAgent().api.chat.bsky.convo.getConvoForMembers(
        {members: members},
        {headers: DM_SERVICE_HEADERS},
      )

      return data
    },
    onSuccess: data => {
      queryClient.setQueryData(CONVO_KEY(data.convo.id), data.convo)
      onSuccess?.(data)
    },
    onError: error => {
      logger.error(error)
      onError?.(error)
    },
  })
}
