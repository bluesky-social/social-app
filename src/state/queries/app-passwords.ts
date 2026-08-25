import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {com} from '#/lexicons'
import {usePdsClient} from '../session'

const RQKEY_ROOT = 'app-passwords'
export const RQKEY = () => [RQKEY_ROOT]

export function useAppPasswordsQuery() {
  const client = usePdsClient()
  return useQuery({
    staleTime: STALE.MINUTES.FIVE,
    queryKey: RQKEY(),
    queryFn: async () => {
      const data = await client.call(com.atproto.server.listAppPasswords)
      return data.passwords
    },
  })
}

export function useAppPasswordCreateMutation() {
  const queryClient = useQueryClient()
  const client = usePdsClient()
  return useMutation<
    com.atproto.server.createAppPassword.$OutputBody,
    Error,
    {name: string; privileged: boolean}
  >({
    mutationFn: async ({name, privileged}) => {
      return await client.call(com.atproto.server.createAppPassword, {
        name,
        privileged,
      })
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
  const client = usePdsClient()
  return useMutation<void, Error, {name: string}>({
    mutationFn: async ({name}) => {
      await client.call(com.atproto.server.revokeAppPassword, {
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
