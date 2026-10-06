import {View} from 'react-native'
import {Image} from 'expo-image'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {type AtmosphereArticleCardData} from '../exploreData'

export function ExploreCard({
  article,
  width,
}: {
  article: AtmosphereArticleCardData
  width?: number
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const label =
    article.image.alt !== article.title
      ? l`Open ${article.title}: ${article.image.alt}`
      : l`Open ${article.title}`

  return (
    <View
      style={[
        width ? {width} : a.w_full,
        a.rounded_md,
        a.border,
        t.atoms.border_contrast_low,
        t.atoms.bg,
        t.atoms.shadow_xs,
      ]}>
      <View style={[a.flex_1, a.rounded_md, a.overflow_hidden]}>
        <Link
          to={article.href}
          label={label}
          style={[a.flex_col, a.flex_1, a.w_full]}>
          <View style={[a.w_full, {height: 96}]}>
            <Image
              source={article.image.src}
              contentFit="cover"
              style={[a.absolute, a.inset_0, a.w_full, a.h_full]}
              accessibilityLabel={article.image.alt}
              accessibilityHint={l`Opens this article`}
            />
          </View>
          <View style={[a.flex_1, a.gap_xs, a.p_md, {paddingTop: 10}]}>
            <View
              style={[
                a.flex_row,
                a.align_center,
                a.gap_xs,
                {alignSelf: 'flex-start'},
              ]}>
              {article.publisherAvatar ? (
                <Image
                  source={article.publisherAvatar}
                  contentFit="cover"
                  style={[a.rounded_xs, {width: 16, height: 16}]}
                  accessible={false}
                />
              ) : undefined}
              <Text emoji style={[a.text_xs, a.font_medium]} numberOfLines={1}>
                {article.publisher}
              </Text>
            </View>
            <Text emoji style={[a.text_sm, a.font_semi_bold]} numberOfLines={2}>
              {article.title}
            </Text>
            {article.description ? (
              <Text
                emoji
                style={[
                  a.text_xs,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                ]}
                numberOfLines={2}>
                {article.description}
              </Text>
            ) : undefined}
          </View>
        </Link>
      </View>
    </View>
  )
}
