import {ChatBskyConvoListConvos} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {DM_SERVICE_HEADERS} from '#/state/queries/messages/const'
import {useAgent} from '#/state/session'
import {RQKEY as CONVO_LIST_KEY} from './list-conversations'

export const RQKEY_ROOT = 'leave-convo'
export function RQKEY(convoId: string | undefined) {
  return [RQKEY_ROOT, convoId]
}

export function useLeaveConvo(
  convoId: string | undefined,
  {
    onMutate,
    onError,
  }: {
    onMutate?: () => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationKey: RQKEY(convoId),
    mutationFn: async () => {
      if (!convoId) throw new Error('No convoId provided')

      const {data} = await agent.api.chat.bsky.convo.leaveConvo(
        {convoId},
        {headers: DM_SERVICE_HEADERS, encoding: 'application/json'},
      )

      return data
    },
    onMutate: async () => {
      await queryClient.cancelQueries({queryKey: CONVO_LIST_KEY})
      let prevPages: ChatBskyConvoListConvos.OutputSchema[] = []
      queryClient.setQueryData(
        CONVO_LIST_KEY,
        (old?: {
          pageParams: Array<string | undefined>
          pages: Array<ChatBskyConvoListConvos.OutputSchema>
        }) => {
          if (!old) return old
          prevPages = old.pages
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
      onMutate?.()
      return {prevPages}
    },
    onError: (error, _, context) => {
      logger.error(error)
      queryClient.setQueryData(
        CONVO_LIST_KEY,
        (old?: {
          pageParams: Array<string | undefined>
          pages: Array<ChatBskyConvoListConvos.OutputSchema>
        }) => {
          if (!old) return old
          return {
            ...old,
            pages: context?.prevPages || old.pages,
          }
        },
      )
      onError?.(error)
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: CONVO_LIST_KEY})
    },
  })
}
