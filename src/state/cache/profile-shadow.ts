import {useEffect, useMemo, useState} from 'react'
import {AppBskyActorDefs} from '@atproto/api'
import {QueryClient} from '@tanstack/react-query'
import EventEmitter from 'eventemitter3'

import {batchedUpdates} from '#/lib/batchedUpdates'
import {findAllProfilesInQueryData as findAllProfilesInActorSearchQueryData} from '../queries/actor-search'
import {findAllProfilesInQueryData as findAllProfilesInKnownFollowersQueryData} from '../queries/known-followers'
import {findAllProfilesInQueryData as findAllProfilesInListMembersQueryData} from '../queries/list-members'
import {findAllProfilesInQueryData as findAllProfilesInListConvosQueryData} from '../queries/messages/list-conversations'
import {findAllProfilesInQueryData as findAllProfilesInMyBlockedAccountsQueryData} from '../queries/my-blocked-accounts'
import {findAllProfilesInQueryData as findAllProfilesInMyMutedAccountsQueryData} from '../queries/my-muted-accounts'
import {findAllProfilesInQueryData as findAllProfilesInFeedsQueryData} from '../queries/post-feed'
import {findAllProfilesInQueryData as findAllProfilesInPostLikedByQueryData} from '../queries/post-liked-by'
import {findAllProfilesInQueryData as findAllProfilesInPostQuotesQueryData} from '../queries/post-quotes'
import {findAllProfilesInQueryData as findAllProfilesInPostRepostedByQueryData} from '../queries/post-reposted-by'
import {findAllProfilesInQueryData as findAllProfilesInPostThreadQueryData} from '../queries/post-thread'
import {findAllProfilesInQueryData as findAllProfilesInProfileQueryData} from '../queries/profile'
import {findAllProfilesInQueryData as findAllProfilesInProfileFollowersQueryData} from '../queries/profile-followers'
import {findAllProfilesInQueryData as findAllProfilesInProfileFollowsQueryData} from '../queries/profile-follows'
import {findAllProfilesInQueryData as findAllProfilesInSuggestedFollowsQueryData} from '../queries/suggested-follows'
import {castAsShadow, Shadow} from './types'
export type {Shadow} from './types'

export interface ProfileShadow {
  followingUri: string | undefined
  muted: boolean | undefined
  blockingUri: string | undefined
}

const shadows: WeakMap<
  AppBskyActorDefs.ProfileView,
  Partial<ProfileShadow>
> = new WeakMap()
const emitter = new EventEmitter()

export function useProfileShadow<
  TProfileView extends AppBskyActorDefs.ProfileView,
>(profile: TProfileView): Shadow<TProfileView> {
  const [shadow, setShadow] = useState(() => shadows.get(profile))
  const [prevPost, setPrevPost] = useState(profile)
  if (profile !== prevPost) {
    setPrevPost(profile)
    setShadow(shadows.get(profile))
  }

  useEffect(() => {
    function onUpdate() {
      setShadow(shadows.get(profile))
    }
    emitter.addListener(profile.did, onUpdate)
    return () => {
      emitter.removeListener(profile.did, onUpdate)
    }
  }, [profile])

  return useMemo(() => {
    if (shadow) {
      return mergeShadow(profile, shadow)
    } else {
      return castAsShadow(profile)
    }
  }, [profile, shadow])
}

export function updateProfileShadow(
  queryClient: QueryClient,
  did: string,
  value: Partial<ProfileShadow>,
) {
  const cachedProfiles = findProfilesInCache(queryClient, did)
  for (let post of cachedProfiles) {
    shadows.set(post, {...shadows.get(post), ...value})
  }
  batchedUpdates(() => {
    emitter.emit(did, value)
  })
}

function mergeShadow<TProfileView extends AppBskyActorDefs.ProfileView>(
  profile: TProfileView,
  shadow: Partial<ProfileShadow>,
): Shadow<TProfileView> {
  return castAsShadow({
    ...profile,
    viewer: {
      ...(profile.viewer || {}),
      following:
        'followingUri' in shadow
          ? shadow.followingUri
          : profile.viewer?.following,
      muted: 'muted' in shadow ? shadow.muted : profile.viewer?.muted,
      blocking:
        'blockingUri' in shadow ? shadow.blockingUri : profile.viewer?.blocking,
    },
  })
}

function* findProfilesInCache(
  queryClient: QueryClient,
  did: string,
): Generator<AppBskyActorDefs.ProfileView, void> {
  yield* findAllProfilesInListMembersQueryData(queryClient, did)
  yield* findAllProfilesInMyBlockedAccountsQueryData(queryClient, did)
  yield* findAllProfilesInMyMutedAccountsQueryData(queryClient, did)
  yield* findAllProfilesInPostLikedByQueryData(queryClient, did)
  yield* findAllProfilesInPostRepostedByQueryData(queryClient, did)
  yield* findAllProfilesInPostQuotesQueryData(queryClient, did)
  yield* findAllProfilesInProfileQueryData(queryClient, did)
  yield* findAllProfilesInProfileFollowersQueryData(queryClient, did)
  yield* findAllProfilesInProfileFollowsQueryData(queryClient, did)
  yield* findAllProfilesInSuggestedFollowsQueryData(queryClient, did)
  yield* findAllProfilesInActorSearchQueryData(queryClient, did)
  yield* findAllProfilesInListConvosQueryData(queryClient, did)
  yield* findAllProfilesInFeedsQueryData(queryClient, did)
  yield* findAllProfilesInPostThreadQueryData(queryClient, did)
  yield* findAllProfilesInKnownFollowersQueryData(queryClient, did)
}
