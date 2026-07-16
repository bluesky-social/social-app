import {type DidString} from '@atproto/syntax'
import {useInfiniteQuery} from '@tanstack/react-query'

import {createQueryKey} from '#/state/queries/util'
import {useChatClient} from '#/state/session'
import {chat} from '#/lexicons'

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
  const chatClient = useChatClient()
  const isEnabled = enabled !== false && !!subject

  return useInfiniteQuery({
    gcTime: 0,
    staleTime: 0,
    enabled: isEnabled,
    queryKey: createListMutualGroupsQueryKey({subject: subject ?? ''}),
    queryFn: async ({pageParam}) => {
      return await chatClient.call(chat.bsky.group.listMutualGroups, {
        subject: subject! as DidString,
        cursor: pageParam,
        limit,
      })
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: page => page.cursor,
  })
}
