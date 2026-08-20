import {useMutation} from '@tanstack/react-query'

import {usePdsClient, useSession, useSessionApi} from '#/state/session'
import * as ComAtprotoServerConfirmEmail from '#/lexicons/com/atproto/server/confirmEmail'

export function useConfirmEmail({
  onSuccess,
  onError,
}: {onSuccess?: () => void; onError?: () => void} = {}) {
  const pdsClient = usePdsClient()
  const {currentAccount} = useSession()
  const {refreshSession} = useSessionApi()

  return useMutation({
    mutationFn: async ({token}: {token: string}) => {
      if (!currentAccount?.email) {
        throw new Error('No email found for the current account')
      }

      await pdsClient.call(ComAtprotoServerConfirmEmail, {
        email: currentAccount.email.trim(),
        token: token.trim(),
      })
      // will update session state at root of app
      await refreshSession()
    },
    onSuccess,
    onError,
  })
}
