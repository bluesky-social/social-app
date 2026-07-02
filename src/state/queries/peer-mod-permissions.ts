import {useQuery} from '@tanstack/react-query'

import {communityXrpc} from '#/lib/api/community'
import {useAgent, useSession} from '#/state/session'

const GET_MY_PERMISSIONS_METHOD = 'community.blacksky.moderation.getMyPermissions'

const RQKEY_ROOT = 'peer-mod-permissions'
export const peerModPermissionsRQKey = (did: string | undefined) => [
  RQKEY_ROOT,
  did ?? '',
]

export type PeerModPermissions = {
  isPeerMod: boolean
}

/**
 * Whether the signed-in user is a peer-moderator. Backed by the appview's
 * peer-moderator badge. Cached aggressively; the affordances gated by
 * this are mod tooling, not security boundaries — the server re-checks on
 * every applyLabel/removeLabel call.
 */
export function useMyPeerModPermissions() {
  const agent = useAgent()
  const {currentAccount} = useSession()
  return useQuery<PeerModPermissions>({
    queryKey: peerModPermissionsRQKey(currentAccount?.did),
    enabled: !!currentAccount?.did,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      try {
        const res = await communityXrpc(agent, GET_MY_PERMISSIONS_METHOD)
        if (!res.ok) return {isPeerMod: false}
        const data = (await res.json()) as PeerModPermissions
        return {isPeerMod: !!data.isPeerMod}
      } catch {
        return {isPeerMod: false}
      }
    },
  })
}
