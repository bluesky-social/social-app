import {useMutation, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useChatClient} from '#/state/session'
import {chat} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {RQKEY as CONVO_KEY} from './conversation'
import {
  type ConvoListQueryData,
  RQKEY_ROOT as CONVO_LIST_ROOT_KEY,
} from './list-conversations'

export function useMarkJoinRequestsRead(convoId: string | undefined) {
  const queryClient = useQueryClient()
  const chatClient = useChatClient()

  return useMutation({
    mutationFn: async () => {
      if (!convoId) throw new Error('No convoId provided')
      await chatClient.call(chat.bsky.group.updateJoinRequestsRead, {convoId})
    },
    onMutate: () => {
      if (!convoId) return

      const prevConvo =
        queryClient.getQueryData<chat.bsky.convo.defs.ConvoView>(
          CONVO_KEY(convoId),
        )
      queryClient.setQueryData<chat.bsky.convo.defs.ConvoView | undefined>(
        CONVO_KEY(convoId),
        old => {
          if (!old || !bsky.isType(chat.bsky.convo.defs.groupConvo, old.kind))
            return old
          return {
            ...old,
            kind: {...old.kind, unreadJoinRequestCount: 0},
          }
        },
      )

      const prevListEntries = queryClient.getQueriesData<ConvoListQueryData>({
        queryKey: [CONVO_LIST_ROOT_KEY],
      })
      queryClient.setQueriesData<ConvoListQueryData>(
        {queryKey: [CONVO_LIST_ROOT_KEY]},
        old => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              convos: page.convos.map(convo => {
                if (
                  convo.id !== convoId ||
                  !bsky.isType(chat.bsky.convo.defs.groupConvo, convo.kind)
                ) {
                  return convo
                }
                return {
                  ...convo,
                  kind: {...convo.kind, unreadJoinRequestCount: 0},
                }
              }),
            })),
          }
        },
      )

      return {prevConvo, prevListEntries}
    },
    onError: (error, _, context) => {
      logger.error('Failed to mark join requests as read', {safeMessage: error})
      if (!convoId) return
      if (context?.prevConvo) {
        queryClient.setQueryData(CONVO_KEY(convoId), context.prevConvo)
      }
      for (const [key, data] of context?.prevListEntries ?? []) {
        queryClient.setQueryData(key, data)
      }
      void queryClient.invalidateQueries({queryKey: CONVO_KEY(convoId)})
      void queryClient.invalidateQueries({queryKey: [CONVO_LIST_ROOT_KEY]})
    },
  })
}
