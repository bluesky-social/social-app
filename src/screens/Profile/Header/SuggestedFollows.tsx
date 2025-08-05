import {AccordionAnimation} from '#/lib/custom-animations/AccordionAnimation'
import {useGate} from '#/lib/statsig/statsig'
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
  const gate = useGate()
  if (!gate('post_follow_profile_suggested_accounts')) return null

  return (
    <AccordionAnimation isExpanded={isExpanded}>
      <ProfileHeaderSuggestedFollows actorDid={actorDid} />
    </AccordionAnimation>
  )
}
