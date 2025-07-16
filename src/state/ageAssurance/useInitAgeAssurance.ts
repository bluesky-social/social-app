import {
  type AppBskyUnspeccedDefs,
  type AppBskyUnspeccedInitAgeAssurance,
  AtpAgent,
} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {wait} from '#/lib/async/wait'
import {
  // DEV_ENV_APPVIEW,
  PUBLIC_APPVIEW,
  PUBLIC_APPVIEW_DID,
} from '#/lib/constants'
import {isNetworkError} from '#/lib/hooks/useCleanError'
import {logger} from '#/logger'
import {createAgeAssuranceQueryKey} from '#/state/ageAssurance'
import {useGeolocation} from '#/state/geolocation'
import {useAgent} from '#/state/session'

let APPVIEW = PUBLIC_APPVIEW
let APPVIEW_DID = PUBLIC_APPVIEW_DID

/*
 * Uncomment if using the local dev-env
 */
// if (__DEV__) {
//   APPVIEW = DEV_ENV_APPVIEW
//   /*
//    * IMPORTANT: you need to get this value from `http://localhost:2581`
//    * introspection endpoint and updated in `constants`, since it changes
//    * every time you run the dev-env.
//    */
//   APPVIEW_DID = ``
// }

export function useInitAgeAssurance() {
  const qc = useQueryClient()
  const agent = useAgent()
  const {geolocation} = useGeolocation()
  return useMutation({
    async mutationFn(
      props: Omit<AppBskyUnspeccedInitAgeAssurance.InputSchema, 'countryCode'>,
    ) {
      if (!geolocation?.countryCode) {
        throw new Error(`Geolocation not available, cannot init age assurance.`)
      }

      const {
        data: {token},
      } = await agent.com.atproto.server.getServiceAuth({
        aud: APPVIEW_DID,
        lxm: `app.bsky.unspecced.initAgeAssurance`,
      })

      const appView = new AtpAgent({service: APPVIEW})
      appView.sessionManager.session = {...agent.session!}
      appView.sessionManager.session.accessJwt = token
      appView.sessionManager.session.refreshJwt = ''

      /*
       * 2s wait is good actually. Email sending takes a hot sec and this helps
       * ensure the email is ready for the user once they open their inbox.
       */
      const {data} = await wait(
        2e3,
        appView.app.bsky.unspecced.initAgeAssurance({
          ...props,
          countryCode: geolocation?.countryCode?.toUpperCase(),
        }),
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
