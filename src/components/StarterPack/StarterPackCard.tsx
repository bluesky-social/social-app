import React from 'react'
import {View} from 'react-native'
import {StarterPackViewBasic} from '@atproto/api/dist/client/types/app/bsky/graph/defs'

import {atoms as a, useTheme} from '#/alf'
import {StarterPackIcon} from '#/components/icons/StarterPackIcon'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'

export function StarterPackCard({
  starterPack,
  type,
  hideTopBorder,
}: {
  starterPack: StarterPackViewBasic
  hideTopBorder?: boolean
  type: 'list' | 'notification'
}) {
  const t = useTheme()

  return (
    <Link to={{screen: 'StarterPack', params: {id: starterPack.uri}}}>
      <View
        style={[
          a.flex_row,
          a.w_full,
          a.px_xl,
          a.py_lg,
          a.gap_md,
          t.atoms.border_contrast_low,
          !hideTopBorder && type !== 'notification' && a.border_t,
          type === 'notification' && [a.mt_sm, a.py_md, a.border, a.rounded_sm],
        ]}>
        {type !== 'notification' && <StarterPackIcon width={36} height={36} />}
        <View style={a.gap_md}>
          <View>
            <Text style={[a.font_bold, a.text_md]}>React Native</Text>
            <Text style={[t.atoms.text_contrast_medium]}>
              Starter pack by @haileyok.com
            </Text>
          </View>
          <Text style={[a.font_bold, t.atoms.text_contrast_medium]}>
            380 users have joined!
          </Text>
        </View>
      </View>
    </Link>
  )
}
