import {useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {getAgent} from '#/state/session'

// TODO refactor invalidate on mutate?
export const RQKEY = (did: string) => ['profile-extra-info', did]

/**
 * Fetches some additional information for the profile screen which
 * is not available in the API's ProfileView
 */
export function useProfileExtraInfoQuery(did: string) {
  return useQuery({
    staleTime: STALE.MINUTES.ONE,
    queryKey: RQKEY(did),
    async queryFn() {
      const [listsRes, feedsRes] = await Promise.all([
        getAgent().app.bsky.graph.getLists({
          actor: did,
          limit: 1,
        }),
        getAgent().app.bsky.feed.getActorFeeds({
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
