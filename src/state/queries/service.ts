import {useQuery} from '@tanstack/react-query'

import {createServiceClient} from '#/lib/lexClient'
import {com} from '#/lexicons'

const RQKEY_ROOT = 'service'
export const RQKEY = (serviceUrl: string) => [RQKEY_ROOT, serviceUrl]

export function useServiceQuery(serviceUrl: string) {
  return useQuery({
    queryKey: RQKEY(serviceUrl),
    queryFn: async () => {
      /*
       * The host is whatever the user typed or picked, so this describes it
       * through a one-off service client rather than a session-scoped one.
       */
      const client = createServiceClient(serviceUrl)
      return await client.call(com.atproto.server.describeServer)
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
