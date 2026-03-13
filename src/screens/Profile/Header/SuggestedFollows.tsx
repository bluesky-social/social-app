import {useCallback, useMemo} from 'react'
import {useQueryClient} from '@tanstack/react-query'

import {AccordionAnimation} from '#/lib/custom-animations/AccordionAnimation'
import {
  suggestedFollowsByActorQueryKey,
  useSuggestedFollowsByActorQuery,
} from '#/state/queries/suggested-follows'
import {ProfileGrid} from '#/components/FeedInterstitials'
import {IS_ANDROID} from '#/env'
import type * as bsky from '#/types/bsky'

export function ProfileHeaderSuggestedFollows({
  isExpanded,
  actorDid,
  onRequestHide,
}: {
  isExpanded: boolean
  actorDid: string
  onRequestHide: () => void
}) {
  const {profiles, onDismiss, isLoading, error} =
    useProfileHeaderSuggestions(actorDid)

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
        profiles={profiles}
        totalProfileCount={profiles.length}
        error={error}
        viewContext="profileHeader"
        onDismiss={onDismiss}
        isVisible={isExpanded}
        onRequestHide={onRequestHide}
      />
    </AccordionAnimation>
  )
}

function useProfileHeaderSuggestions(actorDid: string) {
  const {isLoading, data, error} = useSuggestedFollowsByActorQuery({
    did: actorDid,
  })
  const queryClient = useQueryClient()

  const onDismiss = useCallback(
    (dismissedDid: string) => {
      queryClient.setQueryData(
        suggestedFollowsByActorQueryKey(actorDid),
        (previous: typeof data) => {
          if (!previous) return previous
          return {
            ...previous,
            suggestions: previous.suggestions.filter(
              s => s.did !== dismissedDid,
            ),
          }
        },
      )
    },
    [actorDid, queryClient],
  )

  const profiles = useMemo(() => {
    return (data?.suggestions ?? []).map(profile => ({
      actor: profile as bsky.profile.AnyProfileView,
      recId: data?.recId,
    }))
  }, [data?.suggestions, data?.recId])

  return {
    profiles,
    onDismiss,
    isLoading,
    error,
  }
}
