import {useMemo} from 'react'
import {useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useOnboardingSuggestedStarterPacksQuery as useBlueskyOnboardingSuggestedStarterPacksQuery} from '#/state/queries/useOnboardingSuggestedStarterPacksQuery'
import {createQueryKey} from '#/state/queries/util'
import {useAgent} from '#/state/session'

/**
 * Eurosky fork: curated onboarding starter packs, layered on top of Bluesky's.
 *
 * Our curated packs are shown FIRST, then Bluesky's appview-suggested packs are
 * appended (deduped by uri). So an empty or sparse curated set still yields a
 * full screen - we just float our packs to the top.
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
export const EUROSKY_SUGGESTED_STARTER_PACKS: string[] = [
  // EUolifant 🇪🇺🐘 / #EUtop100
  'at://did:plc:cssjaypzy6r362a35ux4f764/app.bsky.graph.starterpack/3lcbn566ouq25',
  // eurosky.social
  'at://did:plc:ooensn4mr5mhznzypvxelfa3/app.bsky.graph.starterpack/3m5gorny6gr24',
]

const euroskySuggestedStarterPacksQueryKeyRoot =
  'eurosky-suggested-starter-packs'

export function useEuroskyOnboardingSuggestedStarterPacks(props: {
  enabled?: boolean
  overrideInterests?: string[]
}) {
  const agent = useAgent()

  const ours = useQuery({
    staleTime: STALE.MINUTES.THREE,
    queryKey: createQueryKey(euroskySuggestedStarterPacksQueryKeyRoot, {}),
    enabled:
      props.enabled !== false && EUROSKY_SUGGESTED_STARTER_PACKS.length > 0,
    queryFn: async () => {
      // allSettled so one bad/unavailable pack doesn't drop the rest.
      const results = await Promise.allSettled(
        EUROSKY_SUGGESTED_STARTER_PACKS.map(uri =>
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
    const ourUris = new Set(ourPacks.map(p => p.uri))
    const bskyPacks = (bluesky.data?.starterPacks ?? []).filter(
      p => !ourUris.has(p.uri),
    )
    const merged = [...ourPacks, ...bskyPacks]

    const oursPending =
      EUROSKY_SUGGESTED_STARTER_PACKS.length > 0 && ours.isLoading
    const settled = !oursPending && !bluesky.isLoading
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
  }, [ours, bluesky])
}
