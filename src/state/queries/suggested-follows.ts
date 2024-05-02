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
} from '@tanstack/react-query'

import {
  aggregateUserInterests,
  createBskyTopicsHeader,
} from '#/lib/api/feed/utils'
import {getContentLanguages} from '#/state/preferences/languages'
import {STALE} from '#/state/queries'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useAgent, useSession} from '#/state/session'
import {useModerationOpts} from '../preferences/moderation-opts'

const suggestedFollowsQueryKeyRoot = 'suggested-follows'
const suggestedFollowsQueryKey = [suggestedFollowsQueryKeyRoot]

const suggestedFollowsByActorQueryKeyRoot = 'suggested-follows-by-actor'
const suggestedFollowsByActorQueryKey = (did: string) => [
  suggestedFollowsByActorQueryKeyRoot,
  did,
]

export function useSuggestedFollowsQuery() {
  const {currentAccount} = useSession()
  const {getAgent} = useAgent()
  const moderationOpts = useModerationOpts()
  const {data: preferences} = usePreferencesQuery()

  return useInfiniteQuery<
    AppBskyActorGetSuggestions.OutputSchema,
    Error,
    InfiniteData<AppBskyActorGetSuggestions.OutputSchema>,
    QueryKey,
    string | undefined
  >({
    enabled: !!moderationOpts && !!preferences,
    staleTime: STALE.HOURS.ONE,
    queryKey: suggestedFollowsQueryKey,
    queryFn: async ({pageParam}) => {
      const contentLangs = getContentLanguages().join(',')
      const res = await getAgent().app.bsky.actor.getSuggestions(
        {
          limit: 25,
          cursor: pageParam,
        },
        {
          headers: {
            ...createBskyTopicsHeader(aggregateUserInterests(preferences)),
            'Accept-Language': contentLangs,
          },
        },
      )

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
  const {getAgent} = useAgent()
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
