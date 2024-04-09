import React from 'react'
import {StyleProp, TextStyle, View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {Shadow} from '#/state/cache/types'
import {useProfileFollowMutationQueue} from '#/state/queries/profile'
import {useGate} from 'lib/statsig/statsig'
import {isNative} from 'platform/detection'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Toast from '../util/Toast'

export function FollowButton({
  profile,
  logContext,
}: {
  profile: Shadow<AppBskyActorDefs.ProfileViewBasic>
  labelStyle?: StyleProp<TextStyle>
  logContext: 'ProfileCard' | 'PostThreadItem'
}) {
  const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(
    profile,
    logContext,
  )
  const {_} = useLingui()
  const showFollowBackLabel =
    useGate('show_follow_back_label') && logContext === 'PostThreadItem'

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

  return (
    <View style={a.pl_lg}>
      <Button
        testID={profile.viewer?.following ? 'unfollowBtn' : 'followBtn'}
        size={isNative ? 'small' : 'medium'}
        color={profile.viewer?.following ? 'secondary' : 'primary'}
        variant="solid"
        label={
          profile.viewer?.following
            ? _(msg`Unfollow ${profile.handle}`)
            : _(msg`Follow ${profile.handle}`)
        }
        onPress={profile.viewer?.following ? onPressUnfollow : onPressFollow}
        style={[a.rounded_full, a.gap_xs]}>
        <ButtonText>
          {!profile.viewer?.following ? (
            showFollowBackLabel && profile.viewer?.followedBy ? (
              <Trans>Follow Back</Trans>
            ) : (
              <Trans>Follow</Trans>
            )
          ) : (
            <Trans>Following</Trans>
          )}
        </ButtonText>
      </Button>
    </View>
  )
}
