import {useInfiniteQuery, useQuery} from '@tanstack/react-query'

import {useAgent} from '#/state/session'

const RQ_KEY_ROOT = 'find-contacts'
export const findContactsStatusQueryKey = [RQ_KEY_ROOT, 'sync-status']

export function useContactsSyncStatusQuery() {
  const agent = useAgent()

  return useQuery({
    queryKey: findContactsStatusQueryKey,
    queryFn: async () => {
      const status = await agent.app.bsky.contact.getSyncStatus()
      return status.data
    },
  })
}

export const findContactsGetMatchesQueryKey = [RQ_KEY_ROOT, 'matches']

export function useContactsMatchesQuery() {
  const agent = useAgent()

  return useInfiniteQuery({
    queryKey: findContactsGetMatchesQueryKey,
    queryFn: async ({pageParam}) => {
      const matches = await agent.app.bsky.contact.getMatches({
        cursor: pageParam,
      })
      return matches.data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.cursor,
  })
}
