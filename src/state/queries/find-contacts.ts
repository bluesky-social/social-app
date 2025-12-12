import {
  type AppBskyActorDefs,
  type AppBskyContactGetMatches,
} from '@atproto/api'
import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query'

import {useAgent} from '#/state/session'
import {STALE} from '.'

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
    staleTime: STALE.SECONDS.THIRTY,
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
    staleTime: STALE.MINUTES.ONE,
  })
}

export function optimisticRemoveMatch(queryClient: QueryClient, did: string) {
  queryClient.setQueryData<InfiniteData<AppBskyContactGetMatches.OutputSchema>>(
    findContactsGetMatchesQueryKey,
    old => {
      if (!old) return old

      return {
        ...old,
        pages: old.pages.map(page => ({
          ...page,
          matches: page.matches.filter(match => match.did !== did),
        })),
      }
    },
  )
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<AppBskyActorDefs.ProfileView, void> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<AppBskyContactGetMatches.OutputSchema>
  >({
    queryKey: findContactsGetMatchesQueryKey,
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }
    for (const page of queryData?.pages) {
      for (const match of page.matches) {
        if (match.did === did) {
          yield match
        }
      }
    }
  }
}
