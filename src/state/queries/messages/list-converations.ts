import {useCallback, useMemo} from 'react'
import {BskyAgent} from '@atproto-labs/api'
import {useInfiniteQuery, useQueryClient} from '@tanstack/react-query'

import {useDmServiceUrlStorage} from '#/screens/Messages/Temp/useDmServiceUrlStorage'
import {useHeaders} from './temp-headers'

export const RQKEY = ['convo-list']
type RQPageParam = string | undefined

export function useListConvos({refetchInterval}: {refetchInterval: number}) {
  const headers = useHeaders()
  const {serviceUrl} = useDmServiceUrlStorage()

  return useInfiniteQuery({
    queryKey: RQKEY,
    queryFn: async ({pageParam}) => {
      const agent = new BskyAgent({service: serviceUrl})
      const {data} = await agent.api.chat.bsky.convo.listConvos(
        {cursor: pageParam},
        {headers},
      )

      return data
    },
    initialPageParam: undefined as RQPageParam,
    getNextPageParam: lastPage => lastPage.cursor,
    refetchInterval,
  })
}

export function useUnreadMessageCount() {
  const convos = useListConvos({
    refetchInterval: 30_000,
  })

  const count =
    convos.data?.pages
      .flatMap(page => page.convos)
      .reduce((acc, convo) => {
        return acc + (convo.unreadCount > 0 ? 1 : 0)
      }, 0) ?? 0

  return useMemo(() => {
    return {
      count,
      numUnread: count > 0 ? (count > 30 ? '30+' : String(count)) : undefined,
    }
  }, [count])
}

type ConvoListQueryData = ReturnType<typeof useListConvos>['data']

export function useOptimisticMarkAsRead() {
  const queryClient = useQueryClient()

  return useCallback(
    (chatId: string) => {
      queryClient.setQueryData(RQKEY, (old: ConvoListQueryData) => {
        if (!old) {
          return old
        }

        return {
          pages: old.pages.map(page => {
            return {
              ...page,
              convos: page.convos.map(convo => {
                return {
                  ...convo,
                  unreadCount: convo.chatId === chatId ? 0 : convo.unreadCount,
                }
              }),
            }
          }),
        }
      })
    },
    [queryClient],
  )
}
