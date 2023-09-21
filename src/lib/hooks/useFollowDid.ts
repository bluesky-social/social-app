import React from 'react'

import {useStores} from 'state/index'
import {FollowState} from 'state/models/cache/my-follows'

export function useFollowDid({did}: {did: string}) {
  const store = useStores()
  const state = store.me.follows.getFollowState(did)

  return {
    state,
    following: state === FollowState.Following,
    toggle: React.useCallback(async () => {
      if (state === FollowState.Following) {
        try {
          await store.agent.deleteFollow(store.me.follows.getFollowUri(did))
          store.me.follows.removeFollow(did)
          return {
            state: FollowState.NotFollowing,
            following: false,
          }
        } catch (e: any) {
          store.log.error('Failed to delete follow', e)
          throw e
        }
      } else if (state === FollowState.NotFollowing) {
        try {
          const res = await store.agent.follow(did)
          store.me.follows.addFollow(did, res.uri)
          return {
            state: FollowState.Following,
            following: true,
          }
        } catch (e: any) {
          store.log.error('Failed to create follow', e)
          throw e
        }
      }

      return {
        state: FollowState.Unknown,
        following: false,
      }
    }, [store, did, state]),
  }
}
