import React from 'react'
import {useQuery} from '@tanstack/react-query'
import {BskyAgent} from '@atproto/api'

import {useSession} from '#/state/session'

export function useGetProfile({did}: {did: string}) {
  const {accounts} = useSession()
  const account = React.useMemo(
    () => accounts.find(a => a.did === did),
    [did, accounts],
  )

  return useQuery({
    enabled: !!account,
    queryKey: ['getProfile', account],
    queryFn: async () => {
      if (!account) {
        throw new Error(`useGetProfile: local account not found for ${did}`)
      }

      const agent = new BskyAgent({
        // needs to be public data, so remap PDS URLs to App View for now
        service: account.service.includes('bsky.social')
          ? 'https://api.bsky.app'
          : account.service,
      })

      const res = await agent.getProfile({actor: did})
      return res.data
    },
  })
}
