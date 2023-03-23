import React from 'react'
import {observer} from 'mobx-react-lite'
import {Button, ButtonType} from '../util/forms/Button'
import {useStores} from 'state/index'
import * as Toast from '../util/Toast'

const FollowButton = observer(
  ({
    type = 'inverted',
    did,
    onToggleFollow,
  }: {
    type?: ButtonType
    did: string
    onToggleFollow?: (v: boolean) => void
  }) => {
    const store = useStores()
    const isFollowing = store.me.follows.isFollowing(did)

    const onToggleFollowInner = async () => {
      if (store.me.follows.isFollowing(did)) {
        try {
          await store.agent.deleteFollow(store.me.follows.getFollowUri(did))
          store.me.follows.removeFollow(did)
          onToggleFollow?.(false)
        } catch (e: any) {
          store.log.error('Failed fo delete follow', e)
          Toast.show('An issue occurred, please try again.')
        }
      } else {
        try {
          const res = await store.agent.follow(did)
          store.me.follows.addFollow(did, res.uri)
          onToggleFollow?.(true)
        } catch (e: any) {
          store.log.error('Failed fo create follow', e)
          Toast.show('An issue occurred, please try again.')
        }
      }
    }

    return (
      <Button
        type={isFollowing ? 'default' : type}
        onPress={onToggleFollowInner}
        label={isFollowing ? 'Unfollow' : 'Follow'}
      />
    )
  },
)

export default FollowButton
