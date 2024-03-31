import React from 'react'
import {
  AppBskyActorDefs,
  AppBskyActorGetSuggestions,
  AppBskyGraphGetSuggestedFollowsByActor,
  moderateProfile,
} from '@atproto/api'
import {
  InfiniteData,
  QueryClient,
  QueryKey,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useModerationOpts} from '#/state/queries/preferences'
import {getAgent, useSession} from '#/state/session'

const suggestedFollowsQueryKey = ['suggested-follows']
const suggestedFollowsByActorQueryKey = (did: string) => [
  'suggested-follows-by-actor',
  did,
]

export function useSuggestedFollowsQuery() {
  const {currentAccount} = useSession()
  const moderationOpts = useModerationOpts()

  return useInfiniteQuery<
    AppBskyActorGetSuggestions.OutputSchema,
    Error,
    InfiniteData<AppBskyActorGetSuggestions.OutputSchema>,
    QueryKey,
    string | undefined
  >({
    enabled: !!moderationOpts,
    staleTime: STALE.HOURS.ONE,
    queryKey: suggestedFollowsQueryKey,
    queryFn: async ({pageParam}) => {
      const res = await getAgent().app.bsky.actor.getSuggestions({
        limit: 25,
        cursor: pageParam,
      })

      res.data.actors = res.data.actors
        .filter(
          actor =>
            !moderateProfile(actor, moderationOpts!).ui('profileList').filter,
        )
        .filter(actor => {
          const viewer = actor.viewer
          if (viewer) {
            if (
              viewer.following ||
              viewer.muted ||
              viewer.mutedByList ||
              viewer.blockedBy ||
              viewer.blocking
            ) {
              return false
            }
          }
          if (actor.did === currentAccount?.did) {
            return false
          }
          return true
        })

      return res.data
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
  })
}

export function useSuggestedFollowsByActorQuery({did}: {did: string}) {
  return useQuery<AppBskyGraphGetSuggestedFollowsByActor.OutputSchema, Error>({
    queryKey: suggestedFollowsByActorQueryKey(did),
    queryFn: async () => {
      const res = await getAgent().app.bsky.graph.getSuggestedFollowsByActor({
        actor: did,
      })
      return res.data
    },
  })
}

export function useGetSuggestedFollowersByActor() {
  const queryClient = useQueryClient()

  return React.useCallback(
    async (actor: string) => {
      const res = await queryClient.fetchQuery({
        staleTime: STALE.MINUTES.ONE,
        queryKey: suggestedFollowsByActorQueryKey(actor),
        queryFn: async () => {
          const res =
            await getAgent().app.bsky.graph.getSuggestedFollowsByActor({
              actor: actor,
            })
          return res.data
        },
      })

      return res
    },
    [queryClient],
  )
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
    queryKey: ['suggested-follows'],
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
        queryKey: ['suggested-follows-by-actor'],
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
