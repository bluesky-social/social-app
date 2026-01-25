import {useMutation} from '@tanstack/react-query'

import {useAgent} from '#/state/session'
import {pdsAgent} from '#/state/session/agent'

export function useRequestEmailUpdate() {
  const agent = useAgent()

  return useMutation({
    mutationFn: async () => {
      return (await pdsAgent(agent).com.atproto.server.requestEmailUpdate())
        .data
    },
  })
}
