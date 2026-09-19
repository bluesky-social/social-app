import {View} from 'react-native'
import {Trans} from '@lingui/react/macro'

import {atoms as a} from '#/alf'
import {Heart2_Filled_Stroke2_Corner0_Rounded as HeartIcon} from '#/components/icons/Heart2'
import {Text} from '#/components/Typography'
import {useSupportPalette} from '../palette'

/**
 * A small green "Supporter" chip, shaped like a post label, marking someone who
 * supports the creator. Meant to sit under the author's name and above the post
 * content, only inside a Support post's thread (see `useIsThreadSupporter`).
 */
export function SupporterLabel() {
  const palette = useSupportPalette()
  return (
    <View
      style={[
        a.self_start,
        a.flex_row,
        a.align_center,
        a.gap_2xs,
        a.rounded_sm,
        {
          backgroundColor: palette.bg,
          paddingHorizontal: 6,
          paddingVertical: 2,
        },
      ]}>
      <HeartIcon width={11} fill={palette.fg} />
      <Text
        style={[a.text_xs, a.font_bold, a.leading_tight, {color: palette.fg}]}>
        <Trans context="Chip marking a creator's financial supporter">
          Supporter
        </Trans>
      </Text>
    </View>
  )
}
