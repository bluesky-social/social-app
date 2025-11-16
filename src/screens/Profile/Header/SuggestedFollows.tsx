import {AccordionAnimation} from '#/lib/custom-animations/AccordionAnimation'
import {isAndroid} from '#/platform/detection'
import {useSuggestedFollowsByActorQuery} from '#/state/queries/suggested-follows'
import {ProfileGrid} from '#/components/FeedInterstitials'

export function ProfileHeaderSuggestedFollows({actorDid}: {actorDid: string}) {
  const {isLoading, data, error} = useSuggestedFollowsByActorQuery({
    did: actorDid,
  })

  return (
    <ProfileGrid
      isSuggestionsLoading={isLoading}
      profiles={data?.suggestions ?? []}
      recId={data?.recId}
      error={error}
      viewContext="profileHeader"
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
  const {isLoading, data, error} = useSuggestedFollowsByActorQuery({
    did: actorDid,
  })

  if (!data?.suggestions?.length) return null

  /* NOTE (caidanw):
   * Android does not work well with this feature yet.
   * This issue stems from Android not allowing dragging on clickable elements in the profile header.
   * Blocking the ability to scroll on Android is too much of a trade-off for now.
   **/
  if (isAndroid) return null

  return (
    <AccordionAnimation isExpanded={isExpanded}>
      <ProfileGrid
        isSuggestionsLoading={isLoading}
        profiles={data.suggestions}
        recId={data.recId}
        error={error}
        viewContext="profileHeader"
      />
    </AccordionAnimation>
  )
}
