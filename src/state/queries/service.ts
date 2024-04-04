import {BskyAgent} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

const RQKEY_ROOT = 'service'
export const RQKEY = (serviceUrl: string) => [RQKEY_ROOT, serviceUrl]

export function useServiceQuery(serviceUrl: string) {
  return useQuery({
    queryKey: RQKEY(serviceUrl),
    queryFn: async () => {
      const agent = new BskyAgent({service: serviceUrl})
      const res = await agent.com.atproto.server.describeServer()
      return res.data
    },
    enabled: isValidUrl(serviceUrl),
  })
}

function isValidUrl(url: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const urlp = new URL(url)
    return true
  } catch {
    return false
  }
}
