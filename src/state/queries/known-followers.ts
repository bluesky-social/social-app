import {type DidString} from '@atproto/syntax'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {useAppviewClient} from '#/state/session'
import type * as AppBskyActorDefs from '#/lexicons/app/bsky/actor/defs'
import * as AppBskyGraphGetKnownFollowers from '#/lexicons/app/bsky/graph/getKnownFollowers'

const PAGE_SIZE = 50
type RQPageParam = string | undefined

const RQKEY_ROOT = 'profile-known-followers'
export const RQKEY = (did: string) => [RQKEY_ROOT, did]

export function useProfileKnownFollowersQuery(did: string | undefined) {
  const client = useAppviewClient()
  return useInfiniteQuery<
    AppBskyGraphGetKnownFollowers.$OutputBody,
    Error,
    InfiniteData<AppBskyGraphGetKnownFollowers.$OutputBody>,
    QueryKey,
    RQPageParam
  >({
    queryKey: RQKEY(did || ''),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      return await client.call(AppBskyGraphGetKnownFollowers, {
        // the enabled flag prevents this from running until did is set
        actor: did! as DidString,
        limit: PAGE_SIZE,
        cursor: pageParam,
      })
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    enabled: !!did,
  })
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<AppBskyActorDefs.ProfileView, void> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<AppBskyGraphGetKnownFollowers.$OutputBody>
  >({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }
    for (const page of queryData?.pages) {
      for (const follow of page.followers) {
        if (follow.did === did) {
          yield follow
        }
      }
    }
  }
}
