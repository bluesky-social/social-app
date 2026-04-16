/**
 * StreakIndicator (native) — flame + integer in the Home header right slot.
 *
 * Visibility is gated (in this exact order) on:
 *   1. useStreaksAndRecapEnabled() (A7, X6)
 *   2. hasSession (A7)
 *   3. showStreak preference (X1)
 *   4. currentStreak >= STREAK_INDICATOR_MIN (A4, G4)
 *
 * Pressing opens the StreakExplainerDialog (S10). No animation, no haptic,
 * no sound (G3). Layout-only. Mounted from HomeHeaderLayoutMobile (S18).
 */

import React from 'react'
import {Pressable} from 'react-native'
import {msg, plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Flame_Stroke2_Corner1_Rounded as FlameIcon} from '#/components/icons/Flame'
import {Text} from '#/components/Typography'
import {useStreakExplainerControl} from '#/features/activityAndRecap/components/StreakExplainerDialog'
import {STREAK_INDICATOR_MIN} from '#/features/activityAndRecap/constants'
import {useShowStreakPreference} from '#/features/activityAndRecap/hooks/useShowStreakPreference'
import {useStreaksAndRecapEnabled} from '#/features/activityAndRecap/hooks/useStreaksAndRecapEnabled'
import {useStreakStore} from '#/features/activityAndRecap/hooks/useStreakStore'

export function StreakIndicator(): React.ReactElement | null {
  const featureOn = useStreaksAndRecapEnabled()
  // Hard early-return BEFORE any storage / preference reads (X6).
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
        a.px_xs,
        a.py_2xs,
        a.rounded_full,
      ]}>
      <FlameIcon width={18} fill={t.atoms.text.color} />
      <Text style={[a.text_md, a.font_bold, t.atoms.text]}>{streak}</Text>
    </Pressable>
  )
}
