import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query'

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
import {useAppviewClient, useSession} from '#/state/session'
import {
  isActivityHidden,
  moderateActivity,
} from '#/screens/Atmosphere/ActivityTab/moderation'
import {
  toActivityRows,
  toViewContent,
} from '#/screens/Atmosphere/ActivityTab/rows'
import {getAssociatedProfile} from '#/screens/Atmosphere/data/exploreData'
import {
  findProfiles,
  mapTimelinePageProfiles,
  mapViewProfiles,
} from '#/screens/Atmosphere/data/mapProfiles'
import {type ForYouItem} from '#/screens/Atmosphere/ForYouTab/useAtmosphereRecommendedActivityQuery'
import {app} from '#/lexicons'
import type * as bsky from '#/types/bsky'
import {mixCombinedPages, seededRandom} from './mix'

const useCombinedFeedQueryRoot = 'useCombinedFeedQuery'

/** How many recommendations to fetch; the endpoint has no further pages. */
const RECOMMENDATION_LIMIT = 50

type CombinedFeedPage = {
  timeline: app.bsky.unspecced.getAtmosphereTimelineV2.$OutputBody
  /**
   * Only on the first page. Unset if the request failed, so activity still
   * loads.
   */
  recommendations?: app.bsky.unspecced.getAtmosphereRecommendedActivity.$OutputBody
}

/**
 * The Activity timeline with recommended activity mixed in, then the rest of
 * the recommendations once activity runs out (see `mixCombinedPages`). The
 * cache holds raw responses, and profile shadows, moderation and mixing apply
 * in `select`, as on Activity and For You.
 */
export function useCombinedFeedQuery() {
  const client = useAppviewClient()
  const {currentAccount} = useSession()
  const viewer = currentAccount?.did
  const {contentLanguages} = useLanguagePrefs()
  const {data: preferences} = usePreferencesQuery()
  const acceptLanguage = contentLanguages.join(',')
  const userInterests = aggregateUserInterests(preferences)
  const moderationOpts = useModerationOpts()
  const applyProfileShadow = useApplyProfileShadow()

  const fetchRecommendations = (signal: AbortSignal) =>
    client.call(
      app.bsky.unspecced.getAtmosphereRecommendedActivity,
      {
        limit: RECOMMENDATION_LIMIT,
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
    )

  return useInfiniteQuery({
    queryKey: createQueryKey(useCombinedFeedQueryRoot, {
      viewer,
      acceptLanguage,
      userInterests,
    }),
    // Wait for moderation opts so hidden cards never flash in.
    enabled: !!viewer && !!moderationOpts,
    queryFn: async ({pageParam, signal}): Promise<CombinedFeedPage> => {
      const timelineRequest = client.call(
        app.bsky.unspecced.getAtmosphereTimelineV2,
        {cursor: pageParam},
        {signal},
      )
      if (pageParam) return {timeline: await timelineRequest}
      const [timeline, recommendations] = await Promise.all([
        timelineRequest,
        fetchRecommendations(signal).catch(() => undefined),
      ])
      return {timeline, recommendations}
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: page => page.timeline.cursor,
    staleTime: STALE.SECONDS.FIFTEEN,
    select: data => {
      if (!moderationOpts) {
        return {pages: [], pageParams: [], recommendedItems: []}
      }
      const recommendations = data.pages[0]?.recommendations
      const seen = new Set<string>()
      const recommendedItems = (recommendations?.items ?? []).flatMap(
        ({view}): ForYouItem[] => {
          const content = toViewContent(
            mapViewProfiles(view, applyProfileShadow),
          )
          if (!content || seen.has(content.view.uri)) return []
          const moderation = moderateActivity(
            content,
            getAssociatedProfile(content.view.associatedProfiles),
            moderationOpts,
          )
          if (isActivityHidden(moderation)) return []
          // Hydrated URLs can repeat even for different source records.
          seen.add(content.view.uri)
          return [{content, moderation, reqId: recommendations?.recIdStr ?? ''}]
        },
      )
      const mixed = mixCombinedPages({
        activityPages: data.pages.map((page, pageIndex) =>
          toActivityRows(
            mapTimelinePageProfiles(page.timeline, applyProfileShadow),
            pageIndex,
            moderationOpts,
          ),
        ),
        recommendations: recommendedItems,
        isLastPage: !data.pages.at(-1)?.timeline.cursor,
        // New spacing per recommendation batch, stable within it.
        random: seededRandom(recommendations?.recIdStr ?? ''),
      })
      return {
        pages: mixed.pages,
        pageParams: data.pageParams,
        /** The recommendations shown, in feed order, for feed feedback. */
        recommendedItems: mixed.recommendedItems,
        recIdStr: recommendations?.recIdStr,
      }
    },
  })
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<bsky.profile.AnyProfileView, void> {
  const queryDatas = queryClient.getQueriesData<InfiniteData<CombinedFeedPage>>(
    {queryKey: [useCombinedFeedQueryRoot]},
  )
  for (const [, data] of queryDatas) {
    for (const page of data?.pages ?? []) {
      yield* findProfiles(did, map =>
        mapTimelinePageProfiles(page.timeline, map),
      )
      for (const {view} of page.recommendations?.items ?? []) {
        yield* findProfiles(did, map => mapViewProfiles(view, map))
      }
    }
  }
}
