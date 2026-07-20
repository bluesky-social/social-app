import {type Client} from '@atproto/lex'
import {useMutation} from '@tanstack/react-query'

import {usePdsClient, useSessionApi} from '#/state/session'
import {useRequestEmailUpdate} from '#/components/dialogs/EmailDialog/data/useRequestEmailUpdate'
import {com} from '#/lexicons'

async function updateEmailAndRefreshSession(
  pdsClient: Client,
  refreshSession: () => Promise<unknown>,
  email: string,
  token?: string,
) {
  await pdsClient.call(
    com.atproto.server.updateEmail,
    {
      email: email.trim(),
      token,
    },
    // service: null strips the appview proxy header - this must hit the account host (PDS)
    {service: null},
  )
  await refreshSession()
}

export function useUpdateEmail() {
  const pdsClient = usePdsClient()
  const {refreshSession} = useSessionApi()
  const {mutateAsync: requestEmailUpdate} = useRequestEmailUpdate()

  return useMutation<
    {status: 'tokenRequired' | 'success'},
    Error,
    {email: string; token?: string}
  >({
    mutationFn: async ({email, token}: {email: string; token?: string}) => {
      if (token) {
        await updateEmailAndRefreshSession(
          pdsClient,
          refreshSession,
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
            pdsClient,
            refreshSession,
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
