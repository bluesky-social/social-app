import {useCallback} from 'react'
import {Image as RNImage} from 'react-native-image-crop-picker'
import {
  AppBskyActorDefs,
  AppBskyActorGetProfile,
  AppBskyActorProfile,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs,
  AtUri,
} from '@atproto/api'
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {track} from '#/lib/analytics/analytics'
import {uploadBlob} from '#/lib/api'
import {until} from '#/lib/async/until'
import {useToggleMutationQueue} from '#/lib/hooks/useToggleMutationQueue'
import {logEvent, LogEvents} from '#/lib/statsig/statsig'
import {Shadow} from '#/state/cache/types'
import {STALE} from '#/state/queries'
import {resetProfilePostsQueries} from '#/state/queries/post-feed'
import {updateProfileShadow} from '../cache/profile-shadow'
import {getAgent, useSession} from '../session'
import {RQKEY as RQKEY_MY_BLOCKED} from './my-blocked-accounts'
import {RQKEY as RQKEY_MY_MUTED} from './my-muted-accounts'
import {ThreadNode} from './post-thread'

export const RQKEY = (did: string) => ['profile', did]
export const profilesQueryKey = (handles: string[]) => ['profiles', handles]
export const profileBasicQueryKey = (didOrHandle: string) => [
  'profileBasic',
  didOrHandle,
]

export function useProfileQuery({
  did,
  staleTime = STALE.SECONDS.FIFTEEN,
}: {
  did: string | undefined
  staleTime?: number
}) {
  const queryClient = useQueryClient()
  return useQuery<AppBskyActorDefs.ProfileViewDetailed>({
    // WARNING
    // this staleTime is load-bearing
    // if you remove it, the UI infinite-loops
    // -prf
    staleTime,
    refetchOnWindowFocus: true,
    queryKey: RQKEY(did ?? ''),
    queryFn: async () => {
      const res = await getAgent().getProfile({actor: did ?? ''})
      return res.data
    },
    placeholderData: () => {
      if (!did) return

      return queryClient.getQueryData<AppBskyActorDefs.ProfileViewBasic>(
        profileBasicQueryKey(did),
      )
    },
    enabled: !!did,
  })
}

export function useProfilesQuery({handles}: {handles: string[]}) {
  return useQuery({
    staleTime: STALE.MINUTES.FIVE,
    queryKey: profilesQueryKey(handles),
    queryFn: async () => {
      const res = await getAgent().getProfiles({actors: handles})
      return res.data
    },
  })
}

