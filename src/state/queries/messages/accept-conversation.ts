import { type ChatBskyConvoAcceptConvo as ChatGndrConvoAcceptConvo, type ChatBskyConvoListConvos as ChatGndrConvoListConvos,  } from '@gander-social-atproto/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { logger } from '#/logger'
import { useAgent } from '#/state/session'
import { DM_SERVICE_HEADERS } from './const'
import { RQKEY as CONVO_LIST_KEY, RQKEY_ROOT as CONVO_LIST_ROOT_KEY,  } from './list-conversations'

export function useAcceptConversation(
  convoId: string,
  {
    onSuccess,
    onMutate,
    onError,
  }: {
    onMutate?: () => void
    onSuccess?: (data: ChatGndrConvoAcceptConvo.OutputSchema) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationFn: async () => {
      const {data} = await agent.chat.gndr.convo.acceptConvo(
        {convoId},
        {headers: DM_SERVICE_HEADERS},
      )

      return data
    },
    onMutate: () => {
      let prevAcceptedPages: ChatGndrConvoListConvos.OutputSchema[] = []
      let prevInboxPages: ChatGndrConvoListConvos.OutputSchema[] = []
      let convoBeingAccepted:
        | ChatGndrConvoListConvos.OutputSchema['convos'][number]
        | undefined
      queryClient.setQueryData(
        CONVO_LIST_KEY('request'),
        (old?: {
          pageParams: Array<string | undefined>
          pages: Array<ChatGndrConvoListConvos.OutputSchema>
        }) => {
          if (!old) return old
          prevInboxPages = old.pages
          return {
            ...old,
            pages: old.pages.map(page => {
              const found = page.convos.find(convo => convo.id === convoId)
              if (found) {
                convoBeingAccepted = found
                return {
                  ...page,
                  convos: page.convos.filter(convo => convo.id !== convoId),
                }
              }
              return page
            }),
          }
        },
      )
      queryClient.setQueryData(
        CONVO_LIST_KEY('accepted'),
        (old?: {
          pageParams: Array<string | undefined>
          pages: Array<ChatGndrConvoListConvos.OutputSchema>
        }) => {
          if (!old) return old
          prevAcceptedPages = old.pages
          if (convoBeingAccepted) {
            return {
              ...old,
              pages: [
                {
                  ...old.pages[0],
                  convos: [
                    {
                      ...convoBeingAccepted,
                      status: 'accepted',
                    },
                    ...old.pages[0].convos,
                  ],
                },
                ...old.pages.slice(1),
              ],
            }
          } else {
            return old
          }
        },
      )
      onMutate?.()
      return {prevAcceptedPages, prevInboxPages}
    },
    onSuccess: data => {
      queryClient.invalidateQueries({queryKey: [CONVO_LIST_KEY]})
      onSuccess?.(data)
    },
    onError: (error, _, context) => {
      logger.error(error)
      queryClient.setQueryData(
        CONVO_LIST_KEY('accepted'),
        (old?: {
          pageParams: Array<string | undefined>
          pages: Array<ChatGndrConvoListConvos.OutputSchema>
        }) => {
          if (!old) return old
          return {
            ...old,
            pages: context?.prevAcceptedPages || old.pages,
          }
        },
      )
      queryClient.setQueryData(
        CONVO_LIST_KEY('request'),
        (old?: {
          pageParams: Array<string | undefined>
          pages: Array<ChatGndrConvoListConvos.OutputSchema>
        }) => {
          if (!old) return old
          return {
            ...old,
            pages: context?.prevInboxPages || old.pages,
          }
        },
      )
      queryClient.invalidateQueries({queryKey: [CONVO_LIST_ROOT_KEY]})
      onError?.(error)
    },
  })
}
