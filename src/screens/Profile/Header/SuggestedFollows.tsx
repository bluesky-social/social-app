import {useCallback, useEffect, useMemo, useState} from 'react'

import {AccordionAnimation} from '#/lib/custom-animations/AccordionAnimation'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {
  useSuggestedFollowsByActorQuery,
  useSuggestedFollowsQuery,
} from '#/state/queries/suggested-follows'
import {useBreakpoints} from '#/alf'
import {ProfileGrid} from '#/components/FeedInterstitials'
import {IS_ANDROID} from '#/env'
import type * as bsky from '#/types/bsky'

export function ProfileHeaderSuggestedFollows({
  isExpanded,
  actorDid,
}: {
  isExpanded: boolean
  actorDid: string
}) {
  const {allProfiles, filteredProfiles, onDismiss, isLoading, error} =
    useProfileHeaderSuggestions(actorDid)

  if (!allProfiles.length && !isLoading) return null

  /* NOTE (caidanw):
   * Android does not work well with this feature yet.
   * This issue stems from Android not allowing dragging on clickable elements in the profile header.
   * Blocking the ability to scroll on Android is too much of a trade-off for now.
   **/
  if (IS_ANDROID) return null

  return (
    <AccordionAnimation isExpanded={isExpanded}>
      <ProfileGrid
        isSuggestionsLoading={isLoading}
        profiles={filteredProfiles}
        totalProfileCount={allProfiles.length}
        error={error}
        viewContext="profileHeader"
        onDismiss={onDismiss}
        isVisible={isExpanded}
      />
    </AccordionAnimation>
  )
}

function useProfileHeaderSuggestions(actorDid: string) {
  const {gtMobile} = useBreakpoints()
  const moderationOpts = useModerationOpts()
  const maxLength = gtMobile ? 4 : 12
  const {isLoading, data, error} = useSuggestedFollowsByActorQuery({
    did: actorDid,
  })
  const {
    data: moreSuggestions,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSuggestedFollowsQuery({limit: 25})

  const [dismissedDids, setDismissedDids] = useState<Set<string>>(new Set())

  const onDismiss = useCallback((did: string) => {
    setDismissedDids(prev => new Set(prev).add(did))
  }, [])

  // Combine profiles from the actor-specific query with fallback suggestions
  const allProfiles = useMemo(() => {
    const actorProfiles = data?.suggestions ?? []
    const fallbackProfiles =
      moreSuggestions?.pages.flatMap(page =>
        page.actors.map(actor => ({actor, recId: page.recId})),
      ) ?? []

    // Dedupe by did, preferring actor-specific profiles
    const seen = new Set<string>()
    const combined: {actor: bsky.profile.AnyProfileView; recId?: number}[] = []

    for (const profile of actorProfiles) {
      if (!seen.has(profile.did)) {
        seen.add(profile.did)
        combined.push({actor: profile, recId: data?.recId})
      }
    }

    for (const profile of fallbackProfiles) {
      if (!seen.has(profile.actor.did) && profile.actor.did !== actorDid) {
        seen.add(profile.actor.did)
        combined.push(profile)
      }
    }

    return combined
  }, [data?.suggestions, moreSuggestions?.pages, actorDid, data?.recId])

  const filteredProfiles = useMemo(() => {
    return allProfiles.filter(p => !dismissedDids.has(p.actor.did))
  }, [allProfiles, dismissedDids])

  // Fetch more when running low
  useEffect(() => {
    if (
      moderationOpts &&
      filteredProfiles.length < maxLength &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      void fetchNextPage()
    }
  }, [
    filteredProfiles.length,
    maxLength,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    moderationOpts,
  ])

  return {
    allProfiles,
    filteredProfiles,
    onDismiss,
    isLoading,
    error,
  }
}
