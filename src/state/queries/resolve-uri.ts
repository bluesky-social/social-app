import {useQuery} from '@tanstack/react-query'
import {AtUri} from '@atproto/api'
import {useSession} from '../session'

export const RQKEY = (uri: string) => ['resolved-uri', uri]

export function useResolveUriQuery(uri: string) {
  const {agent} = useSession()
  return useQuery<string | undefined, Error>(RQKEY(uri), async () => {
    const urip = new AtUri(uri)
    if (!urip.host.startsWith('did:')) {
      const res = await agent.resolveHandle({handle: urip.host})
      urip.host = res.data.did
    }
    return urip.toString()
  })
}
