import {useMutation} from '@tanstack/react-query'

import {useAgent, useSession, useSessionApi} from '#/state/session'

export function useConfirmEmail({
  onSuccess,
  onError,
}: {onSuccess?: () => void; onError?: () => void} = {}) {
  const agent = useAgent()
  const {currentAccount} = useSession()
  const {partialRefreshSession} = useSessionApi()

  return useMutation({
    mutationFn: async ({token}: {token: string}) => {
      if (!currentAccount?.email) {
        throw new Error('No email found for the current account')
      }

      await agent.com.atproto.server.confirmEmail({
        email: currentAccount.email.trim(),
        token: token.trim(),
      })
      await partialRefreshSession()
    },
    onSuccess,
    onError,
  })
}
