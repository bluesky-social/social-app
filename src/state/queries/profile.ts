import {useCallback} from 'react'
import {
  AtUri,
  AppBskyActorDefs,
  AppBskyActorProfile,
  AppBskyActorGetProfile,
} from '@atproto/api'
import {
  useQuery,
  useQueryClient,
  useMutation,
  QueryClient,
} from '@tanstack/react-query'
import {Image as RNImage} from 'react-native-image-crop-picker'
import {useSession, getAgent} from '../session'
import {updateProfileShadow} from '../cache/profile-shadow'
import {uploadBlob} from '#/lib/api'
import {until} from '#/lib/async/until'
import {Shadow} from '#/state/cache/types'
import {useToggleMutationQueue} from '#/lib/hooks/useToggleMutationQueue'
import {RQKEY as RQKEY_MY_MUTED} from './my-muted-accounts'
import {RQKEY as RQKEY_MY_BLOCKED} from './my-blocked-accounts'
import {STALE} from '#/state/queries'
import {track} from '#/lib/analytics/analytics'

export const RQKEY = (did: string) => ['profile', did]

export function useProfileQuery({did}: {did: string | undefined}) {
  const {currentAccount} = useSession()
  const isCurrentAccount = did === currentAccount?.did

  return useQuery({
    // WARNING
    // this staleTime is load-bearing
    // if you remove it, the UI infinite-loops
    // -prf
    staleTime: isCurrentAccount ? STALE.SECONDS.THIRTY : STALE.MINUTES.FIVE,
    refetchOnWindowFocus: true,
    queryKey: RQKEY(did || ''),
    queryFn: async () => {
      const res = await getAgent().getProfile({actor: did || ''})
      return res.data
    },
    enabled: !!did,
  })
}

interface ProfileUpdateParams {
  profile: AppBskyActorDefs.ProfileView
  updates:
    | AppBskyActorProfile.Record
    | ((existing: AppBskyActorProfile.Record) => AppBskyActorProfile.Record)
  newUserAvatar?: RNImage | undefined | null
  newUserBanner?: RNImage | undefined | null
  checkCommitted?: (res: AppBskyActorGetProfile.Response) => boolean
}
export function useProfileUpdateMutation() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, ProfileUpdateParams>({
    mutationFn: async ({
      profile,
      updates,
      newUserAvatar,
      newUserBanner,
      checkCommitted,
    }) => {
      await getAgent().upsertProfile(async existing => {
        existing = existing || {}
        if (typeof updates === 'function') {
          existing = updates(existing)
        } else {
          existing.displayName = updates.displayName
          existing.description = updates.description
        }
        if (newUserAvatar) {
          const res = await uploadBlob(
            getAgent(),
            newUserAvatar.path,
            newUserAvatar.mime,
          )
          existing.avatar = res.data.blob
        } else if (newUserAvatar === null) {
          existing.avatar = undefined
        }
        if (newUserBanner) {
          const res = await uploadBlob(
            getAgent(),
            newUserBanner.path,
            newUserBanner.mime,
          )
          existing.banner = res.data.blob
        } else if (newUserBanner === null) {
          existing.banner = undefined
        }
        return existing
      })
      await whenAppViewReady(
        profile.did,
        checkCommitted ||
          (res => {
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
            if (typeof updates === 'function') {
              return true
            }
            return (
              res.data.displayName === updates.displayName &&
              res.data.description === updates.description
            )
          }),
      )
    },
    onSuccess(data, variables) {
      // invalidate cache
      queryClient.invalidateQueries({
        queryKey: RQKEY(variables.profile.did),
      })
    },
  })
}

export function useProfileFollowMutationQueue(
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>,
) {
  const did = profile.did
  const initialFollowingUri = profile.viewer?.following
  const followMutation = useProfileFollowMutation()
  const unfollowMutation = useProfileUnfollowMutation()

  const queueToggle = useToggleMutationQueue({
    initialState: initialFollowingUri,
    runMutation: async (prevFollowingUri, shouldFollow) => {
      if (shouldFollow) {
        const {uri} = await followMutation.mutateAsync({
          did,
          skipOptimistic: true,
        })
        return uri
      } else {
        if (prevFollowingUri) {
          await unfollowMutation.mutateAsync({
            did,
            followUri: prevFollowingUri,
            skipOptimistic: true,
          })
        }
        return undefined
      }
    },
    onSuccess(finalFollowingUri) {
      // finalize
      updateProfileShadow(did, {
        followingUri: finalFollowingUri,
      })
    },
  })

  const queueFollow = useCallback(() => {
    // optimistically update
    updateProfileShadow(did, {
      followingUri: 'pending',
    })
    return queueToggle(true)
  }, [did, queueToggle])

  const queueUnfollow = useCallback(() => {
    // optimistically update
    updateProfileShadow(did, {
      followingUri: undefined,
    })
    return queueToggle(false)
  }, [did, queueToggle])

  return [queueFollow, queueUnfollow]
}

