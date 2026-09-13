import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {type ActivityPresentationProps} from '#/screens/Atmosphere/presentation'
import {type ActivityTimelineListItem} from '#/screens/Atmosphere/timeline'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {ActivityPresentationRow} from './ActivityPresentationRow'

/** Owns all inter-row spacing, including headings and compact-run separators. */
export function TimelineRow({
  item,
  computedItemView,
  layout,
}: ActivityPresentationProps & {
  layout: NonNullable<ActivityTimelineListItem['layout']>
}) {
  const t = useTheme()
  const {t: l, i18n} = useLingui()
  const heading = layout.heading
  const label = !heading
    ? undefined
    : heading.kind === 'today'
      ? l`Earlier today`
      : heading.kind === 'yesterday'
        ? l`Yesterday`
        : i18n.date(heading.date, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })

  return (
    <View
      testID="atmosphereTimelineRow"
      style={[a.relative, a.mt_sm, {paddingTop: layout.gap}]}>
      {layout.separator ? (
        <View
          testID="atmosphereTimelineSeparator"
          style={[
            a.absolute,
            a.border_t,
            t.atoms.border_contrast_low,
            {top: layout.gap / 3, start: 48, end: 20},
          ]}
        />
      ) : null}
      {label ? (
        <View
          style={[
            a.flex_row,
            a.align_center,
            a.justify_start,
            a.px_xl,
            a.pb_lg,
            a.gap_sm,
          ]}>
          <Text
            testID="atmosphereDateHeading"
            accessibilityRole="header"
            style={[a.text_sm, a.font_semi_bold, t.atoms.text_contrast_medium]}>
            {label}
          </Text>

          <View style={[a.flex_1, a.border_t, t.atoms.border_contrast_low]} />
        </View>
      ) : null}
      <ActivityPresentationRow
        item={item}
        computedItemView={computedItemView}
        hideTopBorder
      />
    </View>
  )
}
