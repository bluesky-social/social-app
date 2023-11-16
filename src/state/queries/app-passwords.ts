import {ComAtprotoServerCreateAppPassword} from '@atproto/api'
import {useQuery, useQueryClient, useMutation} from '@tanstack/react-query'

import {useSession} from '#/state/session'
import {STALE} from '#/state/queries'

export const RQKEY = () => ['app-passwords']

export function useAppPasswordsQuery() {
  const {agent} = useSession()
  return useQuery({
    staleTime: STALE.MINUTES.ONE,
    queryKey: RQKEY(),
    queryFn: async () => {
      const res = await agent.com.atproto.server.listAppPasswords({})
      return res.data.passwords
    },
  })
}

export function useAppPasswordCreateMutation() {
  const {agent} = useSession()
  const queryClient = useQueryClient()
  return useMutation<
    ComAtprotoServerCreateAppPassword.OutputSchema,
    Error,
    {name: string}
  >({
    mutationFn: async ({name}) => {
      return (
        await agent.com.atproto.server.createAppPassword({
          name,
        })
      ).data
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: RQKEY(),
      })
    },
  })
}

export function useAppPasswordDeleteMutation() {
  const {agent} = useSession()
  const queryClient = useQueryClient()
  return useMutation<void, Error, {name: string}>({
    mutationFn: async ({name}) => {
      await agent.com.atproto.server.revokeAppPassword({
        name,
      })
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: RQKEY(),
      })
    },
  })
}
