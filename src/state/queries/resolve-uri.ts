import {useQuery} from '@tanstack/react-query'
import {AtUri} from '@atproto/api'

import {getAgent} from '#/state/session'
import {STALE} from '#/state/queries'

export const RQKEY = (uri: string) => ['resolved-uri', uri]

export function useResolveUriQuery(uri: string | undefined) {
  return useQuery<{uri: string; did: string}, Error>({
    staleTime: STALE.INFINITY,
    queryKey: RQKEY(uri || ''),
    async queryFn() {
      const urip = new AtUri(uri || '')
      if (!urip.host.startsWith('did:')) {
        const res = await getAgent().resolveHandle({handle: urip.host})
        urip.host = res.data.did
      }
      return {did: urip.host, uri: urip.toString()}
    },
    enabled: !!uri,
  })
}

export function useResolveDidQuery(didOrHandle: string | undefined) {
  return useResolveUriQuery(didOrHandle ? `at://${didOrHandle}/` : undefined)
}
