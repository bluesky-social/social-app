import {ChatBskyConvoDefs} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {logger} from '#/logger'
import {useAgent} from '#/state/session'
import {RQKEY as CONVO_KEY} from './conversation'
import {
  type ConvoListQueryData,
  RQKEY_ROOT as CONVO_LIST_ROOT_KEY,
} from './list-conversations'

export function useMarkJoinRequestsRead(convoId: string | undefined) {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationFn: async () => {
      if (!convoId) throw new Error('No convoId provided')
      await agent.chat.bsky.group.updateJoinRequestsRead(
        {convoId},
        {headers: DM_SERVICE_HEADERS, encoding: 'application/json'},
      )
    },
    onMutate: () => {
      if (!convoId) return

      const prevConvo = queryClient.getQueryData<ChatBskyConvoDefs.ConvoView>(
        CONVO_KEY(convoId),
      )
      queryClient.setQueryData<ChatBskyConvoDefs.ConvoView | undefined>(
        CONVO_KEY(convoId),
        old => {
          if (!old || !ChatBskyConvoDefs.isGroupConvo(old.kind)) return old
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
                  !ChatBskyConvoDefs.isGroupConvo(convo.kind)
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
      logger.error(error)
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
