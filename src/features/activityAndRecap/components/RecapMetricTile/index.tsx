/**
 * RecapMetricTile (S13/S15) — small labeled metric block used by both the
 * compact `WeeklyRecapCard` (Notifications header) and the full-screen
 * `RecapScreen`. Renders a label + value + optional sublabel; static atoms
 * only, theme tokens for color. No animation, no haptic (B9, G3 spirit).
 *
 * Renders a "value" as a string so the caller decides
 * pluralization/formatting — this keeps Lingui calls at the call site.
 */

import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export function RecapMetricTile({
  label,
  value,
  sublabel,
  testID,
}: {
  label: string
  value: string
  sublabel?: string
  testID?: string
}) {
  const t = useTheme()
  return (
    <View
      testID={testID}
      style={[
        a.flex_1,
        a.p_md,
        a.rounded_md,
        a.gap_2xs,
        t.atoms.bg_contrast_25,
      ]}>
      <Text style={[a.text_xs, a.font_bold, t.atoms.text_contrast_medium]}>
        {label}
      </Text>
      <Text style={[a.text_2xl, a.font_bold, t.atoms.text]}>{value}</Text>
      {sublabel ? (
        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
          {sublabel}
        </Text>
      ) : null}
    </View>
  )
}
