import {AppBskyActorDefs} from '@atproto/api'
import {QueryFunctionContext, useQuery} from '@tanstack/react-query'
import {useSession, getAgent} from '../session'
import {STALE} from '#/state/queries'

// sanity limit is SANITY_PAGE_LIMIT*PAGE_SIZE total records
const SANITY_PAGE_LIMIT = 1000
const PAGE_SIZE = 100
// ...which comes 10,000k follows

export const RQKEY = (sessionDid: string | undefined) => [
  'my-follows',
  sessionDid,
]

export function useMyFollowsQuery() {
  const {currentAccount} = useSession()
  return useQuery<AppBskyActorDefs.ProfileViewBasic[]>({
    staleTime: STALE.MINUTES.ONE,
    queryKey: RQKEY(currentAccount?.did),
    queryFn: myFollowsQueryFn,
  })
}

async function myFollowsQueryFn({queryKey}: QueryFunctionContext) {
  const [_, sessionDid] = queryKey as ReturnType<typeof RQKEY>
  if (!sessionDid) {
    return []
  }
  let cursor
  let arr: AppBskyActorDefs.ProfileViewBasic[] = []
  for (let i = 0; i < SANITY_PAGE_LIMIT; i++) {
    const res = await getAgent().getFollows({
      actor: sessionDid,
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
}
