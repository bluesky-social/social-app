import {AccordionAnimation} from '#/lib/custom-animations/AccordionAnimation'
import {useSuggestedFollowsByActorWithDismiss} from '#/state/queries/suggested-follows'
import {ProfileGrid} from '#/components/FeedInterstitials'

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
