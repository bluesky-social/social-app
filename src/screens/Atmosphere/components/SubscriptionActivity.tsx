import {View} from 'react-native'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {ACTIVITY_ROW_PADDING_START} from '#/screens/Atmosphere/constants'
import {getPublicationExternalView} from '#/screens/Atmosphere/externalViews'
import {
  getActivityContent,
  getActivityCount,
  getFirstActivity,
} from '#/screens/Atmosphere/relationships'
import {type ActivityRendererProps} from '#/screens/Atmosphere/renderers'
import {getActivityRowKind} from '#/screens/Atmosphere/rowLayout'
import {isActorGroup} from '#/screens/Atmosphere/types'
import {atoms as a, useTheme} from '#/alf'
import {Bookmark_Filled_Corner0_Rounded as SubscribeIcon} from '#/components/icons/Bookmark'
import {StandardSiteEmbed} from '#/components/Post/Embed/StandardSiteEmbed'
import {matchStandardSitePublisherByViewHints} from '#/components/Post/Embed/StandardSiteEmbed/publishers'
import {Text} from '#/components/Typography'
import {ActivityCounts} from './ActivityCounts'
import {
  ActivityActorLine,
  ActivityFootnote,
  ActivityRowContent,
} from './ActivityPrimitives'

export function SubscriptionActivityRenderer({
  item,
  computedItemView,
  testID,
  actions,
}: ActivityRendererProps) {
  const t = useTheme()
  const {t: l} = useLingui()
  const first = getFirstActivity(item)
  const content = getActivityContent(item)
  if (!first || !content || computedItemView.actors.length === 0) return null
  const actorGroup = item.type === 'group' && isActorGroup(item.group)
  const view = getPublicationExternalView(content)
  const title = view?.title.trim() || l`Publication unavailable`
  const timestamp =
    item.type === 'activity' ? first.record.indexedAt : item.group.indexedAt
  const remainingCount = actorGroup ? getActivityCount(item) - 1 : 0
  const suffix =
    remainingCount > 0
      ? l`and ${plural(remainingCount, {one: '# more publication', other: '# more publications'})}`
      : undefined
  const isCard = getActivityRowKind({item, computedItemView}) === 'card'
  const publisher = view
    ? matchStandardSitePublisherByViewHints(view)
    : undefined

  return (
    <View
      testID={testID}
      style={[a.pr_lg, {paddingLeft: ACTIVITY_ROW_PADDING_START}]}>
      {isCard && view ? (
        <ActivityRowContent
          actors={computedItemView.actors}
          icon={SubscribeIcon}
          iconColor={t.palette.positive_500}
          actions={actions}
          header={
            <ActivityActorLine
              actors={computedItemView.actors}
              action={l`subscribed to a new blog site`}
              timestamp={timestamp}
              showAvatars={false}
            />
          }>
          <View testID="atmosphereSubscriptionCard" style={a.gap_md}>
            <StandardSiteEmbed view={view}>
              <ActivityCounts view={content.view} style={a.pt_sm} />
            </StandardSiteEmbed>
            {suffix ? (
              <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
                {suffix}
              </Text>
            ) : null}
          </View>
        </ActivityRowContent>
      ) : (
        <ActivityFootnote
          title={title}
          to={view?.uri}
          icon={SubscribeIcon}
          iconColor={t.palette.positive_500}
          actors={computedItemView.actors}
          action={l`subscribed to`}
          timestamp={timestamp}
          app={
            publisher ? {name: publisher.name, to: publisher.url} : undefined
          }
          suffix={suffix}
          thumb={view?.source?.icon}
          actions={actions}>
          <ActivityCounts view={content.view} />
        </ActivityFootnote>
      )}
    </View>
  )
}
