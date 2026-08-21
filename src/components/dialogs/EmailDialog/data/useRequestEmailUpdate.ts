import {useMutation} from '@tanstack/react-query'

import {usePdsClient} from '#/state/session'
import * as ComAtprotoServerRequestEmailUpdate from '#/lexicons/com/atproto/server/requestEmailUpdate'

export function useRequestEmailUpdate() {
  const client = usePdsClient()

  return useMutation({
    mutationFn: async () => {
      return await client.call(ComAtprotoServerRequestEmailUpdate)
    },
  })
}
