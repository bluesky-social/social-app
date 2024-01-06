import React from 'react'
import {StyleProp, TextStyle, View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {Button, ButtonType} from '../util/forms/Button'
import * as Toast from '../util/Toast'
import {useProfileFollowMutationQueue} from '#/state/queries/profile'
import {Shadow} from '#/state/cache/types'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'

export function FollowButton({
  unfollowedType = 'inverted',
  followedType = 'default',
  profile,
  labelStyle,
}: {
  unfollowedType?: ButtonType
  followedType?: ButtonType
  profile: Shadow<AppBskyActorDefs.ProfileViewBasic>
  labelStyle?: StyleProp<TextStyle>
}) {
  const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(profile)
  const {_} = useLingui()

  const onPressFollow = async () => {
    try {
      await queueFollow()
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        Toast.show(_(msg`An issue occurred, please try again.`))
      }
    }
  }

  const onPressUnfollow = async () => {
    try {
      await queueUnfollow()
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        Toast.show(_(msg`An issue occurred, please try again.`))
      }
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
        label={_(msg({message: 'Unfollow', context: 'action'}))}
      />
    )
  } else {
    return (
      <Button
        type={unfollowedType}
        labelStyle={labelStyle}
        onPress={onPressFollow}
        label={_(msg({message: 'Follow', context: 'action'}))}
      />
    )
  }
}
