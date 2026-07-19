import {useMutation} from '@tanstack/react-query'

import {usePdsClient, useSession, useSessionApi} from '#/state/session'
import {com} from '#/lexicons'

export function useManageEmail2FA() {
  const pdsClient = usePdsClient()
  const {currentAccount} = useSession()
  const {refreshSession} = useSessionApi()

  return useMutation({
    mutationFn: async ({
      enabled,
      token,
    }:
      | {enabled: true; token?: undefined}
      | {enabled: false; token: string}) => {
      if (!currentAccount?.email) {
        throw new Error('No email found for the current account')
      }

      await pdsClient.call(
        com.atproto.server.updateEmail,
        {
          email: currentAccount.email,
          emailAuthFactor: enabled,
          token,
        },
        // service: null strips the appview proxy header - this must hit the account host (PDS)
        {service: null},
      )
      // will update session state at root of app
      await refreshSession()
    },
  })
}
