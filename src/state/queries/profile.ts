import {AtUri} from '@atproto/api'
import {useQuery, useQueryClient, useMutation} from '@tanstack/react-query'
import {useSession} from '../session'

export function useProfileQuery({did}: {did: string | undefined}) {
  const {agent} = useSession()
  return useQuery({
    queryKey: ['profile', did],
    queryFn: async () => {
      const res = await agent.getProfile({actor: did || ''})
      return res.data
    },
    enabled: !!did,
  })
}

export function useProfileFollowMutation() {
  const {agent} = useSession()
  const queryClient = useQueryClient()
  return useMutation<{uri: string; cid: string}, Error, {did: string}>({
    mutationFn: async ({did}) => {
      return await agent.follow(did)
    },
    onSuccess(data, variables) {
      queryClient.invalidateQueries({
        queryKey: ['profile', variables.did],
      })
    },
  })
}

export function useProfileUnfollowMutation() {
  const {agent} = useSession()
  const queryClient = useQueryClient()
  return useMutation<void, Error, {did: string; followUri: string}>({
    mutationFn: async ({followUri}) => {
      return await agent.deleteFollow(followUri)
    },
    onSuccess(data, variables) {
      queryClient.invalidateQueries({
        queryKey: ['profile', variables.did],
      })
    },
  })
}

export function useProfileMuteMutation() {
  const {agent} = useSession()
  const queryClient = useQueryClient()
  return useMutation<void, Error, {did: string}>({
    mutationFn: async ({did}) => {
      await agent.mute(did)
    },
    onSuccess(data, variables) {
      queryClient.invalidateQueries({
        queryKey: ['profile', variables.did],
      })
    },
  })
}

export function useProfileUnmuteMutation() {
  const {agent} = useSession()
  const queryClient = useQueryClient()
  return useMutation<void, Error, {did: string}>({
    mutationFn: async ({did}) => {
      await agent.unmute(did)
    },
    onSuccess(data, variables) {
      queryClient.invalidateQueries({
        queryKey: ['profile', variables.did],
      })
    },
  })
}

export function useProfileBlockMutation() {
  const {agent, currentAccount} = useSession()
  const queryClient = useQueryClient()
  return useMutation<{uri: string; cid: string}, Error, {did: string}>({
    mutationFn: async ({did}) => {
      if (!currentAccount) {
        throw new Error('Not signed in')
      }
      return await agent.app.bsky.graph.block.create(
        {repo: currentAccount.did},
        {subject: did, createdAt: new Date().toISOString()},
      )
    },
    onSuccess(data, variables) {
      queryClient.invalidateQueries({
        queryKey: ['profile', variables.did],
      })
    },
  })
}

export function useProfileUnblockMutation() {
  const {agent, currentAccount} = useSession()
  const queryClient = useQueryClient()
  return useMutation<void, Error, {did: string; blockUri: string}>({
    mutationFn: async ({blockUri}) => {
      if (!currentAccount) {
        throw new Error('Not signed in')
      }
      const {rkey} = new AtUri(blockUri)
      await agent.app.bsky.graph.block.delete({
        repo: currentAccount.did,
        rkey,
      })
    },
    onSuccess(data, variables) {
      queryClient.invalidateQueries({
        queryKey: ['profile', variables.did],
      })
    },
  })
}
