import {useQuery} from '@tanstack/react-query'

import {GCTIME, STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAgent} from '#/state/session'

/**
 * `com.bluvy.declaration` isn't a lexicon the Bluesky AppView resolves (unlike
 * `com.germnetwork.declaration`, which Bluesky's production AppView populates
 * onto every profile as `associated.germ`). We have to fetch it ourselves.
 */
export type BluvyDeclaration = {
  version: string
  messageMe: {
    showButtonTo: 'everyone' | 'mutual' | 'nothing' | (string & {})
    messageMeUrl: string
  }
}

const bluvyDeclarationQueryKeyRoot = 'bluvy-declaration'

// Bumped 1 -> 2 -> 3: dev builds of bluvy-client used to publish a loopback
// messageMeUrl (e.g. http://127.0.0.1:8100/message) instead of
// https://bluvy.app/message. Clients that cached one of those bad records
// need to drop it and refetch now that bluvy-client always publishes the
// bluvy.app URL. Bumped a second time (2 -> 3) because the 1 -> 2 bump
// itself got fetched once while a bad record was still live and cached that
// under the new key with a 1h staleTime -- staleTime tracks when the query
// last ran, not when the underlying PDS record changed, so a version bump
// only helps if it's fetched after the record is actually fixed.
export const createBluvyDeclarationQueryKey = (did: string) =>
  createQueryKey(bluvyDeclarationQueryKeyRoot, {did}, {persistedVersion: 3})

export function useBluvyDeclarationQuery({did}: {did: string | undefined}) {
  const agent = useAgent()
  return useQuery<BluvyDeclaration | null>({
    queryKey: createBluvyDeclarationQueryKey(did ?? ''),
    enabled: !!did,
    staleTime: STALE.HOURS.ONE,
    gcTime: GCTIME.INFINITY,
    retry: false,
    queryFn: async () => {
      try {
        const {data} = await agent.com.atproto.repo.getRecord({
          repo: did!,
          collection: 'com.bluvy.declaration',
          rkey: 'self',
        })
        return data.value as BluvyDeclaration
      } catch {
        // no record, or repo/rkey doesn't resolve -> treat as "no declaration"
        return null
      }
    },
  })
}
