import {ChatBskyConvoListConvos} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {DM_SERVICE_HEADERS} from '#/state/queries/messages/const'
import {useAgent} from '#/state/session'
import {RQKEY as CONVO_LIST_KEY} from './list-conversations'

export function useUpdateAllRead(
  status: 'accepted' | 'request',
  {
    onSuccess,
    onMutate,
    onError,
  }: {
    onMutate?: () => void
    onSuccess?: () => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationFn: async () => {
      const {data} = await agent.chat.bsky.convo.updateAllRead(
        {status},
        {headers: DM_SERVICE_HEADERS, encoding: 'application/json'},
      )

      return data
    },
    onMutate: () => {
      let prevPages: ChatBskyConvoListConvos.OutputSchema[] = []
      queryClient.setQueryData(
        CONVO_LIST_KEY(status),
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
                convos: page.convos.map(convo => {
                  return {
                    ...convo,
                    unreadCount: 0,
                  }
                }),
              }
            }),
          }
        },
      )
      // remove unread convos from the badge query
      queryClient.setQueryData(
        CONVO_LIST_KEY('all', 'unread'),
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
                convos: page.convos.filter(convo => convo.status !== status),
              }
            }),
          }
        },
      )
      onMutate?.()
      return {prevPages}
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: CONVO_LIST_KEY(status)})
      onSuccess?.()
    },
    onError: (error, _, context) => {
      logger.error(error)
      queryClient.setQueryData(
        CONVO_LIST_KEY(status),
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
      queryClient.invalidateQueries({queryKey: CONVO_LIST_KEY(status)})
      queryClient.invalidateQueries({queryKey: CONVO_LIST_KEY('all', 'unread')})
      onError?.(error)
    },
  })
}
