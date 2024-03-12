import {AppBskyActorDefs} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'

import {getAgent, useSession} from '../session'

// sanity limit is SANITY_PAGE_LIMIT*PAGE_SIZE total records
const SANITY_PAGE_LIMIT = 1000
const PAGE_SIZE = 100
// ...which comes 10,000k follows

export const RQKEY = () => ['my-follows']

export function useMyFollowsQuery() {
  const {currentAccount} = useSession()
  return useQuery<AppBskyActorDefs.ProfileViewBasic[]>({
    staleTime: STALE.MINUTES.ONE,
    queryKey: RQKEY(),
    async queryFn() {
      if (!currentAccount) {
        return []
      }
      let cursor
      let arr: AppBskyActorDefs.ProfileViewBasic[] = []
      for (let i = 0; i < SANITY_PAGE_LIMIT; i++) {
        const res = await getAgent().getFollows({
          actor: currentAccount.did,
          cursor,
          limit: PAGE_SIZE,
        })
        // TODO
        // res.data.follows = res.data.follows.filter(
        //   profile =>
        //     !moderateProfile(profile, this.rootStore.preferences.moderationOpts)
        //       .account.filter,
        // )
        arr = arr.concat(res.data.follows)
        if (!res.data.cursor) {
          break
        }
        cursor = res.data.cursor
      }
      return arr
    },
  })
}
