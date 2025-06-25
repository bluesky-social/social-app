import {type AppBskyNotificationDeclaration} from '@atproto/api'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {useAgent, useSession} from '#/state/session'

const RQKEY_getNotificationDeclaration = ['notification-declaration']

export function useNotificationDeclarationQuery() {
  const agent = useAgent()
  const {currentAccount} = useSession()
  return useQuery({
    queryKey: RQKEY_getNotificationDeclaration,
    queryFn: async () => {
      const response = await agent.app.bsky.notification.declaration.get({
        repo: currentAccount!.did,
        rkey: 'self',
      })
      return response
    },
  })
}

export function useNotificationDeclarationMutation(swapCommit?: string) {
  const agent = useAgent()
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: AppBskyNotificationDeclaration.Record) => {
      const response = await agent.app.bsky.notification.declaration.create(
        {
          repo: currentAccount!.did,
          rkey: 'self',
          swapCommit,
        },
        data,
      )
      return response
    },
    onMutate: value => {
      queryClient.setQueryData(
        RQKEY_getNotificationDeclaration,
        (old?: {
          uri: string
          cid: string
          value: AppBskyNotificationDeclaration.Record
        }) => {
          if (!old) return old
          return {
            ...old,
            value,
          }
        },
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: RQKEY_getNotificationDeclaration,
      })
    },
  })
}
