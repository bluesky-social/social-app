import {
  type AppBskyActorDefs,
  type AppBskyActorGetSuggestions,
  type AppBskyGraphGetSuggestedFollowsByActor,
} from '@atproto/api'
import {
  type InfiniteData,
  type QueryClient,
  useQuery,
} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'

const suggestedFollowsQueryKeyRoot = 'suggested-follows'

const suggestedFollowsByActorQueryKeyRoot = 'suggested-follows-by-actor'
export const suggestedFollowsByActorQueryKey = (did: string) => [
  suggestedFollowsByActorQueryKeyRoot,
  did,
]

export function useSuggestedFollowsByActorQuery({
  did,
  enabled,
  staleTime = STALE.MINUTES.FIVE,
}: {
  did: string
  enabled?: boolean
  staleTime?: number
}) {
  const agent = useAgent()
  return useQuery({
    staleTime,
    queryKey: suggestedFollowsByActorQueryKey(did),
    queryFn: async () => {
      const res = await agent.app.bsky.graph.getSuggestedFollowsByActor({
        actor: did,
      })
      const suggestions = res.data.suggestions.filter(
        profile => !profile.viewer?.following,
      )
      return {suggestions, recId: res.data.recIdStr}
    },
    enabled,
  })
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<AppBskyActorDefs.ProfileView, void> {
  yield* findAllProfilesInSuggestedFollowsQueryData(queryClient, did)
  yield* findAllProfilesInSuggestedFollowsByActorQueryData(queryClient, did)
}

function* findAllProfilesInSuggestedFollowsQueryData(
  queryClient: QueryClient,
  did: string,
) {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<AppBskyActorGetSuggestions.OutputSchema>
  >({
    queryKey: [suggestedFollowsQueryKeyRoot],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }
    for (const page of queryData?.pages) {
      for (const actor of page.actors) {
        if (actor.did === did) {
          yield actor
        }
      }
    }
  }
}

function* findAllProfilesInSuggestedFollowsByActorQueryData(
  queryClient: QueryClient,
  did: string,
) {
  const queryDatas =
    queryClient.getQueriesData<AppBskyGraphGetSuggestedFollowsByActor.OutputSchema>(
      {
        queryKey: [suggestedFollowsByActorQueryKeyRoot],
      },
    )
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData) {
      continue
    }
    for (const suggestion of queryData.suggestions) {
      if (suggestion.did === did) {
        yield suggestion
      }
    }
  }
}
