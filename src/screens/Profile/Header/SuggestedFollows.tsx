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
