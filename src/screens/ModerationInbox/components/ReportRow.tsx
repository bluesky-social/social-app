import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'
import {isBefore, subYears} from 'date-fns'

import {atoms as a, useTheme} from '#/alf'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon} from '#/components/icons/Chevron'
import {Text} from '#/components/Typography'

export function ReportRow({
  subject,
  action,
  date,
  unread,
}: {
  subject: string
  action: string
  date: Date
  unread?: boolean
}) {
  const t = useTheme()
  const {i18n} = useLingui()

  const shouldShowYear = isBefore(date, subYears(new Date(), 1))

  return (
    <View
      style={[
        a.flex_row,
        a.w_full,
        a.align_center,
        a.justify_between,
        a.gap_sm,
        a.p_lg,
        {
          backgroundColor: unread ? t.palette.primary_25 : undefined,
        },
      ]}>
      <View style={[a.flex_1, a.gap_2xs, {minWidth: 0}]}>
        <Text
          emoji
          style={[a.text_md, unread ? a.font_semi_bold : a.font_medium]}>
          {subject}
        </Text>
        <Text style={[a.text_sm, t.atoms.text_contrast_high]}>{action}</Text>
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          {i18n.date(date, {
            month: 'short',
            day: 'numeric',
            year: shouldShowYear ? 'numeric' : undefined,
          })}
        </Text>
      </View>
      <View
        style={[
          a.flex_row,
          a.flex_shrink_0,
          a.align_center,
          a.justify_center,
          a.gap_sm,
        ]}>
        {unread ? (
          <View
            style={[
              a.rounded_full,
              {height: 8, width: 8, backgroundColor: t.palette.primary_500},
            ]}
          />
        ) : undefined}
        <ChevronRightIcon size="md" style={[t.atoms.text_contrast_medium]} />
      </View>
    </View>
  )
}
