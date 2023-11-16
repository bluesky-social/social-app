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

import {useState} from 'react'

export function useProfileFollowMutationQueue(profile) {
  const did = profile.did
  const followingUri = profile.viewer?.following
  const followMutation = useProfileFollowMutation()
  const unfollowMutation = useProfileUnfollowMutation()

  const queueToggle = useToggleMutationQueue({
    initialState: {followingUri},
    runMutation: async (prevState, isOn) => {
      if (isOn) {
        const {uri} = await followMutation.mutateAsync({
          did,
          skipOptimistic: true,
        })
        const nextState = {followingUri: uri}
        return nextState
      } else {
        await unfollowMutation.mutateAsync({
          did,
          followUri: prevState.followingUri,
          skipOptimistic: true,
        })
        const nextState = {followingUri: undefined}
        return nextState
      }
    },
    onSuccess(finalState) {
      updateProfileShadow(did, finalState)
    },
  })

  async function queueFollow() {
    updateProfileShadow(did, {followingUri: 'pending'})
    return queueToggle(true)
  }

  async function queueUnfollow() {
    updateProfileShadow(did, {followingUri: undefined})
    return queueToggle(false)
  }

  return [queueFollow, queueUnfollow]
}

function useToggleMutationQueue({initialState, runMutation, onSuccess}) {
  const [queue] = useState({
    activeTask: null,
    queuedTask: null,
  })

  function queueToggle(isOn) {
    return new Promise((resolve, reject) => {
      queue.queuedTask = {isOn, resolve, reject}
      processQueue()
    })
  }

  async function processQueue() {
    if (queue.activeTask) {
      return
    }
    let confirmedState = initialState
    try {
      while (queue.queuedTask) {
        const prevTask = queue.activeTask
        const nextTask = queue.queuedTask
        queue.activeTask = nextTask
        queue.queuedTask = null
        if (prevTask?.isOn === nextTask.isOn) {
          continue
        }
        try {
          confirmedState = await runMutation(confirmedState, nextTask.isOn)
          nextTask.resolve(confirmedState)
        } catch (e) {
          nextTask.reject(e)
          throw e
        }
      }
    } finally {
      onSuccess(confirmedState)
      queue.activeTask = null
      queue.queuedTask = null
    }
  }

  return queueToggle
}

export function useProfileFollowMutation() {
  const {agent} = useSession()
  return useMutation<
    {uri: string; cid: string},
    Error,
    {did: string; skipOptimistic?: boolean}
  >({
    mutationFn: async ({did}) => {
      await new Promise(resolve => setTimeout(resolve, 3000))
      return await agent.follow(did)
    },
    onMutate(variables) {
      console.log('follow:mutate')
      if (!variables.skipOptimistic) {
        // optimstically update
        updateProfileShadow(variables.did, {
          followingUri: 'pending',
        })
      }
    },
    onSuccess(data, variables) {
      console.log('follow:success')
      // finalize
      if (!variables.skipOptimistic) {
        updateProfileShadow(variables.did, {
          followingUri: data.uri,
        })
      }
    },
    onError(error, variables) {
      console.log('follow:error')
      if (!variables.skipOptimistic) {
        // revert the optimistic update
        updateProfileShadow(variables.did, {
          followingUri: undefined,
        })
      }
    },
  })
}

export function useProfileUnfollowMutation() {
  const {agent} = useSession()
  return useMutation<
    void,
    Error,
    {did: string; followUri: string; skipOptimistic?: boolean}
  >({
    mutationFn: async ({followUri}) => {
      await new Promise(resolve => setTimeout(resolve, 3000))
      return await agent.deleteFollow(followUri)
    },
    onMutate(variables) {
      console.log('unfollow:mutate')
      // optimstically update
      if (!variables.skipOptimistic) {
        updateProfileShadow(variables.did, {
          followingUri: undefined,
        })
      }
    },
    onSuccess() {
      console.log('unfollow:success')
    },
    onError(error, variables) {
      console.log('unfollow:error')
      if (!variables.skipOptimistic) {
        // revert the optimistic update
        updateProfileShadow(variables.did, {
          followingUri: variables.followUri,
        })
      }
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
