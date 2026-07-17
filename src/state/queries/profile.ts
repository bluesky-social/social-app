import {useCallback} from 'react'
import {type Un$Typed} from '@atproto/lex'
import {
  type AtIdentifierString,
  type Client,
  type DidString,
} from '@atproto/lex-client'
import {type DatetimeString} from '@atproto/lex-schema'
import {AtUri, type AtUriString} from '@atproto/syntax'
import {
  deleteFollow,
  follow,
  muteActor,
  unmuteActor,
  upsertProfile,
} from '@bsky.app/sdk'
import {
  type InfiniteData,
  keepPreviousData,
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {uploadBlob} from '#/lib/api'
import {until} from '#/lib/async/until'
import {useToggleMutationQueue} from '#/lib/hooks/useToggleMutationQueue'
import {updateProfileShadow} from '#/state/cache/profile-shadow'
import {type Shadow} from '#/state/cache/types'
import {type ImageMeta} from '#/state/gallery'
import {STALE} from '#/state/queries'
import {resetProfilePostsQueries} from '#/state/queries/post-feed'
import {RQKEY as PROFILE_FOLLOWS_RQKEY} from '#/state/queries/profile-follows'
import {
  unstableCacheProfileView,
  useUnstableProfileViewCache,
} from '#/state/queries/unstable-profile-cache'
import {useUpdateProfileVerificationCache} from '#/state/queries/verification/useUpdateProfileVerificationCache'
import {useAppviewClient, usePdsClient, useSession} from '#/state/session'
import * as userActionHistory from '#/state/userActionHistory'
import {useAnalytics} from '#/analytics'
import {type Metrics, toClout} from '#/analytics/metrics'
import {app} from '#/lexicons'
import type * as bsky from '#/types/bsky'
import {
  ProgressGuideAction,
  useProgressGuideControls,
} from '../shell/progress-guide'
import {RQKEY_ROOT as RQKEY_LIST_CONVOS} from './messages/list-conversations'
import {RQKEY as RQKEY_MY_BLOCKED} from './my-blocked-accounts'
import {RQKEY as RQKEY_MY_MUTED} from './my-muted-accounts'

export * from '#/state/queries/unstable-profile-cache'
/**
 * @deprecated use {@link unstableCacheProfileView} instead
 */
export const precacheProfile = unstableCacheProfileView

const RQKEY_ROOT = 'profile'
export const RQKEY = (did: string) => [RQKEY_ROOT, did]

export const profilesQueryKeyRoot = 'profiles'
export const profilesQueryKey = (handles: string[]) => [
  profilesQueryKeyRoot,
  handles,
]

export function useProfileQuery({
  did,
  staleTime = STALE.SECONDS.FIFTEEN,
}: {
  did: string | undefined
  staleTime?: number
}) {
  const client = useAppviewClient()
  const {getUnstableProfile} = useUnstableProfileViewCache()
  return useQuery<app.bsky.actor.defs.ProfileViewDetailed>({
    // WARNING
    // this staleTime is load-bearing
    // if you remove it, the UI infinite-loops
    // -prf
    staleTime,
    refetchOnWindowFocus: true,
    queryKey: RQKEY(did ?? ''),
    queryFn: async () => {
      return await client.call(app.bsky.actor.getProfile, {
        actor: (did ?? '') as AtIdentifierString,
      })
    },
    placeholderData: () => {
      if (!did) return
      return getUnstableProfile(did) as app.bsky.actor.defs.ProfileViewDetailed
    },
    enabled: !!did,
  })
}

export function useProfilesQuery({
  handles,
  maintainData,
}: {
  handles: string[]
  maintainData?: boolean
}) {
  const client = useAppviewClient()
  return useQuery({
    enabled: handles.length > 0,
    staleTime: STALE.MINUTES.FIVE,
    queryKey: profilesQueryKey(handles),
    queryFn: async () => {
      return await client.call(app.bsky.actor.getProfiles, {
        actors: handles as AtIdentifierString[],
      })
    },
    placeholderData: maintainData ? keepPreviousData : undefined,
  })
}

export function usePrefetchProfileQuery() {
  const client = useAppviewClient()
  const queryClient = useQueryClient()
  const prefetchProfileQuery = useCallback(
    async (did: string) => {
      await queryClient.prefetchQuery({
        staleTime: STALE.SECONDS.THIRTY,
        queryKey: RQKEY(did),
        queryFn: async () => {
          return await client.call(app.bsky.actor.getProfile, {
            actor: (did || '') as AtIdentifierString,
          })
        },
      })
    },
    [queryClient, client],
  )
  return prefetchProfileQuery
}

interface ProfileUpdateParams {
  profile: app.bsky.actor.defs.ProfileViewDetailed
  updates:
    | Un$Typed<app.bsky.actor.profile.Main>
    | ((
        existing: Un$Typed<app.bsky.actor.profile.Main>,
      ) => Un$Typed<app.bsky.actor.profile.Main>)
  newUserAvatar?: ImageMeta | undefined | null
  newUserBanner?: ImageMeta | undefined | null
  checkCommitted?: (res: app.bsky.actor.getProfile.$OutputBody) => boolean
}
export function useProfileUpdateMutation() {
  const queryClient = useQueryClient()
  const pdsClient = usePdsClient()
  const appviewClient = useAppviewClient()
  const updateProfileVerificationCache = useUpdateProfileVerificationCache()
  return useMutation<void, Error, ProfileUpdateParams>({
    mutationFn: async ({
      profile,
      updates,
      newUserAvatar,
      newUserBanner,
      checkCommitted,
    }) => {
      let newUserAvatarPromise: ReturnType<typeof uploadBlob> | undefined
      if (newUserAvatar) {
        newUserAvatarPromise = uploadBlob(
          pdsClient,
          newUserAvatar.path,
          newUserAvatar.mime,
        )
      }
      let newUserBannerPromise: ReturnType<typeof uploadBlob> | undefined
      if (newUserBanner) {
        newUserBannerPromise = uploadBlob(
          pdsClient,
          newUserBanner.path,
          newUserBanner.mime,
        )
      }
      await pdsClient.call(upsertProfile, async existing => {
        let next: Un$Typed<app.bsky.actor.profile.Main> = existing || {}
        if (typeof updates === 'function') {
          next = updates(next)
        } else {
          next.displayName = updates.displayName || undefined
          next.description = updates.description || undefined
          if ('pinnedPost' in updates) {
            next.pinnedPost = updates.pinnedPost
          }
        }
        if (newUserAvatarPromise) {
          const res = await newUserAvatarPromise
          next.avatar = res.blob
        } else if (newUserAvatar === null) {
          next.avatar = undefined
        }
        if (newUserBannerPromise) {
          const res = await newUserBannerPromise
          next.banner = res.blob
        } else if (newUserBanner === null) {
          next.banner = undefined
        }
        return next
      })
      await whenAppViewReady(
        appviewClient,
        profile.did,
        checkCommitted ||
          (res => {
            if (typeof newUserAvatar !== 'undefined') {
              if (newUserAvatar === null && res.avatar) {
                // url hasn't cleared yet
                return false
              } else if (res.avatar === profile.avatar) {
                // url hasn't changed yet
                return false
              }
            }
            if (typeof newUserBanner !== 'undefined') {
              if (newUserBanner === null && res.banner) {
                // url hasn't cleared yet
                return false
              } else if (res.banner === profile.banner) {
                // url hasn't changed yet
                return false
              }
            }
            if (typeof updates === 'function') {
              return true
            }
            return (
              res.displayName === updates.displayName &&
              res.description === updates.description
            )
          }),
      )
    },
    async onSuccess(_, variables) {
      // invalidate cache
      void queryClient.invalidateQueries({
        queryKey: RQKEY(variables.profile.did),
      })
      void queryClient.invalidateQueries({
        queryKey: [profilesQueryKeyRoot, [variables.profile.did]],
      })
      await updateProfileVerificationCache({profile: variables.profile})
    },
  })
}

export function useProfileFollowMutationQueue(
  profile: Shadow<bsky.profile.AnyProfileView>,
  logContext: Metrics['profile:follow']['logContext'],
  position?: number,
  contextProfileDid?: string,
) {
  const client = useAppviewClient()
  const queryClient = useQueryClient()
  const {currentAccount} = useSession()
  const did = profile.did
  const initialFollowingUri = profile.viewer?.following
  const followMutation = useProfileFollowMutation(
    logContext,
    profile,
    position,
    contextProfileDid,
  )
  const unfollowMutation = useProfileUnfollowMutation(logContext)

  const queueToggle = useToggleMutationQueue({
    initialState: initialFollowingUri,
    runMutation: async (prevFollowingUri, shouldFollow) => {
      if (shouldFollow) {
        const {uri} = await followMutation.mutateAsync({
          did,
        })
        userActionHistory.follow([did])
        return uri as AtUriString
      } else {
        if (prevFollowingUri) {
          await unfollowMutation.mutateAsync({
            did,
            followUri: prevFollowingUri,
          })
          userActionHistory.unfollow([did])
        }
        return undefined
      }
    },
    onSuccess(finalFollowingUri) {
      // finalize
      updateProfileShadow(queryClient, did, {
        followingUri: finalFollowingUri,
      })

      // Optimistically update profile follows cache for avatar displays
      if (currentAccount?.did) {
        type FollowsQueryData =
          InfiniteData<app.bsky.graph.getFollows.$OutputBody>
        queryClient.setQueryData<FollowsQueryData>(
          PROFILE_FOLLOWS_RQKEY(currentAccount.did),
          old => {
            if (!old?.pages?.[0]) return old
            if (finalFollowingUri) {
              // Add the followed profile to the beginning
              const alreadyExists = old.pages[0].follows.some(
                f => f.did === profile.did,
              )
              if (alreadyExists) return old
              return {
                ...old,
                pages: [
                  {
                    ...old.pages[0],
                    follows: [
                      profile as app.bsky.actor.defs.ProfileView,
                      ...old.pages[0].follows,
                    ],
                  },
                  ...old.pages.slice(1),
                ],
              }
            } else {
              // Remove the unfollowed profile
              return {
                ...old,
                pages: old.pages.map(page => ({
                  ...page,
                  follows: page.follows.filter(f => f.did !== profile.did),
                })),
              }
            }
          },
        )
      }

      if (finalFollowingUri) {
        void client
          .call(app.bsky.graph.getSuggestedFollowsByActor, {
            actor: did,
          })
          .then(res => {
            const dids = res.suggestions
              .filter(a => !a.viewer?.following)
              .map(a => a.did)
              .slice(0, 8)
            userActionHistory.followSuggestion(dids)
          })
      }
    },
  })

  const queueFollow = useCallback(() => {
    // optimistically update
    updateProfileShadow(queryClient, did, {
      followingUri: 'pending',
    })
    return queueToggle(true)
  }, [queryClient, did, queueToggle])

  const queueUnfollow = useCallback(() => {
    // optimistically update
    updateProfileShadow(queryClient, did, {
      followingUri: undefined,
    })
    return queueToggle(false)
  }, [queryClient, did, queueToggle])

  return [queueFollow, queueUnfollow] as const
}

function useProfileFollowMutation(
  logContext: Metrics['profile:follow']['logContext'],
  profile: Shadow<bsky.profile.AnyProfileView>,
  position?: number,
  contextProfileDid?: string,
) {
  const ax = useAnalytics()
  const {currentAccount} = useSession()
  const pdsClient = usePdsClient()
  const queryClient = useQueryClient()
  const {captureAction} = useProgressGuideControls()

  return useMutation<{uri: string; cid: string}, Error, {did: string}>({
    mutationFn: async ({did}) => {
      let ownProfile: app.bsky.actor.defs.ProfileViewDetailed | undefined
      if (currentAccount) {
        ownProfile = findProfileQueryData(queryClient, currentAccount.did)
      }
      captureAction(ProgressGuideAction.Follow)
      ax.metric('profile:follow', {
        logContext,
        didBecomeMutual: profile.viewer
          ? Boolean(profile.viewer.followedBy)
          : undefined,
        followeeClout:
          'followersCount' in profile
            ? toClout(profile.followersCount)
            : undefined,
        followeeDid: did,
        followerClout: toClout(ownProfile?.followersCount),
        position,
        contextProfileDid,
      })
      return await pdsClient.call(follow, {did: did as DidString})
    },
  })
}

function useProfileUnfollowMutation(
  logContext: Metrics['profile:unfollow']['logContext'],
) {
  const ax = useAnalytics()
  const pdsClient = usePdsClient()
  return useMutation<void, Error, {did: string; followUri: string}>({
    mutationFn: async ({followUri}) => {
      ax.metric('profile:unfollow', {logContext})
      return await pdsClient.call(deleteFollow, followUri as AtUriString)
    },
  })
}

export function useProfileMuteMutationQueue(
  profile: Shadow<bsky.profile.AnyProfileView>,
) {
  const ax = useAnalytics()
  const queryClient = useQueryClient()
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
        ax.metric('profile:mute', {})
        return true
      } else {
        await unmuteMutation.mutateAsync({
          did,
        })
        ax.metric('profile:unmute', {})
        return false
      }
    },
    onSuccess(finalMuted) {
      // finalize
      updateProfileShadow(queryClient, did, {muted: finalMuted})
    },
  })

  const queueMute = useCallback(() => {
    // optimistically update
    updateProfileShadow(queryClient, did, {
      muted: true,
    })
    return queueToggle(true)
  }, [queryClient, did, queueToggle])

  const queueUnmute = useCallback(() => {
    // optimistically update
    updateProfileShadow(queryClient, did, {
      muted: false,
    })
    return queueToggle(false)
  }, [queryClient, did, queueToggle])

  return [queueMute, queueUnmute] as const
}

