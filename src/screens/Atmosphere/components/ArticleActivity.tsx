import {View} from 'react-native'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {createDocumentExternalView} from '#/screens/Atmosphere/externalViews'
import {getRecordActor} from '#/screens/Atmosphere/presentation'
import {getFirstActivity} from '#/screens/Atmosphere/relationships'
import {type ActivityRendererProps} from '#/screens/Atmosphere/renderers'
import {getArticleActivityUri} from '#/screens/Atmosphere/rowLayout'
import {
  getActivityPresentationKind,
  getDocumentSocialProof,
} from '#/screens/Atmosphere/socialProof'
import {isDocumentRecord} from '#/screens/Atmosphere/types'
import {atoms as a, useTheme} from '#/alf'
import {Heart2_Filled_Stroke2_Corner0_Rounded as RecommendIcon} from '#/components/icons/Heart2'
import {PageText_Stroke2_Corner0_Rounded as ArticleIcon} from '#/components/icons/PageText'
import {Link} from '#/components/Link'
import {matchStandardSitePublisherByViewHints} from '#/components/Post/Embed/StandardSiteEmbed/publishers'
import {Text} from '#/components/Typography'
import {ActivityActorLine, ActivityFootnote} from './ActivityPrimitives'
import {ArticleCard} from './ArticleCard'
import {DocumentMenuPlaceholder} from './DocumentMenu'
import {ShareSnippets} from './ShareSnippets'

export function DocumentActivityRenderer(props: ActivityRendererProps) {
  return <ArticleActivity {...props} recommendation={false} />
}

export function RecommendationActivityRenderer(props: ActivityRendererProps) {
  return <ArticleActivity {...props} recommendation />
}

function ArticleActivity({
  item,
  computedItemView,
  testID,
  recommendation,
}: ActivityRendererProps & {recommendation: boolean}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const first = getFirstActivity(item)
  if (!first || computedItemView.actors.length === 0) return null
  const actorGroup = item.type === 'group' && item.group.groupBy === 'actor'
  const documentUri = getArticleActivityUri(item)
  const record = documentUri
    ? item.associatedRecords[documentUri]?.record
    : undefined
  const view = createDocumentExternalView({uri: documentUri, ...item})
  const title =
    view?.title.trim() ||
    (isDocumentRecord(record) ? record.title.trim() : '') ||
    l`Article unavailable`
  const author = getRecordActor(documentUri, item.actors)
  const timestamp =
    item.type === 'activity' ? first.record.indexedAt : item.group.indexedAt
  const remainingCount = actorGroup ? item.group.items.length - 1 : 0
  const suffix =
    remainingCount > 0
      ? l`and ${plural(remainingCount, {one: '# more article', other: '# more articles'})}`
      : undefined
  const {recommenders, shares} = getDocumentSocialProof(first, item)
  const action = recommendation ? l`recommended` : l`published`
  const isCard =
    Boolean(view?.title.trim()) &&
    getActivityPresentationKind({item, computedItemView}) === 'card'
  const publisher = view
    ? matchStandardSitePublisherByViewHints(view)
    : undefined
  const PublisherIcon = publisher?.Icon

  return (
    <View testID={testID} style={[a.px_xl]}>
      {isCard && view ? (
        <ArticleCard
          item={item}
          computedItemView={computedItemView}
          view={view}
          timestamp={timestamp}
          remainingCount={remainingCount}>
          <View style={a.gap_sm}>
            <ActivityActorLine
              actors={computedItemView.actors}
              action={action}
              icon={recommendation ? RecommendIcon : undefined}
              iconColor={recommendation ? t.palette.primary_500 : undefined}
            />
            {!recommendation && recommenders.length > 0 ? (
              <ActivityActorLine
                testID="atmosphereArticleRecommendations"
                actors={recommenders}
                action={l`recommended`}
                icon={RecommendIcon}
                iconColor={t.palette.primary_500}
              />
            ) : null}
            {!recommendation && shares.length > 0 ? (
              <ShareSnippets
                shares={shares}
                associatedRecords={item.associatedRecords}
                hideActorMetadataForDid={author?.did}
              />
            ) : null}
          </View>
        </ArticleCard>
      ) : (
        <ActivityFootnote
          title={title}
          to={view?.uri}
          icon={recommendation ? RecommendIcon : ArticleIcon}
          iconColor={recommendation ? t.palette.primary_500 : undefined}
          suffix={suffix}
          thumb={view?.thumb}
          menu={<DocumentMenuPlaceholder />}>
          <View style={[a.flex_row, a.align_center]}>
            <ActivityActorLine
              actors={computedItemView.actors}
              action={action}
              timestamp={timestamp}
              showAvatars={false}
            />
            {publisher && PublisherIcon && (
              <Link to={publisher.url} label={l`via ${publisher.name}`}>
                <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                  {' • '}via{' '}
                </Text>
                <View style={[a.align_center, a.justify_center]}>
                  <PublisherIcon
                    testID="atmosphereArticlePublisherIcon"
                    accessible={false}
                    size="xs"
                    fill={t.atoms.text_contrast_medium.color}
                  />
                </View>
              </Link>
            )}
          </View>
          {!recommendation && recommenders.length > 0 ? (
            <ActivityActorLine
              testID="atmosphereArticleRecommendations"
              actors={recommenders}
              action={l`recommended`}
              showAvatars={false}
              icon={RecommendIcon}
              iconColor={t.palette.primary_500}
            />
          ) : null}
        </ActivityFootnote>
      )}
    </View>
  )
}
