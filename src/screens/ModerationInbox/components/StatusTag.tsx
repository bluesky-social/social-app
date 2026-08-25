import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {Clock_Stroke2_Corner0_Rounded as ClockIcon} from '#/components/icons/Clock'
import {Text} from '#/components/Typography'

export function StatusTag({
  status = 'pending',
}: {
  status?: 'resolved' | 'pending'
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const Icon = status === 'resolved' ? CheckIcon : ClockIcon

  const backgroundColor =
    status === 'resolved' ? t.palette.primary_100 : t.palette.contrast_100
  const color =
    status === 'resolved' ? t.palette.primary_900 : t.palette.contrast_900

  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.gap_2xs,
        a.rounded_sm,
        a.py_2xs,
        a.px_sm,
        {backgroundColor},
      ]}>
      <Icon size="xs" style={[{color}]} />
      <Text style={[a.text_xs, a.font_medium, {color}]}>
        {status === 'resolved'
          ? l({context: 'moderation-report-status', message: 'Resolved'})
          : l({context: 'moderation-report-status', message: 'Under review'})}
      </Text>
    </View>
  )
}
