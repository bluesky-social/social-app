import {
  type AppBskyUnspeccedDefs,
  type AppBskyUnspeccedInitAgeAssurance,
  AtpAgent,
} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {wait} from '#/lib/async/wait'
import {
  DEV_ENV_APPVIEW,
  DEV_ENV_APPVIEW_DID,
  PUBLIC_APPVIEW,
  PUBLIC_APPVIEW_DID,
} from '#/lib/constants'
import {isNetworkError} from '#/lib/hooks/useCleanError'
import {logger} from '#/logger'
import {createAgeAssuranceQueryKey} from '#/state/age-assurance'
import {useAgent} from '#/state/session'

const APPVIEW = __DEV__ ? DEV_ENV_APPVIEW : PUBLIC_APPVIEW
const APPVIEW_DID = __DEV__ ? DEV_ENV_APPVIEW_DID : PUBLIC_APPVIEW_DID

export function useInitAgeAssurance() {
  const qc = useQueryClient()
  const agent = useAgent()
  return useMutation({
    async mutationFn(props: AppBskyUnspeccedInitAgeAssurance.InputSchema) {
      const {
        data: {token},
      } = await agent.com.atproto.server.getServiceAuth({
        aud: APPVIEW_DID,
        lxm: `app.bsky.unspecced.initAgeAssurance`,
      })

      const appView = new AtpAgent({service: APPVIEW})
      appView.sessionManager.session = agent.session!
      appView.sessionManager.session.accessJwt = token
      appView.sessionManager.session.refreshJwt = ''

      /*
       * 2s wait is good actually. Email sending takes a hot sec and this helps
       * ensure the email is ready for the user once they open their inbox.
       */
      const {data} = await wait(
        2e3,
        appView.app.bsky.unspecced.initAgeAssurance(props),
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