function useProfileFollowMutation() {
  return useMutation<
    {uri: string; cid: string},
    Error,
    {did: string; skipOptimistic?: boolean}
  >({
    mutationFn: async ({did}) => {
      return await getAgent().follow(did)
    },
    onMutate(variables) {
      if (!variables.skipOptimistic) {
        // optimistically update
        updateProfileShadow(variables.did, {
          followingUri: 'pending',
        })
      }
    },
    onSuccess(data, variables) {
      if (!variables.skipOptimistic) {
        // finalize
        updateProfileShadow(variables.did, {
          followingUri: data.uri,
        })
        track('Profile:Follow', {username: variables.did})
      }
    },
    onError(error, variables) {
      if (!variables.skipOptimistic) {
        // revert the optimistic update
        updateProfileShadow(variables.did, {
          followingUri: undefined,
        })
      }
    },
  })
}

function useProfileUnfollowMutation() {
  return useMutation<
    void,
    Error,
    {did: string; followUri: string; skipOptimistic?: boolean}
  >({
    mutationFn: async ({followUri}) => {
      track('Profile:Unfollow', {username: followUri})
      return await getAgent().deleteFollow(followUri)
    },
    onMutate(variables) {
      if (!variables.skipOptimistic) {
        // optimistically update
        updateProfileShadow(variables.did, {
          followingUri: undefined,
        })
      }
    },
    onError(error, variables) {
      if (!variables.skipOptimistic) {
        // revert the optimistic update
        updateProfileShadow(variables.did, {
          followingUri: variables.followUri,
        })
      }
    },
  })
}

export function useProfileMuteMutationQueue(
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>,
) {
  const did = profile.did
  const initialMuted = profile.viewer?.muted
  const muteMutation = useProfileMuteMutation()
  const unmuteMutation = useProfileUnmuteMutation()

  const queueToggle = useToggleMutationQueue({
    initialState: initialMuted,
    runMutation: async (_prevMuted, shouldMute) => {
      if (shouldMute) {
        await muteMutation.mutateAsync({
          did,
          skipOptimistic: true,
        })
        return true
      } else {
        await unmuteMutation.mutateAsync({
          did,
          skipOptimistic: true,
        })
        return false
      }
    },
    onSuccess(finalMuted) {
      // finalize
      updateProfileShadow(did, {muted: finalMuted})
    },
  })

  const queueMute = useCallback(() => {
    // optimistically update
    updateProfileShadow(did, {
      muted: true,
    })
    return queueToggle(true)
  }, [did, queueToggle])

  const queueUnmute = useCallback(() => {
    // optimistically update
    updateProfileShadow(did, {
      muted: false,
    })
    return queueToggle(false)
  }, [did, queueToggle])

  return [queueMute, queueUnmute]
}

function useProfileMuteMutation() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, {did: string; skipOptimistic?: boolean}>({
    mutationFn: async ({did}) => {
      await getAgent().mute(did)
    },
    onMutate(variables) {
      if (!variables.skipOptimistic) {
        // optimistically update
        updateProfileShadow(variables.did, {
          muted: true,
        })
      }
    },
    onSuccess() {
      queryClient.invalidateQueries({queryKey: RQKEY_MY_MUTED()})
    },
    onError(error, variables) {
      if (!variables.skipOptimistic) {
        // revert the optimistic update
        updateProfileShadow(variables.did, {
          muted: false,
        })
      }
    },
  })
}

