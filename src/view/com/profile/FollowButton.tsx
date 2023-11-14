import React from 'react'
import {StyleProp, TextStyle, View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {Button, ButtonType} from '../util/forms/Button'
import * as Toast from '../util/Toast'
import {
  useProfileFollowMutation,
  useProfileUnfollowMutation,
} from '#/state/queries/profile'

export function FollowButton({
  unfollowedType = 'inverted',
  followedType = 'default',
  profile,
  onToggleFollow,
  labelStyle,
}: {
  unfollowedType?: ButtonType
  followedType?: ButtonType
  profile: AppBskyActorDefs.ProfileViewBasic
  onToggleFollow?: (v: boolean) => void
  labelStyle?: StyleProp<TextStyle>
}) {
  const followMutation = useProfileFollowMutation()
  const unfollowMutation = useProfileUnfollowMutation()

  const onPressFollow = async () => {
    if (profile.viewer?.following) {
      return
    }
    try {
      await followMutation.mutateAsync({did: profile.did})
      onToggleFollow?.(false)
    } catch (e: any) {
      Toast.show(`An issue occurred, please try again.`)
    }
  }

  const onPressUnfollow = async () => {
    if (!profile.viewer?.following) {
      return
    }
    try {
      await unfollowMutation.mutateAsync({
        did: profile.did,
        followUri: profile.viewer?.following,
      })
      onToggleFollow?.(true)
    } catch (e: any) {
      Toast.show(`An issue occurred, please try again.`)
    }
  }

  if (!profile.viewer) {
    return <View />
  }

  if (profile.viewer.following) {
    return (
      <Button
        type={followedType}
        labelStyle={labelStyle}
        onPress={onPressUnfollow}
        label="Unfollow"
        withLoading={true}
      />
    )
  } else {
    return (
      <Button
        type={unfollowedType}
        labelStyle={labelStyle}
        onPress={onPressFollow}
        label="Follow"
        withLoading={true}
      />
    )
  }
}
