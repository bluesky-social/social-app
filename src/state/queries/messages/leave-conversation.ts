import {ChatBskyConvoLeaveConvo, ChatBskyConvoListConvos} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {DM_SERVICE_HEADERS} from '#/state/queries/messages/const'
import {useAgent} from '#/state/session'
import {RQKEY as CONVO_LIST_KEY} from './list-converations'

export function useLeaveConvo(
  convoId: string | undefined,
  {
    onSuccess,
    onError,
  }: {
    onSuccess?: (data: ChatBskyConvoLeaveConvo.OutputSchema) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const {getAgent} = useAgent()

  return useMutation({
    mutationFn: async () => {
      if (!convoId) throw new Error('No convoId provided')

      const {data} = await getAgent().api.chat.bsky.convo.leaveConvo(
        {convoId},
        {headers: DM_SERVICE_HEADERS, encoding: 'application/json'},
      )

      return data
    },
    onMutate: () => {
      queryClient.setQueryData(
        CONVO_LIST_KEY,
        (old?: {
          pageParams: Array<string | undefined>
          pages: Array<ChatBskyConvoListConvos.OutputSchema>
        }) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map(page => {
              return {
                ...page,
                convos: page.convos.filter(convo => convo.id !== convoId),
              }
            }),
          }
        },
      )
    },
    onSuccess: data => {
      queryClient.invalidateQueries({queryKey: CONVO_LIST_KEY})
      onSuccess?.(data)
    },
    onError: error => {
      logger.error(error)
      queryClient.invalidateQueries({queryKey: CONVO_LIST_KEY})
      onError?.(error)
    },
  })
}
