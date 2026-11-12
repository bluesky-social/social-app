import {useInfiniteQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient, useSession} from '#/state/session'
import {app} from '#/lexicons'
import {type ActorProfiles, fetchActorProfiles} from './actorProfiles'

const useActivityTimelineQueryRoot = 'useActivityTimelineQuery'

export type ActivityTimelinePage =
  app.bsky.unspecced.getAtmosphereTimeline.$OutputBody & {
    /** TEMPORARY: see `actorProfiles.ts`. */
    profiles: ActorProfiles
  }

export function useActivityTimelineQuery() {
  const client = useAppviewClient()
  const {currentAccount} = useSession()
  const viewer = currentAccount?.did

  return useInfiniteQuery({
    queryKey: createQueryKey(useActivityTimelineQueryRoot, {viewer}),
    enabled: !!viewer,
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
  })
}
