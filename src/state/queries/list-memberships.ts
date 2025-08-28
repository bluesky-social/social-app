import {type AppBskyGraphGetListsWithMembership, AtUri} from '@atproto/api'
import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import {RQKEY as LIST_MEMBERS_RQKEY} from '#/state/queries/list-members'
import {useAgent, useSession} from '#/state/session'

const RQKEY_ROOT = 'list-memberships'
export const RQKEY = (did: string) => [RQKEY_ROOT, did]

export function useGetListsWithMembership(did: string) {
  const agent = useAgent()

  return useInfiniteQuery({
    queryKey: RQKEY(did),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({pageParam}) => {
      const {data} = await agent.app.bsky.graph.getListsWithMembership({
        actor: did,
        cursor: pageParam,
      })
      return data
    },
    getNextPageParam: lastPage => lastPage.cursor,
  })
}

export function useListMembershipAddMutation({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: {uri: string; cid: string}) => void
  onError?: (error: Error) => void
} = {}) {
  const {currentAccount} = useSession()
  const agent = useAgent()
  const queryClient = useQueryClient()
  return useMutation<
    {uri: string; cid: string},
    Error,
    {listUri: string; actorDid: string}
  >({
    mutationFn: async ({listUri, actorDid}) => {
      if (!currentAccount) {
        throw new Error('Not signed in')
      }
      const res = await agent.app.bsky.graph.listitem.create(
        {repo: currentAccount.did},
        {
          subject: actorDid,
          list: listUri,
          createdAt: new Date().toISOString(),
        },
      )
      // TODO
      // we need to wait for appview to update, but there's not an efficient
      // query for that, so we use a timeout below
      // -prf
      return res
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        RQKEY(variables.actorDid),
        (
          old?: InfiniteData<AppBskyGraphGetListsWithMembership.OutputSchema>,
        ) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              listsWithMembership: page.listsWithMembership.map(list => ({
                ...list,
                listItem:
                  list.list.uri === variables.listUri ? data : list.listItem,
              })),
            })),
          }
        },
      )

      // invalidate the members queries (used for rendering the listings)
      // use a timeout to wait for the appview (see above)
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: LIST_MEMBERS_RQKEY(variables.listUri),
        })
      }, 1e3)
      onSuccess?.(data)
    },
    onError,
  })
}

export function useListMembershipRemoveMutation({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: void) => void
  onError?: (error: Error) => void
} = {}) {
  const {currentAccount} = useSession()
  const agent = useAgent()
  const queryClient = useQueryClient()
  return useMutation<
    void,
    Error,
    {listUri: string; actorDid: string; membershipUri: string}
  >({
    mutationFn: async ({membershipUri}) => {
      if (!currentAccount) {
        throw new Error('Not signed in')
      }
      const membershipUrip = new AtUri(membershipUri)
      await agent.app.bsky.graph.listitem.delete({
        repo: currentAccount.did,
        rkey: membershipUrip.rkey,
      })
      // TODO
      // we need to wait for appview to update, but there's not an efficient
      // query for that, so we use a timeout below
      // -prf
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        RQKEY(variables.actorDid),
        (
          old?: InfiniteData<AppBskyGraphGetListsWithMembership.OutputSchema>,
        ) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              listsWithMembership: page.listsWithMembership.map(list => ({
                ...list,
                listItem:
                  list.list.uri === variables.listUri
                    ? undefined
                    : list.listItem,
              })),
            })),
          }
        },
      )

      // invalidate the members queries (used for rendering the listings)
      // use a timeout to wait for the appview (see above)
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: LIST_MEMBERS_RQKEY(variables.listUri),
        })
      }, 1e3)
      onSuccess?.(data)
    },
    onError,
  })
}
