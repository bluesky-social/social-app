import {useQuery} from '@tanstack/react-query'
import {useSession} from '../session'

export const RQKEY = (did: string) => ['profile-extra-info', did]

/**
 * Fetches some additional information for the profile screen which
 * is not available in the API's ProfileView
 */
export function useProfileExtraInfoQuery(did: string) {
  const {agent} = useSession()
  return useQuery({
    queryKey: RQKEY(did),
    async queryFn() {
      const [listsRes, feedsRes] = await Promise.all([
        agent.app.bsky.graph.getLists({
          actor: did,
          limit: 1,
        }),
        agent.app.bsky.feed.getActorFeeds({
          actor: did,
          limit: 1,
        }),
      ])
      return {
        hasLists: listsRes.data.lists.length > 0,
        hasFeedgens: feedsRes.data.feeds.length > 0,
      }
    },
  })
}
