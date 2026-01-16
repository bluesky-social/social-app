import React from 'react'
import {type AppBskyActorDefs} from '@atproto/api'

import {AccordionAnimation} from '#/lib/custom-animations/AccordionAnimation'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {
  useSuggestedFollowsByActorQuery,
  useSuggestedFollowsQuery,
} from '#/state/queries/suggested-follows'
import {useBreakpoints} from '#/alf'
import {ProfileGrid} from '#/components/FeedInterstitials'
import {IS_ANDROID} from '#/env'

const DISMISS_ANIMATION_DURATION = 200

export function ProfileHeaderSuggestedFollows({actorDid}: {actorDid: string}) {
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

  const [dismissedDids, setDismissedDids] = React.useState<Set<string>>(
    new Set(),
  )
  const [dismissingDids, setDismissingDids] = React.useState<Set<string>>(
    new Set(),
  )

  const onDismiss = React.useCallback((did: string) => {
    // Start the fade animation
    setDismissingDids(prev => new Set(prev).add(did))
    // After animation completes, actually remove from list
    setTimeout(() => {
      setDismissedDids(prev => new Set(prev).add(did))
      setDismissingDids(prev => {
        const next = new Set(prev)
        next.delete(did)
        return next
      })
    }, DISMISS_ANIMATION_DURATION)
  }, [])

  // Combine profiles from the actor-specific query with fallback suggestions
  const allProfiles = React.useMemo(() => {
    const actorProfiles = data?.suggestions ?? []
    const fallbackProfiles =
      moreSuggestions?.pages.flatMap(page => page.actors) ?? []

    // Dedupe by did, preferring actor-specific profiles
    const seen = new Set<string>()
    const combined: AppBskyActorDefs.ProfileView[] = []

    for (const profile of actorProfiles) {
      if (!seen.has(profile.did)) {
        seen.add(profile.did)
        combined.push(profile)
      }
    }

    for (const profile of fallbackProfiles) {
      if (!seen.has(profile.did) && profile.did !== actorDid) {
        seen.add(profile.did)
        combined.push(profile)
      }
    }

    return combined
  }, [data?.suggestions, moreSuggestions?.pages, actorDid])

  const filteredProfiles = React.useMemo(() => {
    return allProfiles.filter(p => !dismissedDids.has(p.did))
  }, [allProfiles, dismissedDids])

  // Fetch more when running low
  React.useEffect(() => {
    if (
      moderationOpts &&
      filteredProfiles.length < maxLength &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage()
    }
  }, [
    filteredProfiles.length,
    maxLength,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    moderationOpts,
  ])

  return (
    <ProfileGrid
      isSuggestionsLoading={isLoading}
      profiles={filteredProfiles}
      totalProfileCount={allProfiles.length}
      recId={data?.recId}
      error={error}
      viewContext="profileHeader"
      onDismiss={onDismiss}
      dismissingDids={dismissingDids}
    />
  )
}

export function AnimatedProfileHeaderSuggestedFollows({
  isExpanded,
  actorDid,
}: {
  isExpanded: boolean
  actorDid: string
}) {
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

  const [dismissedDids, setDismissedDids] = React.useState<Set<string>>(
    new Set(),
  )
  const [dismissingDids, setDismissingDids] = React.useState<Set<string>>(
    new Set(),
  )

  const onDismiss = React.useCallback((did: string) => {
    // Start the fade animation
    setDismissingDids(prev => new Set(prev).add(did))
    // After animation completes, actually remove from list
    setTimeout(() => {
      setDismissedDids(prev => new Set(prev).add(did))
      setDismissingDids(prev => {
        const next = new Set(prev)
        next.delete(did)
        return next
      })
    }, DISMISS_ANIMATION_DURATION)
  }, [])

  // Combine profiles from the actor-specific query with fallback suggestions
  const allProfiles = React.useMemo(() => {
    const actorProfiles = data?.suggestions ?? []
    const fallbackProfiles =
      moreSuggestions?.pages.flatMap(page => page.actors) ?? []

    // Dedupe by did, preferring actor-specific profiles
    const seen = new Set<string>()
    const combined: AppBskyActorDefs.ProfileView[] = []

    for (const profile of actorProfiles) {
      if (!seen.has(profile.did)) {
        seen.add(profile.did)
        combined.push(profile)
      }
    }

    for (const profile of fallbackProfiles) {
      if (!seen.has(profile.did) && profile.did !== actorDid) {
        seen.add(profile.did)
        combined.push(profile)
      }
    }

    return combined
  }, [data?.suggestions, moreSuggestions?.pages, actorDid])

  const filteredProfiles = React.useMemo(() => {
    return allProfiles.filter(p => !dismissedDids.has(p.did))
  }, [allProfiles, dismissedDids])

  // Fetch more when running low
  React.useEffect(() => {
    if (
      moderationOpts &&
      filteredProfiles.length < maxLength &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage()
    }
  }, [
    filteredProfiles.length,
    maxLength,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    moderationOpts,
  ])

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
        recId={data?.recId}
        error={error}
        viewContext="profileHeader"
        onDismiss={onDismiss}
        dismissingDids={dismissingDids}
        isVisible={isExpanded}
      />
    </AccordionAnimation>
  )
}
