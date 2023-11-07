import React from 'react'
import {StyleProp, TextStyle, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {AppBskyActorDefs} from '@atproto/api'
import {Button, ButtonType} from '../util/forms/Button'
import * as Toast from '../util/Toast'
import {FollowState} from 'state/models/cache/my-follows'
import {useFollowProfile} from 'lib/hooks/useFollowProfile'
import {s} from '#/lib/styles'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {usePalette} from '#/lib/hooks/usePalette'

type Props = {
  unfollowedType?: ButtonType
  followedType?: ButtonType
  profile: AppBskyActorDefs.ProfileViewBasic
  onToggleFollow?: (v: boolean) => void
  labelStyle?: StyleProp<TextStyle>
} & React.ComponentProps<typeof Button>

export const FollowButton = observer(function FollowButtonImpl({
  unfollowedType = 'inverted',
  followedType = 'default',
  profile,
  onToggleFollow,
  labelStyle,
  ...rest
}: Props) {
  const pal = usePalette('default')
  const palInverted = usePalette('inverted')

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
      StartIcon={
        following ? (
          <FontAwesomeIcon icon="check" style={[pal.text, s.mr2]} size={14} />
        ) : (
          <FontAwesomeIcon icon="plus" style={[palInverted.text, s.mr2]} />
        )
      }
      type={following ? followedType : unfollowedType}
      labelStyle={labelStyle}
      onPress={onPress}
      label={following ? 'Unfollow' : 'Follow'}
      withLoading={true}
      {...rest}
    />
  )
})
