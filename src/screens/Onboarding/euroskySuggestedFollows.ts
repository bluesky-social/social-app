import {useMemo} from 'react'
import {type AppBskyActorDefs, type AtpAgent} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

import {useLanguagePrefs} from '#/state/preferences'
import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAgent} from '#/state/session'
import {selectPacksForInterest} from '#/screens/Onboarding/euroskyCuratedPacks'
import {useSuggestedOnboardingUsers as useBlueskySuggestedOnboardingUsers} from '#/screens/Search/util/useSuggestedOnboardingUsers'

/**
 * Eurosky fork: curated onboarding follow suggestions, layered on top of
 * Bluesky's.
 *
 * For a selected interest we resolve the MEMBERS of the curated starter packs
 * tagged with that interest and the user's language (see `euroskyCuratedPacks`)
 * into a flat follow list - we show people, not the pack itself. For the "All"
 * tab (no interest) and any interest without curated packs we fall back to the
 * hand-picked handle list below. Our picks are shown FIRST, then Bluesky's
 * appview suggestions are appended (deduped) so the screen always fills.
 *
 * Upstream-merge note: the ONLY upstream touch point is a one-line import swap
 * in StepSuggestedAccounts. All fork logic lives here, and we reuse the upstream
 * `useSuggestedOnboardingUsers` (untouched) for the Bluesky portion. The hook
 * mirrors the upstream signature + return shape.
 */
export const EUROSKY_SUGGESTED_FOLLOWS: Record<string, string[]> = {
  // Backs the "All" tab. Add an interest-id key here to also inject hand-picked
  // handles into that specific topic; interests without an entry (and without
  // curated packs) just show Bluesky's suggestions.
  default: ['eurosky.social'],
}

// How many members to pull per pack, and the overall cap for the merged list.
const MEMBERS_PER_PACK = 12
const MEMBERS_TOTAL = 50

const euroskySuggestedFollowsQueryKeyRoot = 'eurosky-suggested-follows'

/**
 * Resolve a set of starter packs into a deduped, capped list of member
 * profiles. allSettled throughout so one unavailable pack/list never drops the
 * rest.
 */
async function fetchPackMembers(agent: AtpAgent, packUris: string[]) {
  const packs = await Promise.allSettled(
    packUris.map(uri =>
      agent.app.bsky.graph.getStarterPack({starterPack: uri}),
    ),
  )
  const listUris = packs.flatMap(r =>
    r.status === 'fulfilled' && r.value.data.starterPack.list
      ? [r.value.data.starterPack.list.uri]
      : [],
  )
  const lists = await Promise.allSettled(
    listUris.map(uri =>
      agent.app.bsky.graph.getList({list: uri, limit: MEMBERS_PER_PACK}),
    ),
  )

  const seen = new Set<string>()
  const members: AppBskyActorDefs.ProfileView[] = []
  for (const r of lists) {
    if (r.status !== 'fulfilled') continue
    for (const item of r.value.data.items) {
      const profile = item.subject
      if (seen.has(profile.did)) continue
      seen.add(profile.did)
      members.push(profile)
      if (members.length >= MEMBERS_TOTAL) return members
    }
  }
  return members
}

export function useEuroskySuggestedOnboardingUsers(props: {
  category?: string | null
  search?: boolean
  overrideInterests: string[]
}) {
  const agent = useAgent()
  const {category = null} = props
  // Filter by the app/UI language the user explicitly set, NOT contentLanguages
  // (which defaults from the device locale and can include languages the user
  // never chose - e.g. German showing for an English user).
  const {appLanguage} = useLanguagePrefs()

  // Prefer curated-pack members for the selected interest + language.
  const packUris = category
    ? selectPacksForInterest(category, [appLanguage])
    : []
  const usePacks = packUris.length > 0

  // Our hand-picked handles back the "All" tab (no interest selected). For a
  // specific interest we only inject them if that interest has its OWN curated
  // list - otherwise we leave it to packs + Bluesky, so eurosky.social doesn't
  // show up under every uncurated topic (e.g. sports). getProfiles accepts at
  // most 25 actors per call.
  const handleList = category
    ? EUROSKY_SUGGESTED_FOLLOWS[category]
    : EUROSKY_SUGGESTED_FOLLOWS.default
  const handles = usePacks ? [] : (handleList ?? []).slice(0, 25)

  const hasOursSource = usePacks || handles.length > 0

  const ours = useQuery({
    staleTime: STALE.MINUTES.THREE,
    queryKey: createQueryKey(
      euroskySuggestedFollowsQueryKeyRoot,
      usePacks ? {packs: packUris} : {handles: category ?? 'default'},
    ),
    enabled: hasOursSource,
    queryFn: async () => {
      if (usePacks) return await fetchPackMembers(agent, packUris)
      const {data} = await agent.getProfiles({actors: handles})
      return data.profiles
    },
  })

  // Bluesky's appview suggestions for the same inputs (untouched upstream hook).
  const bluesky = useBlueskySuggestedOnboardingUsers(props)

  return useMemo(() => {
    const ourActors = hasOursSource ? (ours.data ?? []) : []
    const ourDids = new Set(ourActors.map(a => a.did))
    const bskyActors = (bluesky.data?.actors ?? []).filter(
      a => !ourDids.has(a.did),
    )
    const merged = [...ourActors, ...bskyActors]

    const oursPending = hasOursSource && ours.isLoading
    const settled = !oursPending && !bluesky.isLoading
    const hasAny = merged.length > 0

    return {
      // Keep Bluesky's recId so its suggestions keep their analytics tagging.
      data:
        ours.data || bluesky.data
          ? {actors: merged, recId: bluesky.data?.recId}
          : undefined,
      // Stay in the loading state until BOTH our packs and Bluesky's
      // suggestions have settled, so the list appears all at once instead of
      // our members rendering first and Bluesky's popping in after.
      isLoading: !settled,
      // Surface an error only if everything settled with nothing to show.
      error: !hasAny && settled ? (bluesky.error ?? ours.error) : undefined,
      isRefetching: ours.isRefetching || bluesky.isRefetching,
      refetch: () => {
        void ours.refetch()
        void bluesky.refetch()
      },
    }
  }, [hasOursSource, ours, bluesky])
}