function useProfileMuteMutation() {
  const queryClient = useQueryClient()
  const appviewClient = useAppviewClient()
  return useMutation<void, Error, {did: string}>({
    mutationFn: async ({did}) => {
      await appviewClient.call(muteActor, {actor: did as AtIdentifierString})
    },
    onSuccess() {
      void queryClient.invalidateQueries({queryKey: RQKEY_MY_MUTED()})
    },
  })
}

function useProfileUnmuteMutation() {
  const queryClient = useQueryClient()
  const appviewClient = useAppviewClient()
  return useMutation<void, Error, {did: string}>({
    mutationFn: async ({did}) => {
      await appviewClient.call(unmuteActor, {actor: did as AtIdentifierString})
    },
    onSuccess() {
      void queryClient.invalidateQueries({queryKey: RQKEY_MY_MUTED()})
    },
  })
}

export function useProfileBlockMutationQueue(
  profile: Shadow<bsky.profile.AnyProfileView>,
) {
  const ax = useAnalytics()
  const queryClient = useQueryClient()
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
        ax.metric('profile:block', {})
        return uri as AtUriString
      } else {
        if (prevBlockUri) {
          await unblockMutation.mutateAsync({
            did,
            blockUri: prevBlockUri,
          })
          ax.metric('profile:unblock', {})
        }
        return undefined
      }
    },
    onSuccess(finalBlockingUri) {
      // finalize
      updateProfileShadow(queryClient, did, {
        blockingUri: finalBlockingUri,
      })
      // The shadow only reaches components that read profiles through shadow
      // hooks. The convo list is also read raw (e.g. the unread badge's
      // calculateCount, getMessageInfo), and blocks emit no chat log event,
      // so without a refetch that data stays stale indefinitely.
      void queryClient.invalidateQueries({queryKey: [RQKEY_LIST_CONVOS]})
    },
  })

  const queueBlock = useCallback(() => {
    // optimistically update
    updateProfileShadow(queryClient, did, {
      blockingUri: 'pending',
    })
    return queueToggle(true)
  }, [queryClient, did, queueToggle])

  const queueUnblock = useCallback(() => {
    // optimistically update
    updateProfileShadow(queryClient, did, {
      blockingUri: undefined,
    })
    return queueToggle(false)
  }, [queryClient, did, queueToggle])

  return [queueBlock, queueUnblock] as const
}

