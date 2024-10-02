import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {useHaptics} from '#/lib/haptics'
import {useHapticsDisabled} from '#/state/preferences'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Text} from '#/components/Typography'

export function PostThreadComposePrompt({
  onPressCompose,
}: {
  onPressCompose: () => void
}) {
  const {currentAccount} = useSession()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const t = useTheme()
  const playHaptics = useHaptics()
  const isHapticsDisabled = useHapticsDisabled()
  const {
    state: hovered,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()

  const onPress = () => {
    playHaptics('Light')
    setTimeout(
      () => {
        onPressCompose()
      },
      isHapticsDisabled ? 0 : 75,
    )
  }

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={_(msg`Compose reply`)}
      accessibilityHint={_(msg`Opens composer`)}
      style={[
        gtMobile ? a.py_xs : {paddingTop: 8, paddingBottom: 11},
        a.px_sm,
        a.border_t,
        t.atoms.border_contrast_low,
        t.atoms.bg,
      ]}
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}>
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.p_sm,
          a.gap_sm,
          a.rounded_full,
          (!gtMobile || hovered) && t.atoms.bg_contrast_25,
          a.transition_color,
        ]}>
        <UserAvatar
          size={gtMobile ? 24 : 22}
          avatar={profile?.avatar}
          type={profile?.associated?.labeler ? 'labeler' : 'user'}
        />
        <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
          <Trans>Write your reply</Trans>
        </Text>
      </View>
    </PressableScale>
  )
}
