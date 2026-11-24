import {Fragment} from 'react'
import {View} from 'react-native'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {toNiceDomain} from '#/lib/strings/url-helpers'
import {formatCount} from '#/view/com/util/numeric/format'
import {atoms as a, useTheme} from '#/alf'
import {useAtmosphereLikeCount} from '#/components/atmosphere/likes'
import {ChainLink_Stroke2_Corner0_Rounded as LinkIcon} from '#/components/icons/ChainLink'
import {Clock_Stroke2_Corner0_Rounded as ClockIcon} from '#/components/icons/Clock'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'

/**
 * A row of icon and text items below an article's description: the link
 * domain, the recommend count, and the reading time in minutes. The count and
 * reading time only show when they're non-zero.
 */
export function DocumentStats({
  view,
}: {
  view: app.bsky.embed.external.ViewArticle
}) {
  const {t: l, i18n} = useLingui()
  const t = useTheme()
  const likeCount = useAtmosphereLikeCount(view, 'recommend')
  const readingTime = view.readingTime

  const textStyle = [a.text_xs, a.leading_snug, t.atoms.text_contrast_medium]
  const items: {key: string; node: React.ReactNode}[] = [
    {
      key: 'domain',
      node: (
        <View style={[a.flex_row, a.align_center, a.gap_2xs, a.flex_shrink]}>
          <LinkIcon size="xs" style={t.atoms.text_contrast_medium} />
          <Text numberOfLines={1} style={[a.flex_shrink, textStyle]}>
            {toNiceDomain(view.uri)}
          </Text>
        </View>
      ),
    },
  ]
  if (likeCount) {
    const countText = formatCount(i18n, likeCount)
    items.push({
      key: 'recommends',
      node: (
        <View style={[a.flex_row, a.align_center, a.gap_2xs]}>
          <SparkleIcon size="xs" style={t.atoms.text_contrast_medium} />
          <Text style={textStyle}>{countText}</Text>
        </View>
      ),
    })
  }
  if (readingTime) {
    items.push({
      key: 'readingTime',
      node: (
        <View style={[a.flex_row, a.align_center, a.gap_2xs]}>
          <ClockIcon size="xs" style={t.atoms.text_contrast_medium} />
          <Text style={textStyle}>
            {l({
              message: plural(readingTime, {
                one: '#m',
                other: '#m',
              }),
              comment:
                'How long it takes to read an article, in minutes. Displayed in a short form, e.g. “5m” for 5 minutes.',
            })}
          </Text>
        </View>
      ),
    })
  }

  return (
    <View style={[a.flex_row, a.align_center, a.gap_sm, a.pt_xs]}>
      {items.map(item => (
        <Fragment key={item.key}>{item.node}</Fragment>
      ))}
    </View>
  )
}
