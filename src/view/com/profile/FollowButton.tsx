import React from 'react'
import {StyleProp, TextStyle, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {Button, ButtonType} from '../util/forms/Button'
import * as Toast from '../util/Toast'
import {FollowState} from 'state/models/cache/my-follows'
import {useFollowDid} from 'lib/hooks/useFollowDid'

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
  const {state, following, toggle} = useFollowDid({did})

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
