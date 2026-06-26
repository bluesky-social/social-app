import {useQuery} from '@tanstack/react-query'

import {communityXrpc} from '#/lib/api/community'
import {PEER_MOD_DIDS} from '#/lib/constants'
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
 * PEER_MOD_DIDS allowlist. Cached aggressively; the affordances gated by
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

// Subject-side peer-mod check used to render a badge on any profile.
// Mirrors the appview's PEER_MOD_DIDS env; replace with a public list endpoint
// once we ship one.
export function isPeerModDid(did: string | undefined): boolean {
  return !!did && did in PEER_MOD_DIDS
}
