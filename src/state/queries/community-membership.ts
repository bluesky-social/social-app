import {type BskyAgent} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

import {communityXrpc} from '#/lib/api/community'
import {useAgent, useSession} from '#/state/session'

const CHECK_MEMBERSHIP_METHOD = 'community.blacksky.actor.checkMembership'

const RQKEY_ROOT = 'community-membership'
export const communityMembershipRQKey = (did: string | undefined) => [
  RQKEY_ROOT,
  did ?? '',
]

export async function fetchCommunityMembership(
  agent: BskyAgent,
): Promise<boolean> {
  try {
    const res = await communityXrpc(agent, CHECK_MEMBERSHIP_METHOD)
    if (!res.ok) return false
    const data = (await res.json()) as {isMember?: boolean}
    return !!data.isMember
  } catch {
    return false
  }
}

export function useCommunityMembership() {
  const agent = useAgent()
  const {currentAccount} = useSession()
  return useQuery<boolean>({
    queryKey: communityMembershipRQKey(currentAccount?.did),
    enabled: !!currentAccount?.did,
    staleTime: 5 * 60 * 1000,
    queryFn: () => fetchCommunityMembership(agent),
  })
}
