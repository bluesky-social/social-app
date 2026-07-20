import {Platform} from 'react-native'
import {useMutation} from '@tanstack/react-query'

import {wait} from '#/lib/async/wait'
import {
  DEV_ENV_APPVIEW,
  PUBLIC_APPVIEW,
  PUBLIC_APPVIEW_DID,
} from '#/lib/constants'
import {isNetworkError} from '#/lib/hooks/useCleanError'
import {createLexClient} from '#/lib/lexClient'
import {usePdsClient} from '#/state/session'
import {usePatchAgeAssuranceServerState} from '#/ageAssurance'
import {logger} from '#/ageAssurance/logger'
import {useAnalytics} from '#/analytics'
import {BLUESKY_PROXY_DID} from '#/env'
import {useGeolocation} from '#/geolocation'
import {app, com} from '#/lexicons'

const IS_DEV_ENV = BLUESKY_PROXY_DID !== PUBLIC_APPVIEW_DID
const APPVIEW = IS_DEV_ENV ? DEV_ENV_APPVIEW : PUBLIC_APPVIEW

export function useBeginAgeAssurance() {
  const ax = useAnalytics()
  const pdsClient = usePdsClient()
  const geolocation = useGeolocation()
  const patchAgeAssuranceStateResponse = usePatchAgeAssuranceServerState()

  return useMutation({
    async mutationFn(
      props: Omit<
        app.bsky.ageassurance.begin.$InputBody,
        'countryCode' | 'regionCode'
      >,
    ) {
      const countryCode = geolocation?.countryCode?.toUpperCase()
      const regionCode = geolocation?.regionCode?.toUpperCase()
      if (!countryCode) {
        throw new Error(`Geolocation not available, cannot init age assurance.`)
      }

      const {token} = await pdsClient.call(
        com.atproto.server.getServiceAuth,
        {
          aud: BLUESKY_PROXY_DID,
          lxm: `app.bsky.ageassurance.begin`,
        },
        // service: null strips the appview proxy header - this must hit the account host (PDS)
        {service: null},
      )

      /*
       * A non-refreshing throwaway client scoped to the service-auth token: it
       * has no session, so nothing can refresh it. Requests go straight to the
       * appview with the token as a static Authorization header (a raw client,
       * unlike a session, is allowed to preset that header).
       */
      const scopedClient = createLexClient({
        service: APPVIEW,
        headers: {authorization: `Bearer ${token}`},
      })

      ax.metric('ageAssurance:api:begin', {
        platform: Platform.OS,
        countryCode,
        regionCode,
      })

      /*
       * 2s wait is good actually. Email sending takes a hot sec and this helps
       * ensure the email is ready for the user once they open their inbox.
       */
      const data = await wait(
        2e3,
        scopedClient.call(app.bsky.ageassurance.begin, {
          ...props,
          countryCode,
          regionCode,
        }),
      )

      // Just keeps this in sync, not necessarily used right now
      patchAgeAssuranceStateResponse(data)
    },
    onError(e) {
      if (!isNetworkError(e)) {
        logger.error(`useBeginAgeAssurance failed`, {
          safeMessage: e,
        })
      }
    },
  })
}
