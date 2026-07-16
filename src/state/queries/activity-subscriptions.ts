import {type AtIdentifierString} from '@atproto/syntax'
import {t} from '@lingui/core/macro'
import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {useAppviewClient, usePdsClient, useSession} from '#/state/session'
import * as Toast from '#/components/Toast'
import {app} from '#/lexicons'

export const RQKEY_getActivitySubscriptions = ['activity-subscriptions']
export const RQKEY_getNotificationDeclaration = ['notification-declaration']

export function useActivitySubscriptionsQuery() {
  const client = useAppviewClient()

  return useInfiniteQuery({
    queryKey: RQKEY_getActivitySubscriptions,
    queryFn: async ({pageParam}) => {
      return await client.call(
        app.bsky.notification.listActivitySubscriptions,
        {
          cursor: pageParam,
        },
      )
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: prev => prev.cursor,
  })
}

export function useNotificationDeclarationQuery() {
  const client = usePdsClient()
  const {currentAccount} = useSession()
  return useQuery({
    queryKey: RQKEY_getNotificationDeclaration,
    queryFn: async () => {
      try {
        const response = await client.get(app.bsky.notification.declaration, {
          repo: currentAccount!.did as AtIdentifierString,
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
            } satisfies app.bsky.notification.declaration.Main,
          }
        } else {
          throw err
        }
      }
    },
  })
}

export function useNotificationDeclarationMutation() {
  const client = usePdsClient()
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (record: app.bsky.notification.declaration.Main) => {
      const response = await client.put(
        app.bsky.notification.declaration,
        record,
        {
          repo: currentAccount!.did as AtIdentifierString,
          rkey: 'self',
        },
      )
      return response
    },
    onMutate: value => {
      queryClient.setQueryData(
        RQKEY_getNotificationDeclaration,
        (old?: {
          uri: string
          cid: string
          value: app.bsky.notification.declaration.Main
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

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<app.bsky.actor.defs.ProfileView, void> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<app.bsky.notification.listActivitySubscriptions.$OutputBody>
  >({
    queryKey: RQKEY_getActivitySubscriptions,
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }
    for (const page of queryData.pages) {
      for (const subscription of page.subscriptions) {
        if (subscription.did === did) {
          yield subscription
        }
      }
    }
  }
}
