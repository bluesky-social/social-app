import {
  type AppBskyUnspeccedDefs,
  type AppBskyUnspeccedInitAgeAssurance,
} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {wait} from '#/lib/async/wait'
import {isNetworkError} from '#/lib/hooks/useCleanError'
import {logger} from '#/logger'
import {createAgeAssuranceQueryKey} from '#/state/age-assurance'
import {useAgent} from '#/state/session'

export function useInitAgeAssurance() {
  const qc = useQueryClient()
  const agent = useAgent()
  return useMutation({
    async mutationFn(props: AppBskyUnspeccedInitAgeAssurance.InputSchema) {
      /*
       * 2s wait is good actually. Email sending takes a hot sec and this helps
       * ensure the email is ready for the user once they open their inbox.
       */
      const {data} = await wait(
        2e3,
        agent.app.bsky.unspecced.initAgeAssurance(props),
      )

      qc.setQueryData<AppBskyUnspeccedDefs.AgeAssuranceState>(
        createAgeAssuranceQueryKey(agent.session?.did ?? 'never'),
        () => data,
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
