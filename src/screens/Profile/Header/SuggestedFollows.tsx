import {useCallback, useMemo, useState} from 'react'

import {AccordionAnimation} from '#/lib/custom-animations/AccordionAnimation'
import {useSuggestedFollowsByActorQuery} from '#/state/queries/suggested-follows'
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
  const {isLoading, data, error} = useSuggestedFollowsByActorQuery({
    did: actorDid,
  })

  const [dismissedDids, setDismissedDids] = useState<Set<string>>(new Set())

  const onDismiss = useCallback((did: string) => {
    setDismissedDids(prev => new Set(prev).add(did))
  }, [])

  // Combine profiles from the actor-specific query with fallback suggestions
  const allProfiles = useMemo(() => {
    const actorProfiles = data?.suggestions ?? []

    // Dedupe by did, preferring actor-specific profiles
    const seen = new Set<string>()
    const combined: {actor: bsky.profile.AnyProfileView; recId?: number}[] = []

    for (const profile of actorProfiles) {
      if (!seen.has(profile.did)) {
        seen.add(profile.did)
        combined.push({actor: profile, recId: data?.recId})
      }
    }

    return combined
  }, [data?.suggestions, data?.recId])

  const filteredProfiles = useMemo(() => {
    return allProfiles.filter(p => !dismissedDids.has(p.actor.did))
  }, [allProfiles, dismissedDids])

  return {
    allProfiles,
    filteredProfiles,
    onDismiss,
    isLoading,
    error,
  }
}
