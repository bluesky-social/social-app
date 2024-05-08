import {BskyAgent, ChatBskyConvoGetConvoForMembers} from '@atproto-labs/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useDmServiceUrlStorage} from '#/screens/Messages/Temp/useDmServiceUrlStorage'
import {RQKEY as CONVO_KEY} from './conversation'
import {useHeaders} from './temp-headers'

export function useGetConvoForMembers({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: ChatBskyConvoGetConvoForMembers.OutputSchema) => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()
  const headers = useHeaders()
  const {serviceUrl} = useDmServiceUrlStorage()

  return useMutation({
    mutationFn: async (members: string[]) => {
      const agent = new BskyAgent({service: serviceUrl})
      const {data} = await agent.api.chat.bsky.convo.getConvoForMembers(
        {members: members},
        {headers},
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
