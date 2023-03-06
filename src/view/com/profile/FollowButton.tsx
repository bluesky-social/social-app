import React from 'react'
import {observer} from 'mobx-react-lite'
import {Button} from '../util/forms/Button'
import {useStores} from 'state/index'
import * as apilib from 'lib/api/index'
import * as Toast from '../util/Toast'

const FollowButton = observer(
  ({did, declarationCid}: {did: string; declarationCid: string}) => {
    const store = useStores()
    const isFollowing = store.me.follows.isFollowing(did)

    const onToggleFollow = async () => {
      if (store.me.follows.isFollowing(did)) {
        try {
          await apilib.unfollow(store, store.me.follows.getFollowUri(did))
          store.me.follows.removeFollow(did)
        } catch (e: any) {
          store.log.error('Failed fo delete follow', e)
          Toast.show('An issue occurred, please try again.')
        }
      } else {
        try {
          const res = await apilib.follow(store, did, declarationCid)
          store.me.follows.addFollow(did, res.uri)
        } catch (e: any) {
          store.log.error('Failed fo create follow', e)
          Toast.show('An issue occurred, please try again.')
        }
      }
    }

    return (
      <Button
        type={isFollowing ? 'default' : 'primary'}
        onPress={onToggleFollow}
        label={isFollowing ? 'Unfollow' : 'Follow'}
      />
    )
  },
)

export default FollowButton
