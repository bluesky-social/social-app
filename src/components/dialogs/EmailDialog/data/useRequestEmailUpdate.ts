import {useMutation} from '@tanstack/react-query'

import {usePdsClient} from '#/state/session'
import {com} from '#/lexicons'

export function useRequestEmailUpdate() {
  const pdsClient = usePdsClient()

  return useMutation({
    mutationFn: async () => {
      return await pdsClient.call(
        com.atproto.server.requestEmailUpdate,
        undefined,
        // service: null strips the appview proxy header - this must hit the account host (PDS)
        {service: null},
      )
    },
  })
}