function useProfileBlockMutation() {
  const {currentAccount} = useSession()
  const pdsClient = usePdsClient()
  const queryClient = useQueryClient()
  return useMutation<{uri: string; cid: string}, Error, {did: string}>({
    mutationFn: async ({did}) => {
      if (!currentAccount) {
        throw new Error('Not signed in')
      }
      return await pdsClient.create(app.bsky.graph.block, {
        subject: did as DidString,
        createdAt: new Date().toISOString() as DatetimeString,
      })
    },
    onSuccess(_, {did}) {
      void queryClient.invalidateQueries({queryKey: RQKEY_MY_BLOCKED()})
      resetProfilePostsQueries(queryClient, did, 1000)
    },
  })
}

function useProfileUnblockMutation() {
  const {currentAccount} = useSession()
  const pdsClient = usePdsClient()
  const queryClient = useQueryClient()
  return useMutation<void, Error, {did: string; blockUri: string}>({
    mutationFn: async ({blockUri}) => {
      if (!currentAccount) {
        throw new Error('Not signed in')
      }
      const {rkey} = new AtUri(blockUri)
      await pdsClient.delete(app.bsky.graph.block, {rkey})
    },
    onSuccess(_, {did}) {
      resetProfilePostsQueries(queryClient, did, 1000)
    },
  })
}

