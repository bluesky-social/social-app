import {type AtIdentifierString, type AtUriString} from '@atproto/syntax'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient} from '#/state/session'
import type * as AppBskyActorDefs from '#/lexicons/app/bsky/actor/defs'
import * as AppBskyGraphGetListsWithMembership from '#/lexicons/app/bsky/graph/getListsWithMembership'

export type ListWithMembership =
  AppBskyGraphGetListsWithMembership.ListWithMembership

const listsWithMembershipQueryKeyRoot = 'lists-with-membership'
export const createListsWithMembershipQueryKey = (args: {actor: string}) =>
  createQueryKey(listsWithMembershipQueryKeyRoot, args)

export function useListsWithMembershipQuery({
  actor,
  enabled = true,
}: {
  actor: string | undefined
  enabled?: boolean
}) {
  const client = useAppviewClient()

  return useInfiniteQuery<
    AppBskyGraphGetListsWithMembership.$OutputBody,
    Error,
    InfiniteData<AppBskyGraphGetListsWithMembership.$OutputBody>,
    QueryKey,
    string | undefined
  >({
    queryKey: createListsWithMembershipQueryKey({actor: actor ?? ''}),
    queryFn: async ({pageParam}: {pageParam?: string}) => {
      return await client.call(AppBskyGraphGetListsWithMembership, {
        // the enabled flag prevents this from running until actor is set
        actor: actor! as AtIdentifierString,
        limit: 50,
        cursor: pageParam,
      })
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
    InfiniteData<AppBskyGraphGetListsWithMembership.$OutputBody>
  >(createListsWithMembershipQueryKey({actor}), old => {
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
                // callers hand over the membership uri as a plain string
                uri: membershipUri as AtUriString,
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
    InfiniteData<AppBskyGraphGetListsWithMembership.$OutputBody>
  >(createListsWithMembershipQueryKey({actor}), old => {
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
