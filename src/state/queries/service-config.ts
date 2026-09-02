import {useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'

type ServiceConfig = {
  checkEmailConfirmed: boolean
  topicsEnabled: boolean
  liveNow: {
    did: string
    domains: string[]
  }[]
}

/**
 * Module scope because React Compiler cannot lower a `??` inside a `try`, and
 * `data` only exists once the request in that `try` resolves.
 */
function toServiceConfig(data: {
  checkEmailConfirmed?: boolean
  liveNow?: ServiceConfig['liveNow']
}): ServiceConfig {
  return {
    checkEmailConfirmed: Boolean(data.checkEmailConfirmed),
    // @ts-expect-error not included in the lexicon atm
    topicsEnabled: Boolean(data.topicsEnabled),
    liveNow: data.liveNow ?? [],
  }
}

export function useServiceConfigQuery() {
  const client = useAppviewClient()
  return useQuery<ServiceConfig>({
    refetchOnWindowFocus: true,
    staleTime: STALE.MINUTES.FIVE,
    queryKey: ['service-config'],
    queryFn: async () => {
      try {
        const data = await client.call(app.bsky.unspecced.getConfig)
        return toServiceConfig(data)
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