async function whenAppViewReady(
  client: Client,
  actor: string,
  fn: (res: app.bsky.actor.getProfile.$OutputBody) => boolean,
) {
  await until(
    5, // 5 tries
    1e3, // 1s delay between tries
    fn,
    () =>
      client.call(app.bsky.actor.getProfile, {
        actor: actor as AtIdentifierString,
      }),
  )
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<app.bsky.actor.defs.ProfileViewDetailed, void> {
  const profileQueryDatas =
    queryClient.getQueriesData<app.bsky.actor.defs.ProfileViewDetailed>({
      queryKey: [RQKEY_ROOT],
    })
  for (const [_queryKey, queryData] of profileQueryDatas) {
    if (!queryData) {
      continue
    }
    if (queryData.did === did) {
      yield queryData
    }
  }
  const profilesQueryDatas =
    queryClient.getQueriesData<app.bsky.actor.getProfiles.$OutputBody>({
      queryKey: [profilesQueryKeyRoot],
    })
  for (const [_queryKey, queryData] of profilesQueryDatas) {
    if (!queryData) {
      continue
    }
    for (let profile of queryData.profiles) {
      if (profile.did === did) {
        yield profile
      }
    }
  }
}

export function findProfileQueryData(
  queryClient: QueryClient,
  did: string,
): app.bsky.actor.defs.ProfileViewDetailed | undefined {
  return queryClient.getQueryData<app.bsky.actor.defs.ProfileViewDetailed>(
    RQKEY(did),
  )
}
