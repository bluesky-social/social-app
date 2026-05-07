import {useEffect} from 'react'
import {ChatBskyConvoDefs} from '@atproto/api'
import {useInfiniteQuery, useQueryClient} from '@tanstack/react-query'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {useMessagesEventBus} from '#/state/messages/events'
import {createQueryKey} from '#/state/queries/util'
import {useAgent} from '#/state/session'
import {STALE} from '..'

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
  const agent = useAgent()
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
            ChatBskyConvoDefs.isLogIncomingJoinRequest(log) ||
            ChatBskyConvoDefs.isLogApproveJoinRequest(log) ||
            ChatBskyConvoDefs.isLogRejectJoinRequest(log)
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
      const {data} = await agent.chat.bsky.group.listJoinRequests(
        {convoId: convoId!, cursor: pageParam, limit: 50},
        {headers: DM_SERVICE_HEADERS},
      )
      return data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: page => page.cursor,
    staleTime: STALE.MINUTES.ONE,
  })
}
