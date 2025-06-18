import {type StyleProp, View, type ViewStyle} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {useHaptics} from '#/lib/haptics'
import {useHideBottomBarBorderForScreen} from '#/lib/hooks/useHideBottomBarBorder'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, ios, native, useBreakpoints, useTheme} from '#/alf'
import {transparentifyColor} from '#/alf/util/colorGeneration'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Text} from '#/components/Typography'

export function PostThreadComposePrompt({
  onPressCompose,
  style,
}: {
  onPressCompose: () => void
  style?: StyleProp<ViewStyle>
}) {
  const {currentAccount} = useSession()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const t = useTheme()
  const playHaptic = useHaptics()
  const {
    state: hovered,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()

  useHideBottomBarBorderForScreen()

  return (
    <View
      style={[
        a.px_sm,
        gtMobile
          ? [a.py_xs, a.border_t, t.atoms.border_contrast_low, t.atoms.bg]
          : [a.pb_2xs],
        style,
      ]}>
      {!gtMobile && (
        <LinearGradient
          key={t.name} // android does not update when you change the colors. sigh.
          start={[0.5, 0]}
          end={[0.5, 1]}
          colors={[
            transparentifyColor(t.atoms.bg.backgroundColor, 0),
            t.atoms.bg.backgroundColor,
          ]}
          locations={[0.15, 0.4]}
          style={[a.absolute, a.inset_0]}
        />
      )}
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={_(msg`Compose reply`)}
        accessibilityHint={_(msg`Opens composer`)}
        onPress={() => {
          onPressCompose()
          playHaptic('Light')
        }}
        onLongPress={ios(() => {
          onPressCompose()
          playHaptic('Heavy')
        })}
        onHoverIn={onHoverIn}
        onHoverOut={onHoverOut}
        style={[
          a.flex_row,
          a.align_center,
          a.p_sm,
          a.gap_sm,
          a.rounded_full,
          (!gtMobile || hovered) && t.atoms.bg_contrast_25,
          native([a.border, t.atoms.border_contrast_low]),
          a.transition_color,
        ]}>
        <UserAvatar
          size={24}
          avatar={profile?.avatar}
          type={profile?.associated?.labeler ? 'labeler' : 'user'}
        />
        <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
          <Trans>Write your reply</Trans>
        </Text>
      </PressableScale>
    </View>
  )
}
