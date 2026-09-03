import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {H1, Text} from '#/components/Typography'

export function ActionSummaryText({
  header,
  children,
}: React.PropsWithChildren<{header: string}>) {
  const t = useTheme()

  // Cleaner to call this ActionSummaryText and suppress lint in one location vs every call site.
  // oxlint-disable-next-line bsky-internal/avoid-unwrapped-text
  return (
    <View style={[a.gap_xs]}>
      <H1
        accessibilityRole="header"
        style={[a.text_xl, a.font_semi_bold, a.leading_tight]}>
        {header}
      </H1>
      <Text style={[a.text_md, t.atoms.text_contrast_high]}>{children}</Text>
    </View>
  )
}
