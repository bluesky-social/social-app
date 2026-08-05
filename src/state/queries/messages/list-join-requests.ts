import {useEffect} from 'react'
import {useInfiniteQuery, useQueryClient} from '@tanstack/react-query'

import {useMessagesEventBus} from '#/state/messages/events'
import {createQueryKey} from '#/state/queries/util'
import {useChatClient} from '#/state/session'
import {chat} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {STALE} from '..'

export const JOIN_REQUESTS_THRESHOLD = 20

const listJoinRequestsQueryKeyRoot = 'list-join-requests'

export const createListJoinRequestsQueryKey = (args: {convoId: string}) =>
  createQueryKey(listJoinRequestsQueryKeyRoot, args)

export function useListJoinRequestsQuery({
  convoId,
  enabled,
}: {
  convoId: string | undefined
  enabled?: boolean
}) {
  const chatClient = useChatClient()
  const queryClient = useQueryClient()
  const messagesBus = useMessagesEventBus()
  const isEnabled = enabled !== false && !!convoId

  useEffect(() => {
    if (!isEnabled || !convoId) return

    return messagesBus.on(
      event => {
        if (event.type !== 'logs') return
        for (const log of event.logs) {
          if (
            bsky.isType(chat.bsky.convo.defs.logIncomingJoinRequest, log) ||
            bsky.isType(chat.bsky.convo.defs.logApproveJoinRequest, log) ||
            bsky.isType(chat.bsky.convo.defs.logRejectJoinRequest, log)
          ) {
            void queryClient.invalidateQueries({
              queryKey: createListJoinRequestsQueryKey({convoId}),
            })
            return
          }
        }
      },
      {convoId},
    )
  }, [isEnabled, convoId, messagesBus, queryClient])

  return useInfiniteQuery({
    enabled: isEnabled,
    queryKey: createListJoinRequestsQueryKey({convoId: convoId ?? ''}),
    queryFn: async ({pageParam}) => {
      return await chatClient.call(chat.bsky.group.listJoinRequests, {
        convoId: convoId!,
        cursor: pageParam,
        limit: JOIN_REQUESTS_THRESHOLD,
      })
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: page => page.cursor,
    staleTime: STALE.MINUTES.ONE,
  })
}
