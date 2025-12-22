import {Platform} from 'react-native'
import {type AppBskyAgeassuranceBegin, AtpAgent} from '@atproto/api'
import {useMutation} from '@tanstack/react-query'

import {wait} from '#/lib/async/wait'
import {
  DEV_ENV_APPVIEW,
  PUBLIC_APPVIEW,
  PUBLIC_APPVIEW_DID,
} from '#/lib/constants'
import {isNetworkError} from '#/lib/hooks/useCleanError'
import {useAgent} from '#/state/session'
import {usePatchAgeAssuranceServerState} from '#/ageAssurance'
import {logger} from '#/ageAssurance/logger'
import {BLUESKY_PROXY_DID} from '#/env'
import {useGeolocation} from '#/geolocation'

const IS_DEV_ENV = BLUESKY_PROXY_DID !== PUBLIC_APPVIEW_DID
const APPVIEW = IS_DEV_ENV ? DEV_ENV_APPVIEW : PUBLIC_APPVIEW

export function useBeginAgeAssurance() {
  const agent = useAgent()
  const geolocation = useGeolocation()
  const patchAgeAssuranceStateResponse = usePatchAgeAssuranceServerState()

  return useMutation({
    async mutationFn(
      props: Omit<
        AppBskyAgeassuranceBegin.InputSchema,
        'countryCode' | 'regionCode'
      >,
    ) {
      const countryCode = geolocation?.countryCode?.toUpperCase()
      const regionCode = geolocation?.regionCode?.toUpperCase()
      if (!countryCode) {
        throw new Error(`Geolocation not available, cannot init age assurance.`)
      }

      const {
        data: {token},
      } = await agent.com.atproto.server.getServiceAuth({
        aud: BLUESKY_PROXY_DID,
        lxm: `app.bsky.ageassurance.begin`,
      })

      const appView = new AtpAgent({service: APPVIEW})
      appView.sessionManager.session = {...agent.session!}
      appView.sessionManager.session.accessJwt = token
      appView.sessionManager.session.refreshJwt = ''

      logger.metric(
        'ageAssurance:api:begin',
        {
          platform: Platform.OS,
          countryCode,
          regionCode,
        },
        {statsig: false},
      )

      /*
       * 2s wait is good actually. Email sending takes a hot sec and this helps
       * ensure the email is ready for the user once they open their inbox.
       */
      const {data} = await wait(
        2e3,
        appView.app.bsky.ageassurance.begin({
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
