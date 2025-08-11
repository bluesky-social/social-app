import {useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'

type ServiceConfig = {
  checkEmailConfirmed: boolean
  topicsEnabled: boolean
  liveNow: {
    did: string
    domains: string[]
  }[]
}

export function useServiceConfigQuery() {
  const agent = useAgent()
  return useQuery<ServiceConfig>({
    refetchOnWindowFocus: true,
    staleTime: STALE.MINUTES.FIVE,
    queryKey: ['service-config'],
    queryFn: async () => {
      try {
        const {data} = await agent.api.app.bsky.unspecced.getConfig()
        return {
          checkEmailConfirmed: Boolean(data.checkEmailConfirmed),
          // @ts-expect-error not included in types atm
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
