import {type StyleProp, type TextStyle, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {type Shadow} from '#/state/cache/types'
import {useProfileFollowMutationQueue} from '#/state/queries/profile'
import type * as bsky from '#/types/bsky'
import {Button, type ButtonType} from '../util/forms/Button'
import * as Toast from '../util/Toast'

export function FollowButton({
  unfollowedType = 'inverted',
  followedType = 'default',
  profile,
  labelStyle,
  logContext,
  onFollow,
}: {
  unfollowedType?: ButtonType
  followedType?: ButtonType
  profile: Shadow<bsky.profile.AnyProfileView>
  labelStyle?: StyleProp<TextStyle>
  logContext: 'ProfileCard' | 'StarterPackProfilesList'
  onFollow?: () => void
}) {
  const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(
    profile,
    logContext,
  )
  const {_} = useLingui()

  const onPressFollow = async () => {
    try {
      await queueFollow()
      onFollow?.()
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
        label={_(msg({message: 'Follow back', context: 'action'}))}
      />
    )
  }
}
