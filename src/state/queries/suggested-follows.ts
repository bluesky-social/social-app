import {useCallback, useMemo} from 'react'
import {type AtIdentifierString} from '@atproto/syntax'
import {
  type InfiniteData,
  type QueryClient,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'

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
  const client = useAppviewClient()
  return useQuery({
    staleTime,
    queryKey: suggestedFollowsByActorQueryKey(did),
    queryFn: async () => {
      const data = await client.call(
        app.bsky.graph.getSuggestedFollowsByActor,
        {
          actor: did as AtIdentifierString,
        },
      )
      const suggestions = data.suggestions.filter(
        profile => !profile.viewer?.following,
      )
      return {suggestions, recId: data.recIdStr}
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
      actor: profile,
      recId: data?.recId,
    }))
  }, [data?.suggestions, data?.recId])

  return {
    profiles,
    recId: data?.recId,
    onDismiss,
    isLoading,
    error,
  }
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<app.bsky.actor.defs.ProfileView, void> {
  yield* findAllProfilesInSuggestedFollowsQueryData(queryClient, did)
  yield* findAllProfilesInSuggestedFollowsByActorQueryData(queryClient, did)
}

function* findAllProfilesInSuggestedFollowsQueryData(
  queryClient: QueryClient,
  did: string,
) {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<app.bsky.actor.getSuggestions.$OutputBody>
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
    queryClient.getQueriesData<app.bsky.graph.getSuggestedFollowsByActor.$OutputBody>(
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
