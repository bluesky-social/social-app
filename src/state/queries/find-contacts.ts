import {type AppBskyContactGetMatches} from '@atproto/api'
import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query'

import {useAgent} from '#/state/session'
import {type Match} from '#/components/contacts/state'
import type * as bsky from '#/types/bsky'
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

export const findContactsMatchesPassthroughQueryKey = (dids: string[]) => [
  RQ_KEY_ROOT,
  'passthrough',
  dids,
]

/**
 * DIRTY HACK WARNING!
 *
 * The only way to get shadow state to work is to put it into React Query.
 * However, when we get the matches it's via a POST, not a GET, so we use a mutation,
 * which means we can't use shadowing!
 *
 * In lieu of any better ideas, I'm just going to take the contacts we have and
 * "launder" them through a dummy query. This will then return "shadow-able" profiles.
 */
export function useMatchesPassthroughQuery(matches: Match[]) {
  const dids = matches.map(match => match.profile.did)
  const {data} = useQuery({
    queryKey: findContactsMatchesPassthroughQueryKey(dids),
    queryFn: () => {
      return matches
    },
  })
  return data ?? matches
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<bsky.profile.AnyProfileView, void> {
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

  const passthroughQueryDatas = queryClient.getQueriesData<Match[]>({
    queryKey: [RQ_KEY_ROOT, 'passthrough'],
  })
  for (const [_queryKey, queryData] of passthroughQueryDatas) {
    if (!queryData) {
      continue
    }
    for (const match of queryData) {
      if (match.profile.did === did) {
        yield match.profile
      }
    }
  }
}
