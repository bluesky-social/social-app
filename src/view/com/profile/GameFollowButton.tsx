import {type StyleProp, type TextStyle} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useProfileFollowMutationQueue} from '#/state/queries/profile'
import {Button, ButtonText} from '#/components/Button'
import * as Toast from '../util/Toast'

export function GameFollowButton({
  profile,
  logContext = 'ProfileCard',
  style,
  size = 'small',
}: {
  profile: any
  logContext?: 'ProfileCard' | 'StarterPackProfilesList'
  labelStyle?: StyleProp<TextStyle>
  style?: any
  size?: 'tiny' | 'small' | 'large'
}) {
  const shadowProfile = useProfileShadow(profile)
  const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(
    shadowProfile,
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

  if (!shadowProfile?.viewer) {
    return null
  }

  if (shadowProfile.viewer.following) {
    return (
      <Button
        variant="solid"
        color="secondary"
        style={style}
        size={size}
        label={_(msg`Unfollow`)}
        onPress={onPressUnfollow}>
        <ButtonText>{_(msg`Unfollow`)}</ButtonText>
      </Button>
    )
  } else {
    return (
      <Button
        variant="solid"
        color="primary"
        style={style}
        size={size}
        label={_(msg`Follow`)}
        onPress={onPressFollow}>
        <ButtonText>{_(msg`Follow`)}</ButtonText>
      </Button>
    )
  }
}
