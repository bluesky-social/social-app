import {AtUri} from '@atproto/api'
import {useQuery, useMutation} from '@tanstack/react-query'
import {useSession} from '../session'
import {updateProfileShadow} from '../cache/profile-shadow'

export const RQKEY = (did: string) => ['profile', did]

export function useProfileQuery({did}: {did: string | undefined}) {
  const {agent} = useSession()
  return useQuery({
    queryKey: RQKEY(did),
    queryFn: async () => {
      const res = await agent.getProfile({actor: did || ''})
      return res.data
    },
    enabled: !!did,
  })
}

export function useProfileFollowMutation() {
  const {agent} = useSession()
  return useMutation<{uri: string; cid: string}, Error, {did: string}>({
    mutationFn: async ({did}) => {
      return await agent.follow(did)
    },
    onMutate(variables) {
      // optimstically update
      updateProfileShadow(variables.did, {
        followingUri: 'pending',
      })
    },
    onSuccess(data, variables) {
      // finalize
      updateProfileShadow(variables.did, {
        followingUri: data.uri,
      })
    },
    onError(error, variables) {
      // revert the optimistic update
      updateProfileShadow(variables.did, {
        followingUri: undefined,
      })
    },
  })
}

export function useProfileUnfollowMutation() {
  const {agent} = useSession()
  return useMutation<void, Error, {did: string; followUri: string}>({
    mutationFn: async ({followUri}) => {
      return await agent.deleteFollow(followUri)
    },
    onMutate(variables) {
      // optimstically update
      updateProfileShadow(variables.did, {
        followingUri: undefined,
      })
    },
    onError(error, variables) {
      // revert the optimistic update
      updateProfileShadow(variables.did, {
        followingUri: variables.followUri,
      })
    },
  })
}

export function useProfileMuteMutation() {
  const {agent} = useSession()
  return useMutation<void, Error, {did: string}>({
    mutationFn: async ({did}) => {
      await agent.mute(did)
    },
    onMutate(variables) {
      // optimstically update
      updateProfileShadow(variables.did, {
        muted: true,
      })
    },
    onError(error, variables) {
      // revert the optimistic update
      updateProfileShadow(variables.did, {
        muted: false,
      })
    },
  })
}

export function useProfileUnmuteMutation() {
  const {agent} = useSession()
  return useMutation<void, Error, {did: string}>({
    mutationFn: async ({did}) => {
      await agent.unmute(did)
    },
    onMutate(variables) {
      // optimstically update
      updateProfileShadow(variables.did, {
        muted: false,
      })
    },
    onError(error, variables) {
      // revert the optimistic update
      updateProfileShadow(variables.did, {
        muted: true,
      })
    },
  })
}

export function useProfileBlockMutation() {
  const {agent, currentAccount} = useSession()
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
    onMutate(variables) {
      // optimstically update
      updateProfileShadow(variables.did, {
        blockingUri: 'pending',
      })
    },
    onSuccess(data, variables) {
      // finalize
      updateProfileShadow(variables.did, {
        blockingUri: data.uri,
      })
    },
    onError(error, variables) {
      // revert the optimistic update
      updateProfileShadow(variables.did, {
        blockingUri: undefined,
      })
    },
  })
}

export function useProfileUnblockMutation() {
  const {agent, currentAccount} = useSession()
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
    onMutate(variables) {
      // optimstically update
      updateProfileShadow(variables.did, {
        blockingUri: undefined,
      })
    },
    onError(error, variables) {
      // revert the optimistic update
      updateProfileShadow(variables.did, {
        blockingUri: variables.blockUri,
      })
    },
  })
}
