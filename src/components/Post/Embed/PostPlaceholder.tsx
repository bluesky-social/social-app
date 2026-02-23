import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon} from '#/components/icons/CircleInfo'
import {Text} from '#/components/Typography'

export function PostPlaceholder({children}: {children: React.ReactNode}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.flex_row,
        a.gap_xs,
        a.rounded_md,
        a.py_md,
        a.px_md,
        a.mt_sm,
        a.align_center,
        a.border,
        t.atoms.border_contrast_low,
      ]}>
      <CircleInfoIcon size="md" style={t.atoms.text_contrast_medium} />
      <Text style={[a.text_md, t.atoms.text_contrast_medium, a.italic]}>
        {children}
      </Text>
    </View>
  )
}
