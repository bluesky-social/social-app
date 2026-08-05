import {
  type AtUriString,
  type DatetimeString,
  type DidString,
} from '@atproto/syntax'
import {AtUri} from '@atproto/syntax'
import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import {
  RQKEY as LIST_MEMBERS_RQKEY,
  RQKEY_ALL as LIST_MEMBERS_ALL_RQKEY,
} from '#/state/queries/list-members'
import {usePdsClient, useSession} from '#/state/session'
import {app} from '#/lexicons'
import type * as bsky from '#/types/bsky'
import {RQKEY_WITH_MEMBERSHIP as STARTER_PACKS_WITH_MEMBERSHIPS_RKEY} from './actor-starter-packs'

export function useListMembershipAddMutation({
  subject,
  onSuccess,
  onError,
}: {
  /**
   * Needed for optimistic update of starter pack query
   */
  subject?: bsky.profile.AnyProfileView
  onSuccess?: (data: {uri: string; cid: string}) => void
  onError?: (error: Error) => void
} = {}) {
  const {currentAccount} = useSession()
  const pdsClient = usePdsClient()
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
      const res = await pdsClient.create(app.bsky.graph.listitem, {
        subject: actorDid as DidString,
        list: listUri as AtUriString,
        createdAt: new Date().toISOString() as DatetimeString,
      })
      return res
    },
    onSuccess: (data, variables) => {
      // invalidate the members queries (used for rendering the listings)
      // use a timeout to wait for the appview
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: LIST_MEMBERS_RQKEY(variables.listUri),
        })
        void queryClient.invalidateQueries({
          queryKey: LIST_MEMBERS_ALL_RQKEY(variables.listUri),
        })
      }, 1e3)

      // update WITH_MEMBERSHIPS query for starter packs
      if (subject) {
        queryClient.setQueryData<
          InfiniteData<app.bsky.graph.getStarterPacksWithMembership.$OutputBody>
        >(STARTER_PACKS_WITH_MEMBERSHIPS_RKEY(variables.actorDid), old => {
          if (!old) return old

          return {
            ...old,
            pages: old.pages.map(page => ({
              ...page,
              starterPacksWithMembership: page.starterPacksWithMembership.map(
                spWithMembership => {
                  if (
                    spWithMembership.starterPack.list &&
                    spWithMembership.starterPack.list?.uri === variables.listUri
                  ) {
                    return {
                      ...spWithMembership,
                      starterPack: {
                        ...spWithMembership.starterPack,
                        listItemsSample: [
                          {
                            uri: data.uri as AtUriString,
                            subject: subject as app.bsky.actor.defs.ProfileView,
                          },
                          ...(spWithMembership.starterPack.listItemsSample?.filter(
                            item => item.subject.did !== variables.actorDid,
                          ) ?? []),
                        ],
                        list: {
                          ...spWithMembership.starterPack.list,
                          listItemCount:
                            (spWithMembership.starterPack.list.listItemCount ??
                              0) + 1,
                        },
                      },
                      listItem: {
                        uri: data.uri as AtUriString,
                        subject: subject as app.bsky.actor.defs.ProfileView,
                      },
                    }
                  }

                  return spWithMembership
                },
              ),
            })),
          }
        })
      }

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
  const pdsClient = usePdsClient()
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
      await pdsClient.delete(app.bsky.graph.listitem, {
        repo: currentAccount.did as DidString,
        rkey: membershipUrip.rkey,
      })
    },
    onSuccess: (data, variables) => {
      // invalidate the members queries (used for rendering the listings)
      // use a timeout to wait for the appview
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: LIST_MEMBERS_RQKEY(variables.listUri),
        })
        void queryClient.invalidateQueries({
          queryKey: LIST_MEMBERS_ALL_RQKEY(variables.listUri),
        })
      }, 1e3)

      // update WITH_MEMBERSHIPS query for starter packs
      queryClient.setQueryData<
        InfiniteData<app.bsky.graph.getStarterPacksWithMembership.$OutputBody>
      >(STARTER_PACKS_WITH_MEMBERSHIPS_RKEY(variables.actorDid), old => {
        if (!old) return old

        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            starterPacksWithMembership: page.starterPacksWithMembership.map(
              spWithMembership => {
                if (
                  spWithMembership.starterPack.list &&
                  spWithMembership.starterPack.list.uri === variables.listUri
                ) {
                  return {
                    ...spWithMembership,
                    starterPack: {
                      ...spWithMembership.starterPack,
                      listItemsSample:
                        spWithMembership.starterPack.listItemsSample?.filter(
                          item => item.subject.did !== variables.actorDid,
                        ),
                      list: {
                        ...spWithMembership.starterPack.list,
                        listItemCount: Math.max(
                          0,
                          (spWithMembership.starterPack.list.listItemCount ??
                            1) - 1,
                        ),
                      },
                    },
                    listItem: undefined,
                  }
                }

                return spWithMembership
              },
            ),
          })),
        }
      })

      onSuccess?.(data)
    },
    onError,
  })
}
