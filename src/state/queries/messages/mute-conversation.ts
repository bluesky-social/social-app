import {
  BskyAgent,
  ChatBskyConvoMuteConvo,
  ChatBskyConvoUnmuteConvo,
} from '@atproto-labs/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {useDmServiceUrlStorage} from '#/screens/Messages/Temp/useDmServiceUrlStorage'
import {RQKEY as CONVO_KEY} from './conversation'
import {useHeaders} from './temp-headers'

export function useMuteConvo(
  convoId: string,
  {
    onSuccess,
    onError,
  }: {
    onSuccess?: (data: ChatBskyConvoMuteConvo.OutputSchema) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const headers = useHeaders()
  const {serviceUrl} = useDmServiceUrlStorage()

  return useMutation({
    mutationFn: async () => {
      const agent = new BskyAgent({service: serviceUrl})
      const {data} = await agent.api.chat.bsky.convo.muteConvo(
        {convoId},
        {headers, encoding: 'application/json'},
      )

      return data
    },
    onSuccess: data => {
      queryClient.invalidateQueries({queryKey: CONVO_KEY(convoId)})
      onSuccess?.(data)
    },
    onError,
  })
}

export function useUnmuteConvo(
  convoId: string,
  {
    onSuccess,
    onError,
  }: {
    onSuccess?: (data: ChatBskyConvoUnmuteConvo.OutputSchema) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const headers = useHeaders()
  const {serviceUrl} = useDmServiceUrlStorage()

  return useMutation({
    mutationFn: async () => {
      const agent = new BskyAgent({service: serviceUrl})
      const {data} = await agent.api.chat.bsky.convo.unmuteConvo(
        {convoId},
        {headers, encoding: 'application/json'},
      )

      return data
    },
    onSuccess: data => {
      queryClient.invalidateQueries({queryKey: CONVO_KEY(convoId)})
      onSuccess?.(data)
    },
    onError,
  })
}
