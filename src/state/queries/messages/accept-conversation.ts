import {
  type ChatBskyConvoAcceptConvo,
  type ChatBskyConvoDefs,
} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {logger} from '#/logger'
import {useAgent} from '#/state/session'
import {
  type ConvoRequestListQueryData,
  optimisticDelete as optimisticDeleteRequest,
  RQKEY_ROOT as REQUESTS_RQKEY_ROOT,
} from './list-conversation-requests'
import {
  type ConvoListQueryData,
  convoListQueryPredicate,
  getConvoFromQueryData,
  optimisticDelete,
  RQKEY_PARTIAL as CONVO_LIST_PARTIAL_KEY,
  RQKEY_ROOT as CONVO_LIST_ROOT_KEY,
} from './list-conversations'

export function useAcceptConversation(
  convoId: string,
  {
    onSuccess,
    onMutate,
    onError,
  }: {
    onMutate?: () => void
    onSuccess?: (data: ChatBskyConvoAcceptConvo.OutputSchema) => void
    onError?: (error: Error) => void
  },
) {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationFn: async () => {
      const {data} = await agent.chat.bsky.convo.acceptConvo(
        {convoId},
        {headers: DM_SERVICE_HEADERS},
      )

      return data
    },
    onMutate: () => {
      // snapshot every convo-list cache up front so onError can restore them
      // all by their exact keys
      const prevConvoListQueries =
        queryClient.getQueriesData<ConvoListQueryData>({
          queryKey: [CONVO_LIST_ROOT_KEY],
        })
      let convoBeingAccepted: ChatBskyConvoDefs.ConvoView | null = null
      for (const [_key, data] of queryClient.getQueriesData<ConvoListQueryData>(
        {queryKey: CONVO_LIST_PARTIAL_KEY('request')},
      )) {
        if (!data) continue
        convoBeingAccepted = getConvoFromQueryData(convoId, data)
        if (convoBeingAccepted) break
      }
      queryClient.setQueriesData(
        {queryKey: CONVO_LIST_PARTIAL_KEY('request')},
        (old?: ConvoListQueryData) => optimisticDelete(convoId, old),
      )
      if (convoBeingAccepted) {
        const acceptedConvo: ChatBskyConvoDefs.ConvoView = {
          ...convoBeingAccepted,
          status: 'accepted',
        }
        queryClient.setQueriesData(
          {
            queryKey: CONVO_LIST_PARTIAL_KEY('accepted'),
            predicate: convoListQueryPredicate(acceptedConvo),
          },
          (old?: ConvoListQueryData) => {
            if (!old) return old
            return {
              ...old,
              pages: old.pages.map((page, i) => {
                const convos = page.convos.filter(c => c.id !== convoId)
                if (i === 0) {
                  return {...page, convos: [acceptedConvo, ...convos]}
                }
                return {...page, convos}
              }),
            }
          },
        )
      }
      const prevRequestsQueries =
        queryClient.getQueriesData<ConvoRequestListQueryData>({
          queryKey: [REQUESTS_RQKEY_ROOT],
        })
      queryClient.setQueriesData<ConvoRequestListQueryData>(
        {queryKey: [REQUESTS_RQKEY_ROOT]},
        old => optimisticDeleteRequest(convoId, old),
      )
      onMutate?.()
      return {prevConvoListQueries, prevRequestsQueries}
    },
    onSuccess: data => {
      void queryClient.invalidateQueries({queryKey: [CONVO_LIST_ROOT_KEY]})
      void queryClient.invalidateQueries({queryKey: [REQUESTS_RQKEY_ROOT]})
      onSuccess?.(data)
    },
    onError: (error, _, context) => {
      logger.error(error)
      if (context?.prevConvoListQueries) {
        for (const [queryKey, prevData] of context.prevConvoListQueries) {
          queryClient.setQueryData(queryKey, prevData)
        }
      }
      if (context?.prevRequestsQueries) {
        for (const [queryKey, prevData] of context.prevRequestsQueries) {
          queryClient.setQueryData(queryKey, prevData)
        }
      }
      void queryClient.invalidateQueries({queryKey: [CONVO_LIST_ROOT_KEY]})
      void queryClient.invalidateQueries({queryKey: [REQUESTS_RQKEY_ROOT]})
      onError?.(error)
    },
  })
}
