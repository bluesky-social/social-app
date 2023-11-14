import {AppBskyActorGetSuggestions, moderateProfile} from '@atproto/api'
import {
  useInfiniteQuery,
  useMutation,
  InfiniteData,
  QueryKey,
} from '@tanstack/react-query'

import {useSession} from '#/state/session'
import {useModerationOpts} from '#/state/queries/preferences'

export const suggestedFollowsQueryKey = ['suggested-follows']

export function useSuggestedFollowsQuery() {
  const {agent, currentAccount} = useSession()
  const moderationOpts = useModerationOpts()

  return useInfiniteQuery<
    AppBskyActorGetSuggestions.OutputSchema,
    Error,
    InfiniteData<AppBskyActorGetSuggestions.OutputSchema>,
    QueryKey,
    string | undefined
  >({
    enabled: !!moderationOpts,
    queryKey: suggestedFollowsQueryKey,
    queryFn: async ({pageParam}) => {
      const res = await agent.app.bsky.actor.getSuggestions({
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

export function useGetSuggestedFollowersByActor() {
  const {agent} = useSession()

  return useMutation({
    mutationFn: async (actor: string) => {
      const res = await agent.app.bsky.graph.getSuggestedFollowsByActor({
        actor: actor,
      })

      return res.data
    },
  })
}
