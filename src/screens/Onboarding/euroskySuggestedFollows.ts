import {useMemo} from 'react'
import {useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAgent} from '#/state/session'
import {useSuggestedOnboardingUsers as useBlueskySuggestedOnboardingUsers} from '#/screens/Search/util/useSuggestedOnboardingUsers'

/**
 * Eurosky fork: curated onboarding follow suggestions, layered on top of
 * Bluesky's.
 *
 * Our curated accounts (per interest category) are shown FIRST, then Bluesky's
 * appview suggestions are appended (deduped). So an empty or sparse curated set
 * still yields a full screen - we just float our picks to the top.
 *
 * Keys are interest ids from `#/lib/interests`; `default` backs the "All" tab
 * and is the fallback for any interest without its own list. Entries may be
 * handles or DIDs - `getProfiles` resolves either.
 *
 * Upstream-merge note: the ONLY upstream touch point is a one-line import swap
 * in StepSuggestedAccounts. All fork logic lives here, and we reuse the upstream
 * `useSuggestedOnboardingUsers` (untouched) for the Bluesky portion, so its
 * search/non-English-language behavior is preserved. The hook mirrors the
 * upstream signature + return shape.
 */
export const EUROSKY_SUGGESTED_FOLLOWS: Record<string, string[]> = {
  // "All" tab + fallback for uncurated interests.
  default: ['eurosky.social', 'flo-bit.dev'],

  // Per-interest lists, keyed by #/lib/interests ids (animals, art, books,
  // comedy, comics, culture, dev, education, finance, food, gaming, journalism,
  // movies, music, nature, news, pets, photography, politics, science, sports,
  // tech, tv, writers). Uncurated interests fall back to `default`.
  // tech: ['...'],
  // science: ['...'],
}

const euroskySuggestedFollowsQueryKeyRoot = 'eurosky-suggested-follows'

export function useEuroskySuggestedOnboardingUsers(props: {
  category?: string | null
  search?: boolean
  overrideInterests: string[]
}) {
  const agent = useAgent()
  const {category = null} = props

  // Our curated list for the selected interest, falling back to `default`.
  const key =
    category && EUROSKY_SUGGESTED_FOLLOWS[category] ? category : 'default'
  // getProfiles accepts at most 25 actors per call.
  const actors = (EUROSKY_SUGGESTED_FOLLOWS[key] ?? []).slice(0, 25)

  const ours = useQuery({
    staleTime: STALE.MINUTES.THREE,
    queryKey: createQueryKey(euroskySuggestedFollowsQueryKeyRoot, {key}),
    enabled: actors.length > 0,
    queryFn: async () => {
      const {data} = await agent.getProfiles({actors})
      return data.profiles
    },
  })

  // Bluesky's appview suggestions for the same inputs (untouched upstream hook).
  const bluesky = useBlueskySuggestedOnboardingUsers(props)

  return useMemo(() => {
    const ourActors = actors.length > 0 ? (ours.data ?? []) : []
    const ourDids = new Set(ourActors.map(a => a.did))
    const bskyActors = (bluesky.data?.actors ?? []).filter(
      a => !ourDids.has(a.did),
    )
    const merged = [...ourActors, ...bskyActors]

    const oursPending = actors.length > 0 && ours.isLoading
    const settled = !oursPending && !bluesky.isLoading
    const hasAny = merged.length > 0

    return {
      // Keep Bluesky's recId so its suggestions keep their analytics tagging.
      data:
        ours.data || bluesky.data
          ? {actors: merged, recId: bluesky.data?.recId}
          : undefined,
      // Loader only while we have nothing to show yet.
      isLoading: !hasAny && !settled,
      // Surface an error only if everything settled with nothing to show.
      error: !hasAny && settled ? (bluesky.error ?? ours.error) : undefined,
      isRefetching: ours.isRefetching || bluesky.isRefetching,
      refetch: () => {
        void ours.refetch()
        void bluesky.refetch()
      },
    }
  }, [actors.length, ours, bluesky])
}
