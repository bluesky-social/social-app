import {useInfiniteQuery} from '@tanstack/react-query'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {createQueryKey} from '#/state/queries/util'
import {useAgent} from '#/state/session'

const listMutualGroupsQueryKeyRoot = 'list-mutual-groups'

export const createListMutualGroupsQueryKey = (args: {subject: string}) =>
  createQueryKey(listMutualGroupsQueryKeyRoot, args)

export function useListMutualGroupsQuery({
  subject,
  enabled,
  limit = 20,
}: {
  subject: string | undefined
  enabled?: boolean
  limit?: number
}) {
  const agent = useAgent()
  const isEnabled = enabled !== false && !!subject

  return useInfiniteQuery({
    gcTime: 0,
    staleTime: 0,
    enabled: isEnabled,
    queryKey: createListMutualGroupsQueryKey({subject: subject ?? ''}),
    queryFn: async ({pageParam}) => {
      const {data} = await agent.chat.bsky.group.listMutualGroups(
        {subject: subject!, cursor: pageParam, limit},
        {headers: DM_SERVICE_HEADERS},
      )
      return data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: page => page.cursor,
  })
}
