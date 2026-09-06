import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export function TimelineItem({
  title,
  date,
  last,
}: {
  title: string
  date?: string
  last?: boolean
}) {
  const t = useTheme()

  return (
    <View style={[a.flex_row, {gap: 10}]}>
      <View style={[a.align_center]}>
        {last ? (
          <View
            style={[
              a.mt_xs,
              a.rounded_full,
              {
                width: 8,
                height: 8,
                borderColor: t.palette.primary_500,
                borderWidth: 2,
              },
            ]}
          />
        ) : (
          <View
            style={[
              a.mt_xs,
              a.rounded_full,
              {
                width: 8,
                height: 8,
                backgroundColor: t.palette.contrast_300,
              },
            ]}
          />
        )}
        {last ? undefined : (
          <View
            style={[
              a.mt_xs,
              a.flex_1,
              a.rounded_full,
              {
                width: 2,
                backgroundColor: t.palette.contrast_100,
                minHeight: 12,
              },
            ]}
          />
        )}
      </View>
      <View style={[a.flex_1]}>
        <Text style={[a.text_sm, a.font_medium]}>{title}</Text>
        {date ? (
          <Text
            style={[!last && a.mb_md, a.text_sm, t.atoms.text_contrast_medium]}>
            {date}
          </Text>
        ) : undefined}
      </View>
    </View>
  )
}
