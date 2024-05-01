import {
  BskyAgent,
  ChatBskyConvoLeaveConvo,
  ChatBskyConvoListConvos,
} from '@atproto-labs/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {useDmServiceUrlStorage} from '#/screens/Messages/Temp/useDmServiceUrlStorage'
import {RQKEY as CONVO_LIST_KEY} from './list-converations'
import {useHeaders} from './temp-headers'

export function useLeaveConvo(
  convoId: string,
  {
    onSuccess,
    onError,
  }: {
    onSuccess?: (data: ChatBskyConvoLeaveConvo.OutputSchema) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const headers = useHeaders()
  const {serviceUrl} = useDmServiceUrlStorage()

  return useMutation({
    mutationFn: async () => {
      const agent = new BskyAgent({service: serviceUrl})
      const {data} = await agent.api.chat.bsky.convo.leaveConvo(
        {convoId},
        {headers, encoding: 'application/json'},
      )

      return data
    },
    onMutate: () => {
      queryClient.setQueryData(
        CONVO_LIST_KEY,
        (
          old?: Array<{
            pageParams: Array<string | undefined>
            pages: Array<ChatBskyConvoListConvos.OutputSchema>
          }>,
        ) => {
          if (!old) return old
          return old.map(page => ({
            ...page,
            pages: page.pages.filter(convo => convo.id !== convoId),
          }))
        },
      )
    },
    onSuccess: data => {
      queryClient.invalidateQueries({queryKey: CONVO_LIST_KEY})
      onSuccess?.(data)
    },
    onError: error => {
      queryClient.invalidateQueries({queryKey: CONVO_LIST_KEY})
      onError?.(error)
    },
  })
}
