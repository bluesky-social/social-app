import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {useApplyProfileShadow} from '#/state/cache/profile-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient, useSession} from '#/state/session'
import {
  findProfiles,
  mapTimelinePageProfiles,
} from '#/screens/Atmosphere/data/mapProfiles'
import {app} from '#/lexicons'
import type * as bsky from '#/types/bsky'
import {type ActorProfiles, fetchActorProfiles} from './actorProfiles'
import {toActivityRows} from './rows'

const useActivityTimelineQueryRoot = 'useActivityTimelineQuery'

export type ActivityTimelinePage =
  app.bsky.unspecced.getAtmosphereTimeline.$OutputBody & {
    /** TEMPORARY: see `actorProfiles.ts`. */
    profiles: ActorProfiles
  }

/**
 * The viewer's activity timeline as rows. The cache holds raw pages, and
 * profile shadows and moderation apply in `select`, so muting someone or
 * changing moderation settings re-filters without a refetch.
 */
export function useActivityTimelineQuery() {
  const client = useAppviewClient()
  const {currentAccount} = useSession()
  const viewer = currentAccount?.did
  const moderationOpts = useModerationOpts()
  const applyProfileShadow = useApplyProfileShadow()

  return useInfiniteQuery({
    queryKey: createQueryKey(useActivityTimelineQueryRoot, {viewer}),
    // Wait for moderation opts so hidden cards never flash in.
    enabled: !!viewer && !!moderationOpts,
    queryFn: async ({pageParam}): Promise<ActivityTimelinePage> => {
      const page = await client.call(app.bsky.unspecced.getAtmosphereTimeline, {
        cursor: pageParam,
      })
      const profiles = await fetchActorProfiles(client, page.feed)
      return {...page, profiles}
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: page => page.cursor,
    staleTime: STALE.SECONDS.FIFTEEN,
    select: data => ({
      pageParams: data.pageParams,
      pages: moderationOpts
        ? data.pages.map((page, pageIndex) => {
            const {feed, profiles} = mapTimelinePageProfiles(
              page,
              applyProfileShadow,
            )
            return toActivityRows(feed, profiles, pageIndex, moderationOpts)
          })
        : [],
    }),
  })
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<bsky.profile.AnyProfileView, void> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<ActivityTimelinePage>
  >({queryKey: [useActivityTimelineQueryRoot]})
  for (const [, data] of queryDatas) {
    for (const page of data?.pages ?? []) {
      yield* findProfiles(did, map => mapTimelinePageProfiles(page, map))
    }
  }
}
