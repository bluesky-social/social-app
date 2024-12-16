import {useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'

type ServiceConfig = {
  checkEmailConfirmed: boolean
  trendingTopicsEnabled: boolean
  trendingTopicsLangs: string[]
}

export function useServiceConfigQuery() {
  const agent = useAgent()
  return useQuery<ServiceConfig>({
    refetchOnWindowFocus: true,
    staleTime: STALE.MINUTES.ONE,
    queryKey: ['service-config'],
    queryFn: async () => {
      try {
        const {data} = await agent.api.app.bsky.unspecced.getConfig()
        return {
          checkEmailConfirmed: Boolean(data.checkEmailConfirmed),
          trendingTopicsEnabled: Boolean(data.trendingTopicsEnabled),
          trendingTopicsLangs: (data.trendingTopicsLangs ?? []) as string[],
        }
      } catch (e) {
        return {
          checkEmailConfirmed: false,
          trendingTopicsEnabled: false,
          trendingTopicsLangs: [],
        }
      }
    },
  })
}
