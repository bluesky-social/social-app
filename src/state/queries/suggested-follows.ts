import {useCallback, useMemo} from 'react'
import {
  type AppBskyActorDefs,
  type AppBskyActorGetSuggestions,
  type AppBskyGraphGetSuggestedFollowsByActor,
} from '@atproto/api'
import {
  type InfiniteData,
  type QueryClient,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'
import type * as bsky from '#/types/bsky'

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

export function useSuggestedFollowsByActorWithDismiss({
  did,
  enabled,
  staleTime,
}: {
  did: string
  enabled?: boolean
  staleTime?: number
}) {
  const {isLoading, data, error} = useSuggestedFollowsByActorQuery({
    did,
    enabled,
    staleTime,
  })
  const queryClient = useQueryClient()

  const onDismiss = useCallback(
    (dismissedDid: string) => {
      queryClient.setQueryData(
        suggestedFollowsByActorQueryKey(did),
        (previous: typeof data) => {
          if (!previous) return previous
          return {
            ...previous,
            suggestions: previous.suggestions.filter(
              s => s.did !== dismissedDid,
            ),
          }
        },
      )
    },
    [did, queryClient],
  )

  const profiles = useMemo(() => {
    return (data?.suggestions ?? []).map(profile => ({
      actor: profile as bsky.profile.AnyProfileView,
      recId: data?.recId,
    }))
  }, [data?.suggestions, data?.recId])

  return {
    profiles,
    onDismiss,
    isLoading,
    error,
  }
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
