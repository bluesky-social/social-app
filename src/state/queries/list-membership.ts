import {AtUri} from '@atproto/api'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {useSession} from '../session'
import {RQKEY as LIST_MEMBERS_RQKEY} from './list-members'

const SANITY_LIMIT = 100

export const RQKEY = (listUri: string, actorDid: string) => [
  'list-membership',
  listUri,
  actorDid,
]

export function useListMembershipQuery(listUri: string, actorDid: string) {
  const {agent} = useSession()
  return useQuery<string | false | undefined>({
    queryKey: RQKEY(listUri, actorDid),
    async queryFn() {
      const listUrip = new AtUri(listUri)
      let cursor
      // NOTE
      // because we don't currently have an API for fetching list membership
      // we have to search all list items
      // -prf
      for (let i = 0; i < SANITY_LIMIT; i++) {
        const res = await agent.app.bsky.graph.listitem.list({
          repo: listUrip.hostname,
          limit: 100,
          cursor,
        })
        const membership = res.records.find(
          item =>
            item.value.subject === actorDid && item.value.list === listUri,
        )
        if (membership) {
          return membership.uri
        }
        cursor = res.cursor
        if (!cursor) {
          return false // reached the end; known false
        }
      }
      return undefined // had to give up; unknown
    },
  })
}

export function useListMembershipAddMutation() {
  const {agent, currentAccount} = useSession()
  const queryClient = useQueryClient()
  return useMutation<
    {uri: string; cid: string},
    Error,
    {listUri: string; actorDid: string}
  >({
    mutationFn: async ({listUri, actorDid}) => {
      if (!currentAccount) {
        throw new Error('Not logged in')
      }
      return agent.app.bsky.graph.listitem.create(
        {repo: currentAccount.did},
        {
          subject: actorDid,
          list: listUri,
          createdAt: new Date().toISOString(),
        },
      )
    },
    onSuccess(data, variables) {
      queryClient.setQueryData(
        RQKEY(variables.listUri, variables.actorDid),
        data.uri,
      )
      queryClient.invalidateQueries({
        queryKey: LIST_MEMBERS_RQKEY(variables.listUri),
      })
    },
  })
}

export function useListMembershipRemoveMutation() {
  const {agent, currentAccount} = useSession()
  const queryClient = useQueryClient()
  return useMutation<
    void,
    Error,
    {listUri: string; actorDid: string; membershipUri: string}
  >({
    mutationFn: async ({membershipUri}) => {
      if (!currentAccount) {
        throw new Error('Not logged in')
      }
      const membershipUrip = new AtUri(membershipUri)
      await agent.app.bsky.graph.listitem.delete({
        repo: currentAccount.did,
        rkey: membershipUrip.rkey,
      })
    },
    onSuccess(data, variables) {
      queryClient.setQueryData(
        RQKEY(variables.listUri, variables.actorDid),
        false,
      )
      queryClient.invalidateQueries({
        queryKey: LIST_MEMBERS_RQKEY(variables.listUri),
      })
    },
  })
}
