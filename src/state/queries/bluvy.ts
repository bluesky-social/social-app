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

export const createBluvyDeclarationQueryKey = (did: string) =>
  createQueryKey(bluvyDeclarationQueryKeyRoot, {did}, {persistedVersion: 1})

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
