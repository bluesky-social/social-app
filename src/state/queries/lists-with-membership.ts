import {
  type AppBskyActorDefs,
  type AppBskyGraphGetListsWithMembership,
} from '@atproto/api'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {useAgent} from '#/state/session'

export type ListWithMembership =
  AppBskyGraphGetListsWithMembership.ListWithMembership

const RQKEY_ROOT = 'lists-with-membership'
export const RQKEY = (actor: string) => [RQKEY_ROOT, actor]

export function useListsWithMembershipQuery({
  actor,
  enabled = true,
}: {
  actor: string
  enabled?: boolean
}) {
  const agent = useAgent()

  return useInfiniteQuery<
    AppBskyGraphGetListsWithMembership.OutputSchema,
    Error,
    InfiniteData<AppBskyGraphGetListsWithMembership.OutputSchema>,
    QueryKey,
    string | undefined
  >({
    queryKey: RQKEY(actor),
    queryFn: async ({pageParam}: {pageParam?: string}) => {
      const res = await agent.app.bsky.graph.getListsWithMembership({
        actor,
        limit: 50,
        cursor: pageParam,
      })
      return res.data
    },
    enabled: Boolean(actor) && enabled,
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
  })
}

export function updateListMembershipOptimistically({
  queryClient,
  actor,
  listUri,
  membershipUri,
  subject,
}: {
  queryClient: QueryClient
  actor: string
  listUri: string
  membershipUri: string
  subject: AppBskyActorDefs.ProfileView
}) {
  queryClient.setQueryData<
    InfiniteData<AppBskyGraphGetListsWithMembership.OutputSchema>
  >(RQKEY(actor), old => {
    if (!old) return old

    return {
      ...old,
      pages: old.pages.map(page => ({
        ...page,
        listsWithMembership: page.listsWithMembership.map(lwm => {
          if (lwm.list.uri === listUri) {
            return {
              ...lwm,
              listItem: {
                uri: membershipUri,
                subject,
              },
            }
          }
          return lwm
        }),
      })),
    }
  })
}

export function removeListMembershipOptimistically({
  queryClient,
  actor,
  listUri,
}: {
  queryClient: QueryClient
  actor: string
  listUri: string
}) {
  queryClient.setQueryData<
    InfiniteData<AppBskyGraphGetListsWithMembership.OutputSchema>
  >(RQKEY(actor), old => {
    if (!old) return old

    return {
      ...old,
      pages: old.pages.map(page => ({
        ...page,
        listsWithMembership: page.listsWithMembership.map(lwm => {
          if (lwm.list.uri === listUri) {
            return {
              ...lwm,
              listItem: undefined,
            }
          }
          return lwm
        }),
      })),
    }
  })
}
