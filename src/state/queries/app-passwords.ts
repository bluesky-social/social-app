import {ComAtprotoServerCreateAppPassword} from '@atproto/api'
import {useQuery, useQueryClient, useMutation} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {getAgent} from '../session'

export const RQKEY = () => ['app-passwords']

export function useAppPasswordsQuery() {
  return useQuery({
    staleTime: STALE.MINUTES.FIVE,
    queryKey: RQKEY(),
    queryFn: async () => {
      const res = await getAgent().com.atproto.server.listAppPasswords({})
      return res.data.passwords
    },
  })
}

export function useAppPasswordCreateMutation() {
  const queryClient = useQueryClient()
  return useMutation<
    ComAtprotoServerCreateAppPassword.OutputSchema,
    Error,
    {name: string}
  >({
    mutationFn: async ({name}) => {
      return (
        await getAgent().com.atproto.server.createAppPassword({
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
  const queryClient = useQueryClient()
  return useMutation<void, Error, {name: string}>({
    mutationFn: async ({name}) => {
      await getAgent().com.atproto.server.revokeAppPassword({
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
