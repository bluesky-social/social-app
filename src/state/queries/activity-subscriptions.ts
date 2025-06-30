import {type AppBskyNotificationDeclaration} from '@atproto/api'
import {t} from '@lingui/macro'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {useAgent, useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'

const RQKEY_getActivitySubscriptions = ['activity-subscriptions']
const RQKEY_getNotificationDeclaration = ['notification-declaration']

export function useActivitySubscriptionsQuery() {
  const agent = useAgent()

  return useInfiniteQuery({
    queryKey: RQKEY_getActivitySubscriptions,
    queryFn: async ({pageParam}) => {
      const response =
        await agent.app.bsky.notification.listActivitySubscriptions({
          cursor: pageParam,
        })
      return response.data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: prev => prev.cursor,
  })
}

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
      const response = await agent.app.bsky.notification.declaration.put(
        {
          repo: currentAccount!.did,
          rkey: 'self',
        },
        record,
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
