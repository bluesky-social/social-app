import {t} from '@lingui/core/macro'
import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {isRecordNotFoundError} from '#/lib/xrpc-error'
import {useAppviewClient, usePdsClient, useSession} from '#/state/session'
import * as Toast from '#/components/Toast'
import type * as AppBskyActorDefs from '#/lexicons/app/bsky/actor/defs'
import * as AppBskyNotificationDeclaration from '#/lexicons/app/bsky/notification/declaration'
import * as AppBskyNotificationListActivitySubscriptions from '#/lexicons/app/bsky/notification/listActivitySubscriptions'

export const RQKEY_getActivitySubscriptions = ['activity-subscriptions']
export const RQKEY_getNotificationDeclaration = ['notification-declaration']

export function useActivitySubscriptionsQuery() {
  const client = useAppviewClient()

  return useInfiniteQuery({
    queryKey: RQKEY_getActivitySubscriptions,
    queryFn: async ({pageParam}) => {
      return await client.call(AppBskyNotificationListActivitySubscriptions, {
        cursor: pageParam,
      })
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
        const response = await client.get(AppBskyNotificationDeclaration, {
          repo: currentAccount!.did,
          rkey: 'self',
        })
        return response
      } catch (err) {
        if (isRecordNotFoundError(err)) {
          return {
            value: {
              $type: 'app.bsky.notification.declaration',
              allowSubscriptions: 'followers',
            } satisfies AppBskyNotificationDeclaration.Main,
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
    mutationFn: async (record: AppBskyNotificationDeclaration.Main) => {
      const response = await client.put(
        AppBskyNotificationDeclaration,
        record,
        {
          repo: currentAccount!.did,
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
          value: AppBskyNotificationDeclaration.Main
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
): Generator<AppBskyActorDefs.ProfileView, void> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<AppBskyNotificationListActivitySubscriptions.$OutputBody>
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
