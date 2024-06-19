import {StarterPackView} from '@atproto/api/dist/client/types/app/bsky/graph/defs'
import {QueryClient, useQuery} from '@tanstack/react-query'

import {
  httpStarterPackUriToAtUri,
  parseStarterPackUri,
} from 'lib/strings/starter-pack'
import {useAgent} from 'state/session'

const RQKEY_ROOT = 'starter-pack'
const RQKEY = (did?: string, rkey?: string) => {
  if (did?.startsWith('https://') || did?.startsWith('at://')) {
    const parsed = parseStarterPackUri(did)
    return [RQKEY_ROOT, parsed?.name, parsed?.rkey]
  } else {
    return [RQKEY_ROOT, did, rkey]
  }
}

export function useStarterPackQuery({
  uri,
  did,
  rkey,
}: {
  uri?: string
  did?: string
  rkey?: string
}) {
  const agent = useAgent()

  return useQuery<StarterPackView>({
    queryKey: RQKEY(did, rkey),
    queryFn: async () => {
      if (!uri) {
        uri = `at://${did}/app.bsky.graph.starterpack/${rkey}`
      } else if (uri && !uri.startsWith('at://')) {
        // TODO remove this assertion
        uri = httpStarterPackUriToAtUri(uri) as string
      }
      const res = await agent.app.bsky.graph.getStarterPack({
        starterPack: uri,
      })
      return res.data.starterPack
    },
    enabled: Boolean(uri) || Boolean(did && rkey),
  })
}

export async function invalidateStarterPack({
  queryClient,
  did,
  rkey,
}: {
  queryClient: QueryClient
  did: string
  rkey: string
}) {
  await queryClient.invalidateQueries({queryKey: RQKEY(did, rkey)})
}
