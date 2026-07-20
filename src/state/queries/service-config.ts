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

export function useServiceConfigQuery() {
  const appviewClient = useAppviewClient()
  return useQuery<ServiceConfig>({
    refetchOnWindowFocus: true,
    staleTime: STALE.MINUTES.FIVE,
    queryKey: ['service-config'],
    queryFn: async () => {
      try {
        const data = await appviewClient.call(app.bsky.unspecced.getConfig)
        return {
          checkEmailConfirmed: Boolean(data.checkEmailConfirmed),
          /*
           * `topicsEnabled` is served by the appview but is not (yet) part of
           * the getConfig lexicon schema, so read it through a narrow local
           * cast rather than the generated body type.
           */
          topicsEnabled: Boolean(
            (data as {topicsEnabled?: boolean}).topicsEnabled,
          ),
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
