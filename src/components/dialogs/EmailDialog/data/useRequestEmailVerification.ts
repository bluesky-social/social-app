import {useMutation} from '@tanstack/react-query'

import {useAgent} from '#/state/session'
import {pdsAgent} from '#/state/session/agent'

export function useRequestEmailVerification() {
  const agent = useAgent()

  return useMutation({
    mutationFn: async () => {
      await pdsAgent(agent).com.atproto.server.requestEmailConfirmation()
    },
  })
}
