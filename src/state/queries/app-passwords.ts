import {ComAtprotoServerCreateAppPassword} from '@atproto/api'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useAgent} from '../session'

const RQKEY_ROOT = 'app-passwords'
export const RQKEY = () => [RQKEY_ROOT]

export function useAppPasswordsQuery() {
  const {getAgent} = useAgent()
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
  const {getAgent} = useAgent()
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
  const {getAgent} = useAgent()
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
