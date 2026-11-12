import {useInfiniteQuery} from '@tanstack/react-query'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient, useSession} from '#/state/session'
import {app} from '#/lexicons'
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
 * moderation runs in `select`, so a change to moderation settings re-filters
 * without a refetch.
 */
export function useActivityTimelineQuery() {
  const client = useAppviewClient()
  const {currentAccount} = useSession()
  const viewer = currentAccount?.did
  const moderationOpts = useModerationOpts()

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
        ? data.pages.map((page, pageIndex) =>
            toActivityRows(page.feed, page.profiles, pageIndex, moderationOpts),
          )
        : [],
    }),
  })
}
