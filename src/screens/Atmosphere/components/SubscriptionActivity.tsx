import {View} from 'react-native'
import {Image} from 'expo-image'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeHandle} from '#/lib/strings/handles'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {createPublicationExternalView} from '#/screens/Atmosphere/externalViews'
import {getRecordActor} from '#/screens/Atmosphere/presentation'
import {getFirstActivity} from '#/screens/Atmosphere/relationships'
import {type ActivityRendererProps} from '#/screens/Atmosphere/renderers'
import {getSubscriptionActivityUri} from '#/screens/Atmosphere/rowLayout'
import {getActivityPresentationKind} from '#/screens/Atmosphere/socialProof'
import {isPublicationRecord} from '#/screens/Atmosphere/types'
import {atoms as a, useTheme} from '#/alf'
import {BookmarkFilled as SubscribeIcon} from '#/components/icons/Bookmark'
import {InlineLinkText, Link} from '#/components/Link'
import {SubscribeButton} from '#/components/Post/Embed/StandardSiteEmbed'
import {matchStandardSitePublisherByViewHints} from '#/components/Post/Embed/StandardSiteEmbed/publishers'
import {Text} from '#/components/Typography'
import {
  ActivityActorLine,
  ActivityCard,
  ActivityFootnote,
  ActivityTimestamp,
} from './ActivityPrimitives'
import {DocumentMenuPlaceholder} from './DocumentMenu'

export function SubscriptionActivityRenderer({
  item,
  computedItemView,
  testID,
}: ActivityRendererProps) {
  const t = useTheme()
  const {t: l} = useLingui()
  const first = getFirstActivity(item)
  if (!first || computedItemView.actors.length === 0) return null
  const actorGroup = item.type === 'group' && item.group.groupBy === 'actor'
  const publicationUri = getSubscriptionActivityUri(item)
  const publication = publicationUri
    ? item.associatedRecords[publicationUri]?.record
    : undefined
  const view = createPublicationExternalView({uri: publicationUri, ...item})
  const title =
    (isPublicationRecord(publication) ? publication.name.trim() : '') ||
    l`Publication unavailable`
  const author = getRecordActor(publicationUri, item.actors)
  const timestamp =
    item.type === 'activity' ? first.record.indexedAt : item.group.indexedAt
  const remainingCount = actorGroup ? item.group.items.length - 1 : 0
  const suffix =
    remainingCount > 0
      ? l`and ${plural(remainingCount, {one: '# more publication', other: '# more publications'})}`
      : undefined
  const isCard =
    Boolean(view?.title.trim()) &&
    getActivityPresentationKind({item, computedItemView}) === 'card'
  const publisher = view
    ? matchStandardSitePublisherByViewHints(view)
    : undefined

  return (
    <View testID={testID} style={a.px_xl}>
      {isCard && view ? (
        <View testID="atmosphereSubscriptionCard">
          <ActivityCard>
            <View style={a.gap_md}>
              <View style={[a.flex_row, a.align_start, a.gap_sm]}>
                <Link
                  to={view.uri}
                  label={title}
                  style={[a.flex_1, a.gap_md, a.align_start]}>
                  {view.source?.icon ? (
                    <Image
                      testID="atmospherePublicationIcon"
                      source={{uri: view.source.icon}}
                      style={[a.rounded_sm, {width: 40, height: 40}]}
                      contentFit="cover"
                      accessible={false}
                      accessibilityIgnoresInvertColors
                      loading="lazy"
                      useAppleWebpCodec
                    />
                  ) : null}
                  <View style={[a.flex_1, a.gap_xs, {minWidth: 0}]}>
                    <Text
                      emoji
                      numberOfLines={3}
                      style={[a.text_lg, a.font_semi_bold, a.leading_snug]}>
                      {title}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[a.text_xs, t.atoms.text_contrast_medium]}>
                      {toNiceDomain(view.uri)}
                    </Text>
                  </View>
                </Link>
                <ActivityTimestamp timestamp={timestamp} />
                <DocumentMenuPlaceholder />
              </View>
              {author ? (
                <InlineLinkText
                  emoji
                  to={makeProfileLink(author)}
                  label={l`View ${sanitizeHandle(author.handle, '@')}’s profile`}
                  style={[a.text_xs, t.atoms.text_contrast_medium]}>
                  {l`by ${sanitizeHandle(author.handle, '@')}`}
                </InlineLinkText>
              ) : null}
              {view.description.trim() ? (
                <Text
                  emoji
                  numberOfLines={3}
                  style={[
                    a.text_sm,
                    a.leading_snug,
                    t.atoms.text_contrast_medium,
                  ]}>
                  {view.description}
                </Text>
              ) : null}
              <View
                style={[
                  a.border_t,
                  a.pt_md,
                  a.gap_md,
                  t.atoms.border_contrast_low,
                ]}>
                <ActivityActorLine
                  actors={computedItemView.actors}
                  action={l`subscribed`}
                  icon={SubscribeIcon}
                  iconColor={t.palette.positive_500}
                />
                <View testID="atmospherePublicationCTA">
                  <SubscribeButton
                    view={view}
                    style={[a.w_full, a.justify_center]}
                  />
                </View>
              </View>
            </View>
          </ActivityCard>
        </View>
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
          menu={<DocumentMenuPlaceholder />}
        />
      )}
    </View>
  )
}
