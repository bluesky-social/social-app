import {useQuery} from '@tanstack/react-query'
import {AtUri} from '@atproto/api'
import {useSession} from '../session'

export const RQKEY = (uri: string) => ['resolved-uri', uri]

export function useResolveUriQuery(uri: string | undefined) {
  const {agent} = useSession()
  return useQuery<{uri: string; did: string}, Error>({
    queryKey: RQKEY(uri || ''),
    async queryFn() {
      const urip = new AtUri(uri || '')
      if (!urip.host.startsWith('did:')) {
        const res = await agent.resolveHandle({handle: urip.host})
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
