import {
  AtUri,
  AppBskyActorDefs,
  AppBskyActorProfile,
  AppBskyActorGetProfile,
  BskyAgent,
} from '@atproto/api'
import {useQuery, useQueryClient, useMutation} from '@tanstack/react-query'
import {Image as RNImage} from 'react-native-image-crop-picker'
import {useSession} from '../session'
import {updateProfileShadow} from '../cache/profile-shadow'
import {uploadBlob} from '#/lib/api'
import {until} from '#/lib/async/until'
import {RQKEY as RQKEY_MY_MUTED} from './my-muted-accounts'
import {RQKEY as RQKEY_MY_BLOCKED} from './my-blocked-accounts'

export const RQKEY = (did: string) => ['profile', did]

export function useProfileQuery({did}: {did: string | undefined}) {
  const {agent} = useSession()
  return useQuery({
    queryKey: RQKEY(did || ''),
    queryFn: async () => {
      const res = await agent.getProfile({actor: did || ''})
      return res.data
    },
    enabled: !!did,
  })
}

interface ProfileUpdateParams {
  profile: AppBskyActorDefs.ProfileView
  updates: AppBskyActorProfile.Record
  newUserAvatar: RNImage | undefined | null
  newUserBanner: RNImage | undefined | null
}
export function useProfileUpdateMutation() {
  const {agent} = useSession()
  const queryClient = useQueryClient()
  return useMutation<void, Error, ProfileUpdateParams>({
    mutationFn: async ({profile, updates, newUserAvatar, newUserBanner}) => {
      await agent.upsertProfile(async existing => {
        existing = existing || {}
        existing.displayName = updates.displayName
        existing.description = updates.description
        if (newUserAvatar) {
          const res = await uploadBlob(
            agent,
            newUserAvatar.path,
            newUserAvatar.mime,
          )
          existing.avatar = res.data.blob
        } else if (newUserAvatar === null) {
          existing.avatar = undefined
        }
        if (newUserBanner) {
          const res = await uploadBlob(
            agent,
            newUserBanner.path,
            newUserBanner.mime,
          )
          existing.banner = res.data.blob
        } else if (newUserBanner === null) {
          existing.banner = undefined
        }
        return existing
      })
      await whenAppViewReady(agent, profile.did, res => {
        if (typeof newUserAvatar !== 'undefined') {
          if (newUserAvatar === null && res.data.avatar) {
            // url hasnt cleared yet
            return false
          } else if (res.data.avatar === profile.avatar) {
            // url hasnt changed yet
            return false
          }
        }
        if (typeof newUserBanner !== 'undefined') {
          if (newUserBanner === null && res.data.banner) {
            // url hasnt cleared yet
            return false
          } else if (res.data.banner === profile.banner) {
            // url hasnt changed yet
            return false
          }
        }
        return (
          res.data.displayName === updates.displayName &&
          res.data.description === updates.description
        )
      })
    },
    onSuccess(data, variables) {
      // invalidate cache
      queryClient.invalidateQueries({
        queryKey: RQKEY(variables.profile.did),
      })
    },
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
  const queryClient = useQueryClient()
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
    onSuccess() {
      queryClient.invalidateQueries({queryKey: RQKEY_MY_MUTED()})
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
      queryClient.invalidateQueries({queryKey: RQKEY_MY_BLOCKED()})
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

async function whenAppViewReady(
  agent: BskyAgent,
  actor: string,
  fn: (res: AppBskyActorGetProfile.Response) => boolean,
) {
  await until(
    5, // 5 tries
    1e3, // 1s delay between tries
    fn,
    () => agent.app.bsky.actor.getProfile({actor}),
  )
}
