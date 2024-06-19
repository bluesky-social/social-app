import {AtUri} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {useAgent} from '#/state/session'
import {invalidateActorStarterPacksQuery} from 'state/queries/actor-starter-packs'
import {invalidateListMembersQuery} from 'state/queries/list-members'
import {invalidateStarterPack} from 'state/queries/useStarterPackQuery'

export function useDeleteStarterPackMutation() {
  const agent = useAgent()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({listUri, rkey}: {listUri: string; rkey: string}) => {
      if (!agent.session) {
        throw new Error(`Requires logged in user`)
      }

      // TODO parallel?
      await agent.app.bsky.graph.list.delete({
        repo: agent.session.did,
        rkey: new AtUri(listUri).rkey,
      })
      await agent.app.bsky.graph.starterpack.delete({
        repo: agent.session.did,
        rkey,
      })
    },
    onSuccess: async (_, {listUri, rkey}) => {
      await invalidateListMembersQuery({queryClient, uri: listUri})
      await invalidateActorStarterPacksQuery({
        queryClient,
        did: agent.session!.did,
      })
      await invalidateStarterPack({
        queryClient,
        did: agent.session!.did,
        rkey,
      })
    },
  })
}
