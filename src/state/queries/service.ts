import {Client} from '@atproto/lex-client'
import {useQuery} from '@tanstack/react-query'

import {com} from '#/lexicons'

const RQKEY_ROOT = 'service'
export const RQKEY = (serviceUrl: string) => [RQKEY_ROOT, serviceUrl]

export function useServiceQuery(serviceUrl: string) {
  return useQuery({
    queryKey: RQKEY(serviceUrl),
    queryFn: async () => {
      /*
       * Unauthenticated throwaway client pointed at the candidate service -
       * describeServer is a public endpoint on the target PDS/entryway.
       */
      const client = new Client({service: serviceUrl})
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
