import React from 'react'
import {StyleProp, TextStyle, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {AppBskyActorDefs} from '@atproto/api'
import {Button, ButtonType} from '../util/forms/Button'
import * as Toast from '../util/Toast'
import {FollowState} from 'state/models/cache/my-follows'
import {useFollowProfile} from 'lib/hooks/useFollowProfile'

export const FollowButton = observer(function FollowButtonImpl({
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
  const {state, following, toggle} = useFollowProfile(profile)

  const onPress = React.useCallback(async () => {
    try {
      const {following} = await toggle()
      onToggleFollow?.(following)
    } catch (e: any) {
      Toast.show('An issue occurred, please try again.')
    }
  }, [toggle, onToggleFollow])

  if (state === FollowState.Unknown) {
    return <View />
  }

  return (
    <Button
      type={following ? followedType : unfollowedType}
      labelStyle={labelStyle}
      onPress={onPress}
      label={following ? 'Unfollow' : 'Follow'}
      withLoading={true}
    />
  )
})
