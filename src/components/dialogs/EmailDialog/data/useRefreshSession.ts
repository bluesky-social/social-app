import {useCallback} from 'react'

import {useAgent} from '#/state/session'

export function useRefreshSession() {
  const agent = useAgent()

  return useCallback(() => {
    return agent.resumeSession(agent.session!).catch(() => {})
  }, [agent])
}
