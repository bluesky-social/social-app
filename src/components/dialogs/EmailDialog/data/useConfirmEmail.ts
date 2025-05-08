import {useMutation} from '@tanstack/react-query'

import {useAgent, useSession} from '#/state/session'
import {useUpdateAccountEmailStateQueryCache} from '#/components/dialogs/EmailDialog/data/useAccountEmailState'

export function useConfirmEmail() {
  const agent = useAgent()
  const {currentAccount} = useSession()
  const updateAccountEmailStateQueryCache =
    useUpdateAccountEmailStateQueryCache()

  return useMutation({
    mutationFn: async ({token}: {token: string}) => {
      if (!currentAccount?.email) {
        throw new Error('No email found for the current account')
      }

      await agent.com.atproto.server.confirmEmail({
        email: currentAccount.email,
        token: token.trim(),
      })
      const {data} = await agent.resumeSession(agent.session!)
      updateAccountEmailStateQueryCache({
        isEmailVerified: !!data.emailConfirmed,
        email2FAEnabled: !!data.emailAuthFactor,
      })
    },
  })
}
