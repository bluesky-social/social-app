import React from 'react'
import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {StarterPackIcon} from '#/components/icons/StarterPackIcon'
import {Text} from '#/components/Typography'

export function StarterPackCard({hideTopBorder}: {hideTopBorder?: boolean}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.flex_row,
        !hideTopBorder && a.border_t,
        a.p_lg,
        a.gap_md,
        t.atoms.border_contrast_low,
      ]}>
      <StarterPackIcon width={36} height={36} />
      <View style={a.gap_md}>
        <View>
          <Text style={[a.font_bold, a.text_md]}>Science</Text>
          <Text style={[t.atoms.text_contrast_medium]}>
            Starter pack by @bossett.social
          </Text>
        </View>
        <Text style={[a.font_bold, t.atoms.text_contrast_medium]}>
          380 users have joined!
        </Text>
      </View>
    </View>
  )
}