function useProfileUnmuteMutation() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, {did: string; skipOptimistic?: boolean}>({
    mutationFn: async ({did}) => {
      await getAgent().unmute(did)
    },
    onMutate(variables) {
      if (!variables.skipOptimistic) {
        // optimistically update
        updateProfileShadow(variables.did, {
          muted: false,
        })
      }
    },
    onSuccess() {
      queryClient.invalidateQueries({queryKey: RQKEY_MY_MUTED()})
    },
    onError(error, variables) {
      if (!variables.skipOptimistic) {
        // revert the optimistic update
        updateProfileShadow(variables.did, {
          muted: true,
        })
      }
    },
  })
}

export function useProfileBlockMutationQueue(
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>,
) {
  const did = profile.did
  const initialBlockingUri = profile.viewer?.blocking
  const blockMutation = useProfileBlockMutation()
  const unblockMutation = useProfileUnblockMutation()

  const queueToggle = useToggleMutationQueue({
    initialState: initialBlockingUri,
    runMutation: async (prevBlockUri, shouldFollow) => {
      if (shouldFollow) {
        const {uri} = await blockMutation.mutateAsync({
          did,
          skipOptimistic: true,
        })
        return uri
      } else {
        if (prevBlockUri) {
          await unblockMutation.mutateAsync({
            did,
            blockUri: prevBlockUri,
            skipOptimistic: true,
          })
        }
        return undefined
      }
    },
    onSuccess(finalBlockingUri) {
      // finalize
      updateProfileShadow(did, {
        blockingUri: finalBlockingUri,
      })
    },
  })

  const queueBlock = useCallback(() => {
    // optimistically update
    updateProfileShadow(did, {
      blockingUri: 'pending',
    })
    return queueToggle(true)
  }, [did, queueToggle])

  const queueUnblock = useCallback(() => {
    // optimistically update
    updateProfileShadow(did, {
      blockingUri: undefined,
    })
    return queueToggle(false)
  }, [did, queueToggle])

  return [queueBlock, queueUnblock]
}

function useProfileBlockMutation() {
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()
  return useMutation<
    {uri: string; cid: string},
    Error,
    {did: string; skipOptimistic?: boolean}
  >({
    mutationFn: async ({did}) => {
      if (!currentAccount) {
        throw new Error('Not signed in')
      }
      return await getAgent().app.bsky.graph.block.create(
        {repo: currentAccount.did},
        {subject: did, createdAt: new Date().toISOString()},
      )
    },
    onMutate(variables) {
      if (!variables.skipOptimistic) {
        // optimistically update
        updateProfileShadow(variables.did, {
          blockingUri: 'pending',
        })
      }
    },
    onSuccess(data, variables) {
      if (!variables.skipOptimistic) {
        // finalize
        updateProfileShadow(variables.did, {
          blockingUri: data.uri,
        })
      }
      queryClient.invalidateQueries({queryKey: RQKEY_MY_BLOCKED()})
    },
    onError(error, variables) {
      if (!variables.skipOptimistic) {
        // revert the optimistic update
        updateProfileShadow(variables.did, {
          blockingUri: undefined,
        })
      }
    },
  })
}

function useProfileUnblockMutation() {
  const {currentAccount} = useSession()
  return useMutation<
    void,
    Error,
    {did: string; blockUri: string; skipOptimistic?: boolean}
  >({
    mutationFn: async ({blockUri}) => {
      if (!currentAccount) {
        throw new Error('Not signed in')
      }
      const {rkey} = new AtUri(blockUri)
      await getAgent().app.bsky.graph.block.delete({
        repo: currentAccount.did,
        rkey,
      })
    },
    onMutate(variables) {
      if (!variables.skipOptimistic) {
        // optimistically update
        updateProfileShadow(variables.did, {
          blockingUri: undefined,
        })
      }
    },
    onError(error, variables) {
      if (!variables.skipOptimistic) {
        // revert the optimistic update
        updateProfileShadow(variables.did, {
          blockingUri: variables.blockUri,
        })
      }
    },
  })
}

async function whenAppViewReady(
  actor: string,
  fn: (res: AppBskyActorGetProfile.Response) => boolean,
) {
  await until(
    5, // 5 tries
    1e3, // 1s delay between tries
    fn,
    () => getAgent().app.bsky.actor.getProfile({actor}),
  )
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<AppBskyActorDefs.ProfileViewDetailed, void> {
  const queryDatas =
    queryClient.getQueriesData<AppBskyActorDefs.ProfileViewDetailed>({
      queryKey: ['profile'],
    })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData) {
      continue
    }
    if (queryData.did === did) {
      yield queryData
    }
  }
}
