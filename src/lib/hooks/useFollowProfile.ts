import React from 'react'
import {AppBskyActorDefs} from '@atproto/api'
import {useStores} from 'state/index'
import {FollowState} from 'state/models/cache/my-follows'

export function useFollowProfile(profile: AppBskyActorDefs.ProfileViewBasic) {
  const store = useStores()
  const state = store.me.follows.getFollowState(profile.did)

  return {
    state,
    following: state === FollowState.Following,
    toggle: React.useCallback(async () => {
      if (state === FollowState.Following) {
        try {
          await store.agent.deleteFollow(
            store.me.follows.getFollowUri(profile.did),
          )
          store.me.follows.removeFollow(profile.did)
          return {
            state: FollowState.NotFollowing,
            following: false,
          }
        } catch (e: any) {
          store.log.error('Failed to delete follow', {error: e})
          throw e
        }
      } else if (state === FollowState.NotFollowing) {
        try {
          const res = await store.agent.follow(profile.did)
          store.me.follows.addFollow(profile.did, {
            followRecordUri: res.uri,
            did: profile.did,
            handle: profile.handle,
            displayName: profile.displayName,
            avatar: profile.avatar,
          })
          return {
            state: FollowState.Following,
            following: true,
          }
        } catch (e: any) {
          store.log.error('Failed to create follow', {error: e})
          throw e
        }
      }

      return {
        state: FollowState.Unknown,
        following: false,
      }
    }, [store, profile, state]),
  }
}
