import {useQuery} from '@tanstack/react-query'

import {useAgent} from '#/state/session'

type ServiceConfig = {
  checkEmailConfirmed: boolean
  trendingTopicsEnabled: boolean
  trendingTopicsLangs: string[]
}

export function useServiceConfigQuery() {
  const agent = useAgent()
  return useQuery<ServiceConfig>({
    queryKey: ['service-config'],
    queryFn: async () => {
      try {
        const {data} = await agent.api.app.bsky.unspecced.getConfig()
        return {
          checkEmailConfirmed: Boolean(data.checkEmailConfirmed),
          // TODO
          trendingTopicsEnabled: true, // Boolean(data.trendingTopicsEnabled),
          // TODO
          trendingTopicsLangs: ['en'], // data.trendingTopicsLangs ?? [],
        }
      } catch (e) {
        return {
          checkEmailConfirmed: false,
          trendingTopicsEnabled: false,
          trendingTopicsLangs: [],
        }
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}
