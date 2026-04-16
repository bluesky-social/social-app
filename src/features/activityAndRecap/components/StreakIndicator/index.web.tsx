/**
 * StreakIndicator (web).
 *
 * Same atoms as the native variant; uses a button-shaped Pressable for the
 * desktop/tablet header row. Visibility gates and accessibility label
 * are identical to the native variant — see ./index.tsx for the contract.
 */

import React from 'react'
import {Pressable, View} from 'react-native'
import {msg, plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme, web} from '#/alf'
import {Flame_Stroke2_Corner1_Rounded as FlameIcon} from '#/components/icons/Flame'
import {Text} from '#/components/Typography'
import {
  StreakExplainerDialog,
  useStreakExplainerControl,
} from '#/features/activityAndRecap/components/StreakExplainerDialog'
import {STREAK_INDICATOR_MIN} from '#/features/activityAndRecap/constants'
import {useShowStreakPreference} from '#/features/activityAndRecap/hooks/useShowStreakPreference'
import {useStreaksAndRecapEnabled} from '#/features/activityAndRecap/hooks/useStreaksAndRecapEnabled'
import {useStreakStore} from '#/features/activityAndRecap/hooks/useStreakStore'

export function StreakIndicator(): React.ReactElement | null {
  const featureOn = useStreaksAndRecapEnabled()
  if (!featureOn) return null
  return <StreakIndicatorInner />
}

function StreakIndicatorInner(): React.ReactElement | null {
  const t = useTheme()
  const {_} = useLingui()
  const [showStreak] = useShowStreakPreference()
  const store = useStreakStore()
  const control = useStreakExplainerControl()

  if (!showStreak) return null
  if (!store) return null
  const streak = store.currentStreak
  if (streak < STREAK_INDICATOR_MIN) return null

  const label = _(
    msg`${plural(streak, {one: '# day', other: '# days'})} Bluesky streak`,
  )

  return (
    <View>
      <Pressable
        testID="streakIndicator"
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={_(msg`Opens the streak explainer`)}
        onPress={() => control.open()}
        style={[
          a.flex_row,
          a.align_center,
          a.gap_xs,
          a.px_sm,
          a.py_2xs,
          a.rounded_full,
          web({cursor: 'pointer'}),
        ]}>
        <FlameIcon width={18} fill={t.atoms.text.color} />
        <Text style={[a.text_md, a.font_bold, t.atoms.text]}>{streak}</Text>
      </Pressable>
      <StreakExplainerDialog control={control} />
    </View>
  )
}
