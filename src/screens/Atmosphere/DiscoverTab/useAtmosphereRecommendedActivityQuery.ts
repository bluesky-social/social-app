import {type ModerationUI} from '@bsky/sdk/moderation'
import {type QueryClient, useQuery} from '@tanstack/react-query'

import {
  aggregateUserInterests,
  createBskyAppviewHeaders,
  createBskyTopicsHeader,
} from '#/lib/api/feed/utils'
import {useApplyProfileShadow} from '#/state/cache/profile-shadow'
import {useLanguagePrefs} from '#/state/preferences/languages'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {STALE} from '#/state/queries'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient} from '#/state/session'
import {
  isActivityHidden,
  moderateActivity,
} from '#/screens/Atmosphere/ActivityTab/moderation'
import {
  type ActivityContent,
  toViewContent,
} from '#/screens/Atmosphere/ActivityTab/rows'
import {
  findProfiles,
  mapViewProfiles,
} from '#/screens/Atmosphere/data/mapProfiles'
import {app} from '#/lexicons'
import type * as bsky from '#/types/bsky'

const useAtmosphereRecommendedActivityQueryRoot =
  'useAtmosphereRecommendedActivityQuery'

type RecommendedActivity =
  app.bsky.unspecced.getAtmosphereRecommendedActivity.$OutputBody

export type DiscoverItem = {
  content: ActivityContent
  moderation: ModerationUI
}

/**
 * A single batch in recommendation order. Keep the raw response in the cache
 * and apply profile shadows and moderation in `select`, as on Following.
 */
export function useAtmosphereRecommendedActivityQuery() {
  const client = useAppviewClient()
  const {contentLanguages} = useLanguagePrefs()
  const {data: preferences} = usePreferencesQuery()
  const acceptLanguage = contentLanguages.join(',')
  const userInterests = aggregateUserInterests(preferences)
  const moderationOpts = useModerationOpts()
  const applyProfileShadow = useApplyProfileShadow()

  return useQuery({
    queryKey: createQueryKey(useAtmosphereRecommendedActivityQueryRoot, {
      did: client.did,
      acceptLanguage,
      userInterests,
    }),
    enabled: !!moderationOpts,
    staleTime: STALE.MINUTES.ONE,
    retry: 1,
    queryFn: ({signal}) =>
      client.call(
        app.bsky.unspecced.getAtmosphereRecommendedActivity,
        {
          limit: 25,
          ...(contentLanguages.length ? {langs: contentLanguages} : {}),
        },
        {
          signal,
          headers: {
            ...createBskyAppviewHeaders(),
            ...createBskyTopicsHeader(userInterests),
            'Accept-Language': acceptLanguage,
          },
        },
      ),
    select: data => ({
      ...data,
      items: moderationOpts
        ? data.items.flatMap(({view}): DiscoverItem[] => {
            const content = toViewContent(
              mapViewProfiles(view, applyProfileShadow),
            )
            if (!content) return []
            const moderation = moderateActivity(
              content,
              undefined,
              moderationOpts,
            )
            return isActivityHidden(moderation) ? [] : [{content, moderation}]
          })
        : [],
    }),
  })
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<bsky.profile.AnyProfileView, void> {
  const queryDatas = queryClient.getQueriesData<RecommendedActivity>({
    queryKey: [useAtmosphereRecommendedActivityQueryRoot],
  })
  for (const [, data] of queryDatas) {
    for (const {view} of data?.items ?? []) {
      yield* findProfiles(did, map => mapViewProfiles(view, map))
    }
  }
}
