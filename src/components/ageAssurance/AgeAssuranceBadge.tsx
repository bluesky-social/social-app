import {View} from 'react-native'
import {Trans} from '@lingui/macro'

import {atoms as a, select, useTheme} from '#/alf'
import {ShieldCheck_Stroke2_Corner0_Rounded as Shield} from '#/components/icons/Shield'
import {Text} from '#/components/Typography'

export function AgeAssuranceBadge() {
  const t = useTheme()

  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.gap_xs,
        a.px_sm,
        a.py_xs,
        a.pr_sm,
        a.rounded_full,
        {
          backgroundColor: select(t.name, {
            light: t.palette.primary_100,
            dark: t.palette.primary_100,
            dim: t.palette.primary_100,
          }),
        },
      ]}>
      <Shield size="sm" />
      <Text
        style={[
          a.font_semi_bold,
          a.leading_snug,
          {
            color: select(t.name, {
              light: t.palette.primary_800,
              dark: t.palette.primary_800,
              dim: t.palette.primary_800,
            }),
          },
        ]}>
        <Trans>Age Assurance</Trans>
      </Text>
    </View>
  )
}
