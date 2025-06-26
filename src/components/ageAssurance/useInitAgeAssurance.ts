import {useMutation} from '@tanstack/react-query'

import {wait} from '#/lib/async/wait'
import {isNetworkError} from '#/lib/hooks/useCleanError'
import {logger} from '#/logger'
// import {useAgent} from '#/state/session';

type TempInputSchema = {
  email: string
  language: string
}

export function useInitAgeAssurance() {
  // const agent = useAgent()
  return useMutation({
    async mutationFn(_props: TempInputSchema) {
      // 2s wait is good actually, email sending takes a hot sec
      // const {data} = await wait(2e3, agent.app.bsky.unspecced.initAgeAssurance(props))
      await wait(
        2e3,
        (() => ({
          data: {
            $type: 'app.bsky.unspecced.defs#ageAssuranceState',
            lastInitiatedAt: new Date().toISOString(),
            status: 'pending',
          },
        }))(),
      )
    },
    onError(e) {
      if (!isNetworkError(e)) {
        logger.error(`useInitAgeAssurance failed`, {
          safeMessage: e,
        })
      }
    },
  })
}
