import {useMutation} from '@tanstack/react-query'

import {usePdsClient} from '#/state/session'
import {com} from '#/lexicons'

export function useRequestEmailUpdate() {
  const client = usePdsClient()

  return useMutation({
    mutationFn: async () => {
      return await client.call(com.atproto.server.requestEmailUpdate)
    },
  })
}
