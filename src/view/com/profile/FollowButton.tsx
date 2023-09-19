import React from 'react'
import {StyleProp, TextStyle, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {Button, ButtonType} from '../util/forms/Button'
import {useStores} from 'state/index'
import * as Toast from '../util/Toast'
import {FollowState} from 'state/models/cache/my-follows'

export const FollowButton = observer(function FollowButtonImpl({
  unfollowedType = 'inverted',
  followedType = 'default',
  did,
  onToggleFollow,
  labelStyle,
}: {
  unfollowedType?: ButtonType
  followedType?: ButtonType
  did: string
  onToggleFollow?: (v: boolean) => void
  labelStyle?: StyleProp<TextStyle>
}) {
  const store = useStores()
  const followState = store.me.follows.getFollowState(did)

  if (followState === FollowState.Unknown) {
    return <View />
  }

  const onToggleFollowInner = async () => {
    const updatedFollowState = await store.me.follows.fetchFollowState(did)
    if (updatedFollowState === FollowState.Following) {
      try {
        onToggleFollow?.(false)
        await store.agent.deleteFollow(store.me.follows.getFollowUri(did))
        store.me.follows.removeFollow(did)
      } catch (e: any) {
        store.log.error('Failed to delete follow', e)
        Toast.show('An issue occurred, please try again.')
      }
    } else if (updatedFollowState === FollowState.NotFollowing) {
      try {
        onToggleFollow?.(true)
        const res = await store.agent.follow(did)
        store.me.follows.addFollow(did, res.uri)
      } catch (e: any) {
        store.log.error('Failed to create follow', e)
        Toast.show('An issue occurred, please try again.')
      }
    }
  }

  return (
    <Button
      type={
        followState === FollowState.Following ? followedType : unfollowedType
      }
      labelStyle={labelStyle}
      onPress={onToggleFollowInner}
      label={followState === FollowState.Following ? 'Unfollow' : 'Follow'}
      withLoading={true}
    />
  )
})
