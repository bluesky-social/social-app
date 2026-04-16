/**
 * RecapHeader (S15) — title + week range subline used by RecapScreen.
 *
 * Receives the resolved window from the parent (the parent already owns
 * the weekIso → window math via `weekWindowForIso`), so this component
 * stays pure presentational.
 */

import {View} from 'react-native'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export function RecapHeader({
  windowStart,
  windowEnd,
}: {
  windowStart: Date
  windowEnd: Date
}) {
  const t = useTheme()
  const {i18n} = useLingui()
  // Use Lingui's i18n.date helper so the locale governs the format.
  const startStr = i18n.date(windowStart, {month: 'short', day: 'numeric'})
  const endStr = i18n.date(windowEnd, {month: 'short', day: 'numeric'})

  return (
    <View style={[a.px_lg, a.py_md, a.gap_2xs]}>
      <Text style={[a.text_2xl, a.font_bold, t.atoms.text]}>
        <Trans>Your week on Bluesky</Trans>
      </Text>
      <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
        {startStr} – {endStr}
      </Text>
    </View>
  )
}
