import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {H2} from '#/components/Typography'

export function ContentBlock({
  header,
  children,
}: React.PropsWithChildren<{header: string}>) {
  const t = useTheme()

  return (
    <View
      style={[
        a.py_md,
        a.px_lg,
        a.gap_md,
        a.rounded_md,
        a.border,
        t.atoms.bg_contrast_25,
        t.atoms.border_contrast_low,
      ]}>
      <H2 accessibilityRole="header" style={[a.text_md, a.font_semi_bold]}>
        {header}
      </H2>
      {children}
    </View>
  )
}
