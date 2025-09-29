import {useMutation} from '@tanstack/react-query'

import {useAgent, useSession} from '#/state/session'

export function useConfirmEmail() {
  const agent = useAgent()
  const {currentAccount} = useSession()

  return useMutation({
    mutationFn: async ({token}: {token: string}) => {
      if (!currentAccount?.email) {
        throw new Error('No email found for the current account')
      }

      await agent.com.atproto.server.confirmEmail({
        email: currentAccount.email,
        token: token.trim(),
      })
      // will update session state at root of app
      await agent.resumeSession(agent.session!)
    },
  })
}
