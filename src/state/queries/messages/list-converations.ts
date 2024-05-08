import {BskyAgent} from '@atproto-labs/api'
import {useInfiniteQuery} from '@tanstack/react-query'

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
