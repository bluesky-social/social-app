import React from 'react'
import {View} from 'react-native'

import {useTheme, atoms as a, ViewStyleProp, flatten} from '#/alf'
import {Growth_Stroke2_Corner0_Rounded as Growth} from '#/components/icons/Growth'
import {Props} from '#/components/icons/common'

export function IconCircle({
  icon: Icon,
  size = 'xl',
  style,
}: ViewStyleProp & {icon: typeof Growth; size?: Props['size']}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.justify_center,
        a.align_center,
        a.rounded_full,
        {
          width: 64,
          height: 64,
          backgroundColor:
            t.name === 'light' ? t.palette.primary_50 : t.palette.primary_950,
        },
        flatten(style),
      ]}>
      <Icon size={size} fill={t.palette.primary_500} />
    </View>
  )
}
