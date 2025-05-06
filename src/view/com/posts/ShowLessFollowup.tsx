import {View} from 'react-native'
import {Trans} from '@lingui/macro'

import {atoms as a, useTheme} from '#/alf'
import {CircleCheck_Stroke2_Corner0_Rounded} from '#/components/icons/CircleCheck'
import {Text} from '#/components/Typography'

export function ShowLessFollowup() {
  const t = useTheme()
  return (
    <View
      style={[
        t.atoms.border_contrast_low,
        a.border_t,
        t.atoms.bg_contrast_25,
        a.p_sm,
      ]}>
      <View
        style={[
          t.atoms.bg,
          t.atoms.border_contrast_low,
          a.border,
          a.rounded_sm,
          a.p_md,
          a.flex_row,
          a.gap_sm,
        ]}>
        <CircleCheck_Stroke2_Corner0_Rounded
          style={[t.atoms.text_contrast_low]}
          size="sm"
        />
        <Text
          style={[
            a.flex_1,
            a.text_sm,
            t.atoms.text_contrast_medium,
            a.leading_snug,
          ]}>
          <Trans>
            Thank you for your feedback! It has been sent to the feed operator.
          </Trans>
        </Text>
      </View>
    </View>
  )
}
