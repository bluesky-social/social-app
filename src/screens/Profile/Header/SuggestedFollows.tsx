import {AccordionAnimation} from '#/lib/custom-animations/AccordionAnimation'
import {useSuggestedFollowsByActorWithDismiss} from '#/state/queries/suggested-follows'
import {ProfileGrid} from '#/components/FeedInterstitials'
import {IS_ANDROID} from '#/env'

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
    useSuggestedFollowsByActorWithDismiss({did: actorDid})

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
