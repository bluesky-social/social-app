import {useMutation} from '@tanstack/react-query'

import {useAgent} from '#/state/session'

export function useRequestEmailVerification() {
  const agent = useAgent()

  return useMutation({
    mutationFn: async () => {
      await agent.com.atproto.server.requestEmailConfirmation()
    },
  })
}
