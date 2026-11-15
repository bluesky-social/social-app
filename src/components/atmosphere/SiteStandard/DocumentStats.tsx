import {View} from 'react-native'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {niceDate} from '#/lib/strings/time'
import {formatCount} from '#/view/com/util/numeric/format'
import {atoms as a, useTheme} from '#/alf'
import {ArrowPathUp_Stroke2_Corner1_Rounded as ArrowTopCircleIcon} from '#/components/icons/Arrow'
import {Clock_Stroke2_Corner0_Rounded as Clock} from '#/components/icons/Clock'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'

export function DocumentStats({
  view,
}: {
  view: app.bsky.embed.external.ViewArticle
}) {
  const {t: l, i18n} = useLingui()
  const t = useTheme()
  const likeCount = view.likeCount

  if (!(view.createdAt || likeCount || view.readingTime)) return null

  return (
    <View style={[a.flex_row, a.align_center, a.gap_md, {paddingTop: 2}]}>
      {view.createdAt && (
        <Text style={[a.text_xs, a.leading_snug, t.atoms.text_contrast_medium]}>
          {niceDate(i18n, view.createdAt, 'long', 'none')}
        </Text>
      )}
      {!!likeCount && (
        <View style={[a.flex_row, a.align_center, a.gap_2xs]}>
          <ArrowTopCircleIcon size="xs" style={t.atoms.text_contrast_medium} />
          <Text
            style={[a.text_xs, a.leading_snug, t.atoms.text_contrast_medium]}>
            {formatCount(i18n, likeCount)}
          </Text>
        </View>
      )}
      {!!view.readingTime && (
        <View style={[a.flex_row, a.align_center, a.gap_2xs]}>
          <Clock size="xs" style={t.atoms.text_contrast_medium} />
          <Text
            style={[a.text_xs, a.leading_snug, t.atoms.text_contrast_medium]}>
            {l({
              message: plural(view.readingTime, {
                one: '#m',
                other: '#m',
              }),
              comment: `How long it takes to read an article, in minutes. Displayed in a short form, e.g. "5m" for 5 minutes.`,
            })}
          </Text>
        </View>
      )}
    </View>
  )
}
