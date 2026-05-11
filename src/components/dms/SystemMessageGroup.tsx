import {Pressable, View} from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated'
import {type ChatBskyActorDefs} from '@atproto/api'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {HITSLOP_10} from '#/lib/constants'
import {type SystemMessageGroupItem} from '#/screens/Messages/components/groupSystemMessages'
import {atoms as a, useTheme} from '#/alf'
import {SystemMessageItem} from '#/components/dms/SystemMessageItem'
import {ChevronBottom_Stroke2_Corner0_Rounded as ChevronDown} from '#/components/icons/Chevron'
import {Text} from '#/components/Typography'

const ANIMATION_DURATION_MS = 200

export function SystemMessageGroup({
  item,
  expanded,
  onToggle,
  relatedProfiles,
}: {
  item: SystemMessageGroupItem
  expanded: boolean
  onToggle: (key: string) => void
  relatedProfiles: Map<string, ChatBskyActorDefs.ProfileViewBasic>
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const count = item.items.length

  const label = plural(count, {
    one: '# chat update',
    other: '# chat updates',
  })

  const rotation = useDerivedValue(() =>
    withTiming(expanded ? -180 : 0, {duration: ANIMATION_DURATION_MS}),
  )
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${rotation.get()}deg`}],
  }))

  return (
    <View>
      <Pressable
        testID="systemMessageGroupToggle"
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={
          expanded ? l`Hide group chat updates` : l`Show group chat updates`
        }
        accessibilityState={{expanded}}
        hitSlop={HITSLOP_10}
        onPress={() => onToggle(item.key)}
        style={[
          a.w_full,
          a.flex_row,
          a.align_center,
          a.justify_center,
          a.px_md,
          a.mt_md,
        ]}>
        <Text
          style={[
            a.text_xs,
            a.text_center,
            t.atoms.text_contrast_medium,
            {includeFontPadding: false, textAlignVertical: 'center'},
          ]}>
          {label}
        </Text>
        <Animated.View style={[a.ml_2xs, chevronStyle]}>
          <ChevronDown size="xs" style={t.atoms.text_contrast_medium} />
        </Animated.View>
      </Pressable>
      <Animated.View layout={LinearTransition.duration(ANIMATION_DURATION_MS)}>
        {expanded
          ? item.items.map(child => (
              <Animated.View
                key={child.key}
                entering={FadeIn.duration(ANIMATION_DURATION_MS)}
                exiting={FadeOut.duration(ANIMATION_DURATION_MS)}>
                <SystemMessageItem
                  item={child}
                  relatedProfiles={relatedProfiles}
                />
              </Animated.View>
            ))
          : null}
      </Animated.View>
    </View>
  )
}
