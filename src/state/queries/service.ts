import {useQuery} from '@tanstack/react-query'

import {useSession} from '#/state/session'

export const RQKEY = (serviceUrl: string) => ['service', serviceUrl]

export function useServiceQuery() {
  const {agent} = useSession()
  return useQuery({
    queryKey: RQKEY(agent.service.toString()),
    queryFn: async () => {
      const res = await agent.com.atproto.server.describeServer()
      return res.data
    },
  })
}
