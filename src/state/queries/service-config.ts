import {useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useAppviewClient} from '#/state/session'
import * as AppBskyUnspeccedGetConfig from '#/lexicons/app/bsky/unspecced/getConfig'

type ServiceConfig = {
  checkEmailConfirmed: boolean
  topicsEnabled: boolean
  liveNow: {
    did: string
    domains: string[]
  }[]
}

export function useServiceConfigQuery() {
  const client = useAppviewClient()
  return useQuery<ServiceConfig>({
    refetchOnWindowFocus: true,
    staleTime: STALE.MINUTES.FIVE,
    queryKey: ['service-config'],
    queryFn: async () => {
      try {
        const data = await client.call(AppBskyUnspeccedGetConfig)
        return {
          checkEmailConfirmed: Boolean(data.checkEmailConfirmed),
          // @ts-expect-error not included in the lexicon atm
          topicsEnabled: Boolean(data.topicsEnabled),
          liveNow: data.liveNow ?? [],
        }
      } catch (e) {
        return {
          checkEmailConfirmed: false,
          topicsEnabled: false,
          liveNow: [],
        }
      }
    },
  })
}
