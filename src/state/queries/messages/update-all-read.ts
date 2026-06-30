import {type ChatBskyConvoGetUnreadCounts} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {logger} from '#/logger'
import {useAgent} from '#/state/session'
import {RQKEY_PARTIAL as UNREAD_COUNTS_PARTIAL_KEY} from './get-unread-counts'
import {
  type ConvoRequestListQueryData,
  markAllRead as markAllRequestsRead,
  RQKEY_ROOT as REQUESTS_RQKEY_ROOT,
} from './list-conversation-requests'
import {
  type ConvoListQueryData,
  RQKEY_PARTIAL as CONVO_LIST_PARTIAL_KEY,
  RQKEY_ROOT as CONVO_LIST_ROOT_KEY,
} from './list-conversations'

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
      // snapshot every convo-list cache up front so onError can restore them
      // all by their exact keys
      const prevConvoListQueries =
        queryClient.getQueriesData<ConvoListQueryData>({
          queryKey: [CONVO_LIST_ROOT_KEY],
        })
      let prevRequestsQueries: Array<
        [readonly unknown[], ConvoRequestListQueryData | undefined]
      > = []
      queryClient.setQueriesData(
        {queryKey: CONVO_LIST_PARTIAL_KEY(status)},
        (old?: ConvoListQueryData) => {
          if (!old) return old
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
      // remove unread convos from the badge queries
      queryClient.setQueriesData(
        {queryKey: CONVO_LIST_PARTIAL_KEY('all', 'unread')},
        (old?: ConvoListQueryData) => {
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
      if (status === 'request') {
        prevRequestsQueries =
          queryClient.getQueriesData<ConvoRequestListQueryData>({
            queryKey: [REQUESTS_RQKEY_ROOT],
          })
        queryClient.setQueriesData<ConvoRequestListQueryData>(
          {queryKey: [REQUESTS_RQKEY_ROOT]},
          markAllRequestsRead,
        )
      }
      // zero out the badge count query that actually drives the unread badge,
      // since it's a separate server query that the list caches don't feed
      const prevUnreadCountsQueries =
        queryClient.getQueriesData<ChatBskyConvoGetUnreadCounts.OutputSchema>({
          queryKey: UNREAD_COUNTS_PARTIAL_KEY,
        })
      queryClient.setQueriesData<ChatBskyConvoGetUnreadCounts.OutputSchema>(
        {queryKey: UNREAD_COUNTS_PARTIAL_KEY},
        old => {
          if (!old) return old
          return {
            ...old,
            ...(status === 'accepted'
              ? {unreadAcceptedConvos: 0}
              : {unreadRequestConvos: 0}),
          }
        },
      )
      onMutate?.()
      return {
        prevConvoListQueries,
        prevRequestsQueries,
        prevUnreadCountsQueries,
      }
    },
    onSuccess: () => {
      // the optimistic badge zeroing can drift from the server, so invalidate
      // the count query to let it self-correct on next access rather than
      // waiting for a log event
      void queryClient.invalidateQueries({queryKey: UNREAD_COUNTS_PARTIAL_KEY})
      void queryClient.invalidateQueries({
        queryKey: CONVO_LIST_PARTIAL_KEY(status),
      })
      void queryClient.invalidateQueries({
        queryKey: CONVO_LIST_PARTIAL_KEY('all', 'unread'),
      })
      if (status === 'request') {
        void queryClient.invalidateQueries({queryKey: [REQUESTS_RQKEY_ROOT]})
      }
      onSuccess?.()
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
      if (context?.prevUnreadCountsQueries) {
        for (const [queryKey, prevData] of context.prevUnreadCountsQueries) {
          queryClient.setQueryData(queryKey, prevData)
        }
      }
      void queryClient.invalidateQueries({queryKey: [CONVO_LIST_ROOT_KEY]})
      if (status === 'request') {
        void queryClient.invalidateQueries({queryKey: [REQUESTS_RQKEY_ROOT]})
      }
      onError?.(error)
    },
  })
}
