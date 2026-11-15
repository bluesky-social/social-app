import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {H1, Text} from '#/components/Typography'

export function ActionSummaryText({
  header,
  children,
  date,
}: React.PropsWithChildren<{header: string; date?: Date}>) {
  const t = useTheme()
  const {i18n} = useLingui()

  // Cleaner to call this ActionSummaryText and suppress lint in one location vs every call site.
  // oxlint-disable-next-line bsky-internal/avoid-unwrapped-text
  return (
    <View style={[a.gap_xs]}>
      <H1
        accessibilityRole="header"
        style={[a.text_xl, a.font_semi_bold, a.leading_tight]}>
        {header}
      </H1>
      {children ? (
        <Text style={[a.text_md, t.atoms.text_contrast_high]}>{children}</Text>
      ) : null}
      {date ? (
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          {i18n.date(date, {dateStyle: 'medium', timeStyle: 'short'})}
        </Text>
      ) : null}
    </View>
  )
}
