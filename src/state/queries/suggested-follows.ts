import React from 'react'
import {
  AppBskyActorGetSuggestions,
  AppBskyGraphGetSuggestedFollowsByActor,
  moderateProfile,
} from '@atproto/api'
import {
  useInfiniteQuery,
  useQueryClient,
  useQuery,
  InfiniteData,
  QueryKey,
} from '@tanstack/react-query'

import {useSession, getAgent} from '#/state/session'
import {useModerationOpts} from '#/state/queries/preferences'
import {STALE} from '#/state/queries'

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
          actor => !moderateProfile(actor, moderationOpts!).account.filter,
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
        staleTime: 60 * 1000,
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
