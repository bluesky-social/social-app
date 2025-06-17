import {BskyAgent} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

import {BSKY_SERVICE} from '#/lib/constants'
import {STALE} from '#/state/queries'

export interface ProfileLinkItem {
  url: string
  text: string
  emoji?: string
}

export const RQKEY_ROOT = 'profile-links'
export const RQKEY = (did: string) => [RQKEY_ROOT, did]

export function useProfileLinksQuery(did: string) {
  // Derive PDS service URL: use did:web for web-hosted DIDs, else fallback
  const service = did.startsWith('did:web:')
    ? `https://${did.slice('did:web:'.length).replace(/:/g, '/')}`
    : BSKY_SERVICE
  const agent = new BskyAgent({service})

  return useQuery<ProfileLinkItem[], Error>({
    queryKey: RQKEY(did),
    queryFn: async () => {
      const res = await agent.com.atproto.repo.listRecords({
        repo: did,
        collection: 'blue.linkat.board',
        limit: 1,
      })

      console.log('profile links', res.data.records[0].value.cards)
      return res.data.records[0].value.cards as ProfileLinkItem[]
    },
    staleTime: STALE.MINUTES.FIVE,
    enabled: !!did,
  })
}
