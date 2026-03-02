import {useMutation} from '@tanstack/react-query'

import {useAgent, useSessionApi} from '#/state/session'
import {useRequestEmailUpdate} from '#/components/dialogs/EmailDialog/data/useRequestEmailUpdate'

async function updateEmailAndRefreshSession(
  agent: ReturnType<typeof useAgent>,
  partialRefreshSession: () => Promise<void>,
  email: string,
  token?: string,
) {
  await agent.com.atproto.server.updateEmail({email: email.trim(), token})
  await partialRefreshSession()
}

export function useUpdateEmail() {
  const agent = useAgent()
  const {partialRefreshSession} = useSessionApi()
  const {mutateAsync: requestEmailUpdate} = useRequestEmailUpdate()

  return useMutation<
    {status: 'tokenRequired' | 'success'},
    Error,
    {email: string; token?: string}
  >({
    mutationFn: async ({email, token}: {email: string; token?: string}) => {
      if (token) {
        await updateEmailAndRefreshSession(
          agent,
          partialRefreshSession,
          email,
          token,
        )
        return {
          status: 'success',
        }
      } else {
        const {tokenRequired} = await requestEmailUpdate()
        if (tokenRequired) {
          return {
            status: 'tokenRequired',
          }
        } else {
          await updateEmailAndRefreshSession(
            agent,
            partialRefreshSession,
            email,
            token,
          )
          return {
            status: 'success',
          }
        }
      }
    },
  })
}
