import {type AppBskyActorDefs} from '@atproto/api'
import {type AtIdentifierString} from '@atproto/syntax'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'

export type ListWithMembership =
  app.bsky.graph.getListsWithMembership.ListWithMembership

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
    app.bsky.graph.getListsWithMembership.$OutputBody,
    Error,
    InfiniteData<app.bsky.graph.getListsWithMembership.$OutputBody>,
    QueryKey,
    string | undefined
  >({
    queryKey: createListsWithMembershipQueryKey({actor: actor ?? ''}),
    queryFn: async ({pageParam}: {pageParam?: string}) => {
      return await client.call(app.bsky.graph.getListsWithMembership, {
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
    InfiniteData<app.bsky.graph.getListsWithMembership.$OutputBody>
  >(createListsWithMembershipQueryKey({actor}), old => {
    if (!old) return old

    return {
      ...old,
      pages: old.pages.map(page => ({
        ...page,
        listsWithMembership: page.listsWithMembership.map(lwm => {
          if (lwm.list.uri === listUri) {
            /*
             * Callers hand over a plain at-uri and an old-world ProfileView,
             * whose `uri`/`did` are unbranded strings. They are runtime
             * identical to the generated branded forms, so the synthesised
             * listItem is asserted rather than re-validated.
             */
            return {
              ...lwm,
              listItem: {
                uri: membershipUri,
                subject,
              } as app.bsky.graph.defs.ListItemView,
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
    InfiniteData<app.bsky.graph.getListsWithMembership.$OutputBody>
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
