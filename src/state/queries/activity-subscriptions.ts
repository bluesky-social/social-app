import {type AppBskyNotificationDeclaration} from '@atproto/api'
import {t} from '@lingui/macro'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {useAgent, useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'

const RQKEY_getNotificationDeclaration = ['notification-declaration']

export function useNotificationDeclarationQuery() {
  const agent = useAgent()
  const {currentAccount} = useSession()
  return useQuery({
    queryKey: RQKEY_getNotificationDeclaration,
    queryFn: async () => {
      try {
        const response = await agent.app.bsky.notification.declaration.get({
          repo: currentAccount!.did,
          rkey: 'self',
        })
        return response
      } catch (err) {
        if (
          err instanceof Error &&
          err.message.startsWith('Could not locate record')
        ) {
          return {
            value: {
              $type: 'app.bsky.notification.declaration',
              allowSubscriptions: 'followers',
            } satisfies AppBskyNotificationDeclaration.Record,
          }
        } else {
          throw err
        }
      }
    },
  })
}

export function useNotificationDeclarationMutation() {
  const agent = useAgent()
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (record: AppBskyNotificationDeclaration.Record) => {
      const response = await agent.com.atproto.repo.putRecord({
        repo: currentAccount!.did,
        collection: 'app.bsky.notification.declaration',
        rkey: 'self',
        record,
      })
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
            value,
          }
        },
      )
    },
    onError: () => {
      Toast.show(t`Failed to update notification declaration`)
      queryClient.invalidateQueries({
        queryKey: RQKEY_getNotificationDeclaration,
      })
    },
  })
}
