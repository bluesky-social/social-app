import {useMutation} from '@tanstack/react-query'

import {usePdsClient} from '#/state/session'
import * as ComAtprotoServerRequestEmailConfirmation from '#/lexicons/com/atproto/server/requestEmailConfirmation'

export function useRequestEmailVerification() {
  const client = usePdsClient()

  return useMutation({
    mutationFn: async () => {
      await client.call(ComAtprotoServerRequestEmailConfirmation)
    },
  })
}
