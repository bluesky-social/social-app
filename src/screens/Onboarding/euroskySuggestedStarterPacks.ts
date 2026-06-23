import {useMemo} from 'react'
import {useQuery} from '@tanstack/react-query'

import {useLanguagePrefs} from '#/state/preferences'
import {STALE} from '#/state/queries'
import {useOnboardingSuggestedStarterPacksQuery as useBlueskyOnboardingSuggestedStarterPacksQuery} from '#/state/queries/useOnboardingSuggestedStarterPacksQuery'
import {createQueryKey} from '#/state/queries/util'
import {useAgent} from '#/state/session'
import {selectStep3Packs} from '#/screens/Onboarding/euroskyCuratedPacks'

/**
 * Eurosky fork: curated onboarding starter packs, layered on top of Bluesky's.
 *
 * We surface a curated showcase (see `selectStep3Packs`), floating the user's
 * language-matched regional packs ahead of the pan-EU / global set. Our packs
 * are shown FIRST, then Bluesky's appview-suggested packs are appended (deduped
 * by uri) so the screen still fills if our set is sparse.
 *
 * Each curated pack is hydrated via `getStarterPack` (singular) because the
 * card needs the full `StarterPackView` (`list` + `listItemsSample`), which the
 * plural `getStarterPacks` (StarterPackViewBasic) omits.
 *
 * Upstream-merge note: the ONLY upstream touch points are a one-line import
 * swap in StepSuggestedStarterpacks and dropping the English-only gate in
 * Onboarding/index.tsx. The upstream query is reused (untouched) for Bluesky's
 * portion, and this hook mirrors its signature + return shape.
 */
const euroskySuggestedStarterPacksQueryKeyRoot =
  'eurosky-suggested-starter-packs'

export function useEuroskyOnboardingSuggestedStarterPacks(props: {
  enabled?: boolean
  overrideInterests?: string[]
}) {
  const agent = useAgent()
  // Filter by the app/UI language the user explicitly set, NOT contentLanguages
  // (which defaults from the device locale and can include languages the user
  // never chose - e.g. German showing for an English user).
  const {appLanguage} = useLanguagePrefs()
  const packUris = selectStep3Packs([appLanguage])

  const ours = useQuery({
    staleTime: STALE.MINUTES.THREE,
    queryKey: createQueryKey(euroskySuggestedStarterPacksQueryKeyRoot, {
      packs: packUris,
    }),
    enabled: props.enabled !== false && packUris.length > 0,
    queryFn: async () => {
      // allSettled so one bad/unavailable pack doesn't drop the rest.
      const results = await Promise.allSettled(
        packUris.map(uri =>
          agent.app.bsky.graph.getStarterPack({starterPack: uri}),
        ),
      )
      return results.flatMap(r =>
        r.status === 'fulfilled' ? [r.value.data.starterPack] : [],
      )
    },
  })

  // Bluesky's appview-suggested packs for the same inputs (untouched upstream).
  const bluesky = useBlueskyOnboardingSuggestedStarterPacksQuery(props)

  return useMemo(() => {
    const ourPacks = ours.data ?? []
    // Our curated showcase is already language-aware. Bluesky's appview
    // suggestions are NOT (it ignores Accept-Language and returns e.g. German
    // packs to English users), so only fall back to them if our set is empty
    // (network failure) - otherwise show our curated packs alone.
    const ourUris = new Set(ourPacks.map(p => p.uri))
    const bskyPacks =
      ourPacks.length > 0
        ? []
        : (bluesky.data?.starterPacks ?? []).filter(p => !ourUris.has(p.uri))
    const merged = [...ourPacks, ...bskyPacks]

    const oursPending = packUris.length > 0 && ours.isLoading
    const settled = !oursPending && (ourPacks.length > 0 || !bluesky.isLoading)
    const hasAny = merged.length > 0

    return {
      data: ours.data || bluesky.data ? {starterPacks: merged} : undefined,
      isLoading: !hasAny && !settled,
      isError: !hasAny && settled && (bluesky.isError || ours.isError),
      isRefetching: ours.isRefetching || bluesky.isRefetching,
      refetch: () => {
        void ours.refetch()
        void bluesky.refetch()
      },
    }
  }, [packUris.length, ours, bluesky])
}
