import {isScrollForwarderAvailable} from '@bsky.app/react-native-scroll-forwarder'

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

  // OTA bundles must preserve the exclusion on binaries without native forwarding.
  if (IS_ANDROID && !isScrollForwarderAvailable) return null

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
