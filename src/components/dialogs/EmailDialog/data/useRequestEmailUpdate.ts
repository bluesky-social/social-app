import {useMutation} from '@tanstack/react-query'

import {useAgent} from '#/state/session'

export function useRequestEmailUpdate() {
  const agent = useAgent()

  return useMutation({
    mutationFn: async () => {
      return (await agent.com.atproto.server.requestEmailUpdate()).data
    },
  })
}
