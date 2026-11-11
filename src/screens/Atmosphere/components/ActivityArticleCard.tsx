import {View} from 'react-native'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {getActivityContent} from '#/screens/Atmosphere/relationships'
import {atoms as a, useTheme} from '#/alf'
import {Bookmark_Filled_Corner0_Rounded as BookmarkFilled} from '#/components/icons/Bookmark'
import {StandardSiteEmbed} from '#/components/Post/Embed/StandardSiteEmbed'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'
import {type ActivityPresentationItem} from '../presentation'
import {ActivityCounts} from './ActivityCounts'

export function ActivityArticleCard({
  item,
  view,
  remainingCount = 0,
  children,
}: {
  item: ActivityPresentationItem
  view: app.bsky.embed.external.ViewExternal
  remainingCount?: number
  children?: React.ReactNode
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const content = getActivityContent(item)

  return (
    <View testID="atmosphereArticleCard" style={a.gap_lg}>
      <StandardSiteEmbed view={view}>
        <ActivityCounts view={content?.view} style={[a.px_md, a.pb_md]} />
      </StandardSiteEmbed>
      {content?.viewerState.subscribed ? (
        <View
          style={[
            a.flex_row,
            a.self_start,
            a.align_center,
            a.gap_xs,
            a.px_sm,
            a.py_xs,
            a.rounded_sm,
            {backgroundColor: t.palette.positive_500},
          ]}>
          <BookmarkFilled size="xs" fill={t.palette.white} />
          <Text style={[a.text_sm, a.font_semi_bold, {color: t.palette.white}]}>
            {l`Subscribed`}
          </Text>
        </View>
      ) : null}
      {children}
      {remainingCount > 0 ? (
        <Text style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
          {l`and ${plural(remainingCount, {
            one: '# more article',
            other: '# more articles',
          })}`}
        </Text>
      ) : null}
    </View>
  )
}
