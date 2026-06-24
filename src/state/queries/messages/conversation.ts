import {
  type ChatBskyActorDefs,
  type ChatBskyConvoDefs,
  type ChatBskyConvoGetConvo,
  type ChatBskyConvoGetUnreadCounts,
} from '@atproto/api'
import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {STALE} from '#/state/queries'
import {useOnMarkAsRead} from '#/state/queries/messages/list-conversations'
import {useAgent} from '#/state/session'
import {RQKEY_PARTIAL as UNREAD_COUNTS_PARTIAL_KEY} from './get-unread-counts'
import {
  type ConvoListQueryData,
  getConvoFromQueryData,
  RQKEY_ROOT as LIST_CONVOS_KEY,
} from './list-conversations'

export const RQKEY_ROOT = 'convo'
export const RQKEY = (convoId: string) => [RQKEY_ROOT, convoId]

// the badge counts are sentinel-capped by the server: unreadAcceptedConvos
// maxes at 31 (meaning "more than 30") and unreadRequestConvos at 11 (meaning
// "more than 10"). at the cap the value is no longer an exact count, so a naive
// -1 decrement is wrong - skip the optimistic decrement and let onSuccess
// invalidation reconcile with the server instead.
const UNREAD_ACCEPTED_CAP = 31
const UNREAD_REQUEST_CAP = 11

export function useConvoQuery({convoId}: {convoId: string}) {
  const agent = useAgent()

  return useQuery({
    queryKey: RQKEY(convoId),
    queryFn: async () => {
      const {data} = await agent.chat.bsky.convo.getConvo(
        {convoId},
        {headers: DM_SERVICE_HEADERS},
      )
      return data.convo
    },
    staleTime: STALE.INFINITY,
  })
}

export function precacheConvoQuery(
  queryClient: QueryClient,
  convo: ChatBskyConvoDefs.ConvoView,
) {
  queryClient.setQueryData(RQKEY(convo.id), convo)
}

export function useMarkAsReadMutation() {
  const optimisticUpdate = useOnMarkAsRead()
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    mutationFn: async ({
      convoId,
      messageId,
    }: {
      convoId?: string
      messageId?: string
    }) => {
      if (!convoId) throw new Error('No convoId provided')

      await agent.chat.bsky.convo.updateRead(
        {
          convoId,
          messageId,
        },
        {
          encoding: 'application/json',
          headers: DM_SERVICE_HEADERS,
        },
      )
    },
    onMutate({convoId}) {
      if (!convoId) throw new Error('No convoId provided')

      // snapshot the list caches before the optimistic update so onError can
      // restore the convo rows alongside the badge count
      const prevListQueries = queryClient.getQueriesData<ConvoListQueryData>({
        queryKey: [LIST_CONVOS_KEY],
      })

      // find the convo so we know which badge counter (if any) to decrement.
      // keep scanning past a stale unreadCount === 0 cache so another cache
      // holding the true unread state still drives the decrement
      let unreadStatus: ChatBskyConvoDefs.ConvoView['status'] | undefined
      for (const [, data] of prevListQueries) {
        if (!data) continue
        const convo = getConvoFromQueryData(convoId, data)
        if (convo?.unreadCount) {
          unreadStatus = convo.status
          break
        }
      }

      optimisticUpdate(convoId)

      // the badge count query is a separate server query that the list caches
      // don't feed, so decrement it here to keep the badge in sync
      const prevUnreadCountsQueries =
        queryClient.getQueriesData<ChatBskyConvoGetUnreadCounts.OutputSchema>({
          queryKey: UNREAD_COUNTS_PARTIAL_KEY,
        })
      if (unreadStatus) {
        queryClient.setQueriesData<ChatBskyConvoGetUnreadCounts.OutputSchema>(
          {queryKey: UNREAD_COUNTS_PARTIAL_KEY},
          old => {
            if (!old) return old
            return {
              ...old,
              ...(unreadStatus === 'request'
                ? {
                    unreadRequestConvos:
                      old.unreadRequestConvos >= UNREAD_REQUEST_CAP
                        ? old.unreadRequestConvos
                        : Math.max(0, old.unreadRequestConvos - 1),
                  }
                : {
                    unreadAcceptedConvos:
                      old.unreadAcceptedConvos >= UNREAD_ACCEPTED_CAP
                        ? old.unreadAcceptedConvos
                        : Math.max(0, old.unreadAcceptedConvos - 1),
                  }),
            }
          },
        )
      }
      return {prevListQueries, prevUnreadCountsQueries}
    },
    onError(_, __, context) {
      if (context?.prevListQueries) {
        for (const [queryKey, prevData] of context.prevListQueries) {
          queryClient.setQueryData(queryKey, prevData)
        }
      }
      if (context?.prevUnreadCountsQueries) {
        for (const [queryKey, prevData] of context.prevUnreadCountsQueries) {
          queryClient.setQueryData(queryKey, prevData)
        }
      }
    },
    onSuccess(_, {convoId}) {
      if (!convoId) return

      // the optimistic badge arithmetic can drift from the server (e.g. a convo
      // whose status differs between caches, or a sentinel-capped count). invalidate
      // so the 15s-stale count query self-corrects on next access rather than
      // waiting for a log event
      void queryClient.invalidateQueries({queryKey: UNREAD_COUNTS_PARTIAL_KEY})

      queryClient.setQueriesData(
        {queryKey: [LIST_CONVOS_KEY]},
        (old?: ConvoListQueryData) => {
          if (!old) return old

          const existingConvo = getConvoFromQueryData(convoId, old)

          if (existingConvo) {
            return {
              ...old,
              pages: old.pages.map(page => {
                return {
                  ...page,
                  convos: page.convos.map(convo => {
                    if (convo.id === convoId) {
                      return {
                        ...convo,
                        unreadCount: 0,
                      }
                    }
                    return convo
                  }),
                }
              }),
            }
          } else {
            // If we somehow marked a convo as read that doesn't exist in the
            // list, then we don't need to do anything.
          }
        },
      )
    },
  })
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<ChatBskyActorDefs.ProfileViewBasic, void> {
  const queryDatas = queryClient.getQueriesData<
    ChatBskyConvoGetConvo.OutputSchema['convo']
  >({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData) continue
    for (const member of queryData.members) {
      if (member.did === did) {
        yield member
      }
    }
  }
}
