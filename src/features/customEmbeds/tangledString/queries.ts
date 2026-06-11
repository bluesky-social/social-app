import {type AppBskyActorDefs, AtpAgent} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'
import {resolveDidAndPds} from '#/state/session/resolve-pds'
import {STRING_COLLECTION, type TangledStringValue} from './lexicon'

export type TangledStringData = {
  did: string
  value: TangledStringValue
  /** Owner profile, best-effort (the card still renders without it). */
  author?: AppBskyActorDefs.ProfileViewDetailed
}

/**
 * Reads a `sh.tangled.string` record directly from the owner's repo. The code
 * is inline in the record, so this single read is all the card needs.
 *
 * A PDS only serves `com.atproto.repo.getRecord` for repos it hosts, and the
 * snippet rarely lives on the viewer's PDS, so we resolve the owner's DID +
 * PDS and read from a PDS-pointed agent rather than the session agent. The
 * author profile comes from the appview (the viewer's `agent`) for the byline
 * and is allowed to fail without blocking the snippet.
 */
export function useTangledStringQuery({
  actor,
  rkey,
  enabled = true,
}: {
  actor: string
  rkey: string
  enabled?: boolean
}) {
  const agent = useAgent()
  return useQuery<TangledStringData>({
    queryKey: ['tangledString', actor, rkey],
    enabled: enabled && !!actor && !!rkey,
    queryFn: async () => {
      const {did, pds} = await resolveDidAndPds(actor)
      const pdsAgent = new AtpAgent({service: pds})
      const [recordRes, author] = await Promise.all([
        pdsAgent.com.atproto.repo.getRecord({
          repo: did,
          collection: STRING_COLLECTION,
          rkey,
        }),
        agent
          .getProfile({actor: did})
          .then(r => r.data)
          .catch(() => undefined),
      ])
      return {
        did,
        value: recordRes.data.value,
        author,
      }
    },
    staleTime: STALE.MINUTES.FIVE,
  })
}
