import {useMutation} from '@tanstack/react-query'

import {useAgent, useSession, useSessionApi} from '#/state/session'

export function useManageEmail2FA() {
  const agent = useAgent()
  const {currentAccount} = useSession()
  const {partialRefreshSession} = useSessionApi()

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

      await agent.com.atproto.server.updateEmail({
        email: currentAccount.email,
        emailAuthFactor: enabled,
        token,
      })
      await partialRefreshSession()
    },
  })
}
