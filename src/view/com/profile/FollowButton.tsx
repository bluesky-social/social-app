import {StyleProp, TextStyle, View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {Shadow} from '#/state/cache/types'
import {useProfileFollowMutationQueue} from '#/state/queries/profile'
import {Button, ButtonType} from '../util/forms/Button'
import * as Toast from '../util/Toast'

export function FollowButton({
  unfollowedType = 'inverted',
  followedType = 'default',
  profile,
  labelStyle,
  logContext,
}: {
  unfollowedType?: ButtonType
  followedType?: ButtonType
  profile: Shadow<AppBskyActorDefs.ProfileViewBasic>
  labelStyle?: StyleProp<TextStyle>
  logContext: 'ProfileCard' | 'StarterPackProfilesList'
}) {
  const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(
    profile,
    logContext,
  )
  const {_} = useLingui()

  const onPressFollow = async () => {
    try {
      await queueFollow()
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        Toast.show(_(msg`An issue occurred, please try again.`), 'xmark')
      }
    }
  }

  const onPressUnfollow = async () => {
    try {
      await queueUnfollow()
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        Toast.show(_(msg`An issue occurred, please try again.`), 'xmark')
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
  } else if (!profile.viewer.followedBy) {
    return (
      <Button
        type={unfollowedType}
        labelStyle={labelStyle}
        onPress={onPressFollow}
        label={_(msg({message: 'Follow', context: 'action'}))}
      />
    )
  } else {
    return (
      <Button
        type={unfollowedType}
        labelStyle={labelStyle}
        onPress={onPressFollow}
        label={_(msg({message: 'Follow Back', context: 'action'}))}
      />
    )
  }
}