export function usePrefetchProfileQuery() {
  const queryClient = useQueryClient()
  const prefetchProfileQuery = useCallback(
    (did: string) => {
      queryClient.prefetchQuery({
        queryKey: RQKEY(did),
        queryFn: async () => {
          const res = await getAgent().getProfile({actor: did || ''})
          return res.data
        },
      })
    },
    [queryClient],
  )
  return prefetchProfileQuery
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
  logContext: LogEvents['profile:follow']['logContext'] &
    LogEvents['profile:unfollow']['logContext'],
) {
  const did = profile.did
  const initialFollowingUri = profile.viewer?.following
  const followMutation = useProfileFollowMutation(logContext)
  const unfollowMutation = useProfileUnfollowMutation(logContext)

  const queueToggle = useToggleMutationQueue({
    initialState: initialFollowingUri,
    runMutation: async (prevFollowingUri, shouldFollow) => {
      if (shouldFollow) {
        const {uri} = await followMutation.mutateAsync({
          did,
        })
        return uri
      } else {
        if (prevFollowingUri) {
          await unfollowMutation.mutateAsync({
            did,
            followUri: prevFollowingUri,
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

function useProfileFollowMutation(
  logContext: LogEvents['profile:follow']['logContext'],
) {
  return useMutation<{uri: string; cid: string}, Error, {did: string}>({
    mutationFn: async ({did}) => {
      logEvent('profile:follow', {logContext})
      return await getAgent().follow(did)
    },
    onSuccess(data, variables) {
      track('Profile:Follow', {username: variables.did})
    },
  })
}

function useProfileUnfollowMutation(
  logContext: LogEvents['profile:unfollow']['logContext'],
) {
  return useMutation<void, Error, {did: string; followUri: string}>({
    mutationFn: async ({followUri}) => {
      logEvent('profile:unfollow', {logContext})
      track('Profile:Unfollow', {username: followUri})
      return await getAgent().deleteFollow(followUri)
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
        })
        return true
      } else {
        await unmuteMutation.mutateAsync({
          did,
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
  return useMutation<void, Error, {did: string}>({
    mutationFn: async ({did}) => {
      await getAgent().mute(did)
    },
    onSuccess() {
      queryClient.invalidateQueries({queryKey: RQKEY_MY_MUTED()})
    },
  })
}

function useProfileUnmuteMutation() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, {did: string}>({
    mutationFn: async ({did}) => {
      await getAgent().unmute(did)
    },
    onSuccess() {
      queryClient.invalidateQueries({queryKey: RQKEY_MY_MUTED()})
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
        })
        return uri
      } else {
        if (prevBlockUri) {
          await unblockMutation.mutateAsync({
            did,
            blockUri: prevBlockUri,
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
  return useMutation<{uri: string; cid: string}, Error, {did: string}>({
    mutationFn: async ({did}) => {
      if (!currentAccount) {
        throw new Error('Not signed in')
      }
      return await getAgent().app.bsky.graph.block.create(
        {repo: currentAccount.did},
        {subject: did, createdAt: new Date().toISOString()},
      )
    },
    onSuccess(_, {did}) {
      queryClient.invalidateQueries({queryKey: RQKEY_MY_BLOCKED()})
      resetProfilePostsQueries(did, 1000)
    },
  })
}

function useProfileUnblockMutation() {
  const {currentAccount} = useSession()
  return useMutation<void, Error, {did: string; blockUri: string}>({
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
    onSuccess(_, {did}) {
      resetProfilePostsQueries(did, 1000)
    },
  })
}

export function precacheProfile(
  queryClient: QueryClient,
  profile: AppBskyActorDefs.ProfileViewBasic,
) {
  queryClient.setQueryData(profileBasicQueryKey(profile.handle), profile)
  queryClient.setQueryData(profileBasicQueryKey(profile.did), profile)
}

export function precacheFeedPostProfiles(
  queryClient: QueryClient,
  posts: AppBskyFeedDefs.FeedViewPost[],
) {
  for (const post of posts) {
    // Save the author of the post every time
    precacheProfile(queryClient, post.post.author)
    precachePostEmbedProfile(queryClient, post.post.embed)

    // Cache parent author and embeds
    const parent = post.reply?.parent
    if (AppBskyFeedDefs.isPostView(parent)) {
      precacheProfile(queryClient, parent.author)
      precachePostEmbedProfile(queryClient, parent.embed)
    }
  }
}

function precachePostEmbedProfile(
  queryClient: QueryClient,
  embed: AppBskyFeedDefs.PostView['embed'],
) {
  if (AppBskyEmbedRecord.isView(embed)) {
    if (AppBskyEmbedRecord.isViewRecord(embed.record)) {
      precacheProfile(queryClient, embed.record.author)
    }
  } else if (AppBskyEmbedRecordWithMedia.isView(embed)) {
    if (AppBskyEmbedRecord.isViewRecord(embed.record.record)) {
      precacheProfile(queryClient, embed.record.record.author)
    }
  }
}

export function precacheThreadPostProfiles(
  queryClient: QueryClient,
  node: ThreadNode,
) {
  if (node.type === 'post') {
    precacheProfile(queryClient, node.post.author)
    if (node.parent) {
      precacheThreadPostProfiles(queryClient, node.parent)
    }
    if (node.replies?.length) {
      for (const reply of node.replies) {
        precacheThreadPostProfiles(queryClient, reply)
      }
    }
  }
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
