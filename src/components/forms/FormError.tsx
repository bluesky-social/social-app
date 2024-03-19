import React from 'react'
import {View} from 'react-native'

import {Warning_Stroke2_Corner0_Rounded as Warning} from '#/components/icons/Warning'
import {Text} from '#/components/Typography'
import {atoms as a, useTheme} from '#/alf'

export function FormError({error}: {error?: string}) {
  const t = useTheme()

  if (!error) return null

  return (
    <View
      style={[
        {backgroundColor: t.palette.negative_600},
        a.flex_row,
        a.align_center,
        a.mb_lg,
        a.rounded_sm,
        a.p_sm,
      ]}>
      <Warning fill={t.palette.white} size="sm" />
      <View style={(a.flex_1, a.ml_sm)}>
        <Text style={[{color: t.palette.white}, a.font_bold]}>{error}</Text>
      </View>
    </View>
  )
}
