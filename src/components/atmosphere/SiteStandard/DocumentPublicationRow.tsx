import {type StyleProp, View, type ViewStyle} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {PublicationIcon} from '#/components/atmosphere/SiteStandard/PublicationIcon'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'

export function DocumentPublicationRow({
  view,
  style,
}: {
  view: app.bsky.embed.external.ViewArticlePublication
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()

  return (
    <View style={[a.flex_row, a.align_center, a.gap_sm, style]}>
      <PublicationIcon view={view} size={18} />
      <Text
        emoji
        numberOfLines={1}
        style={[
          a.flex_1,
          a.text_xs,
          a.font_medium,
          a.leading_tight,
          t.atoms.text,
        ]}>
        {view.title}
      </Text>
    </View>
  )
}
