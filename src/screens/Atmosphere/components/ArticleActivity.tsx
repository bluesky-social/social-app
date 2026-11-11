import {View} from 'react-native'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {ACTIVITY_ROW_PADDING_START} from '#/screens/Atmosphere/constants'
import {getArticleExternalView} from '#/screens/Atmosphere/externalViews'
import {getRecordActor} from '#/screens/Atmosphere/presentation'
import {
  getActivityContent,
  getActivityCount,
  getFirstActivity,
} from '#/screens/Atmosphere/relationships'
import {type ActivityRendererProps} from '#/screens/Atmosphere/renderers'
import {
  getActivityRowKind,
  getArticleActivityUri,
} from '#/screens/Atmosphere/rowLayout'
import {getDocumentSocialProof} from '#/screens/Atmosphere/socialProof'
import {isActorGroup} from '#/screens/Atmosphere/types'
import {atoms as a, useTheme} from '#/alf'
import {Heart2_Filled_Stroke2_Corner0_Rounded as RecommendIcon} from '#/components/icons/Heart2'
import {PageText_Stroke2_Corner0_Rounded as ArticleIcon} from '#/components/icons/PageText'
import {InlineLinkText} from '#/components/Link'
import {matchStandardSitePublisherByViewHints} from '#/components/Post/Embed/StandardSiteEmbed/publishers'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {ActivityArticleCard} from './ActivityArticleCard'
import {ActivityCounts} from './ActivityCounts'
import {
  ActivityActorLine,
  ActivityFootnote,
  ActivityRowContent,
} from './ActivityPrimitives'
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
  actions,
}: ActivityRendererProps & {recommendation: boolean}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const first = getFirstActivity(item)
  const content = getActivityContent(item)
  if (!first || !content || computedItemView.actors.length === 0) return null
  const actorGroup = item.type === 'group' && isActorGroup(item.group)
  const documentUri = getArticleActivityUri(item)
  const view = getArticleExternalView(content)
  const title =
    view?.title.trim() ||
    (bsky.isType(app.bsky.embed.external.viewArticle, content.view)
      ? content.view.title.trim()
      : '') ||
    l`Article unavailable`
  const author = getRecordActor(documentUri, item.actors)
  const timestamp =
    item.type === 'activity' ? first.record.indexedAt : item.group.indexedAt
  const remainingCount = actorGroup ? getActivityCount(item) - 1 : 0
  const suffix =
    remainingCount > 0
      ? l`and ${plural(remainingCount, {one: '# more article', other: '# more articles'})}`
      : undefined
  const {recommenders, shares} = getDocumentSocialProof(content)
  const action = recommendation
    ? l`recommended an article`
    : l`published a new article`
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
          icon={recommendation ? RecommendIcon : ArticleIcon}
          iconColor={recommendation ? t.palette.primary_500 : undefined}
          actions={actions}
          header={
            <ActivityActorLine
              actors={computedItemView.actors}
              action={action}
              timestamp={timestamp}
              showAvatars={false}
            />
          }>
          <ActivityArticleCard
            item={item}
            view={view}
            remainingCount={remainingCount}>
            {!recommendation &&
            (recommenders.length > 0 || shares.length > 0) ? (
              <View style={a.gap_lg}>
                {recommenders.length > 0 ? (
                  <ActivityActorLine
                    testID="atmosphereArticleRecommendations"
                    actors={recommenders}
                    action={l`recommended`}
                    icon={RecommendIcon}
                    iconColor={t.palette.primary_500}
                  />
                ) : null}
                {shares.length > 0 ? (
                  <ShareSnippets
                    shares={shares}
                    hideActorMetadataForDid={author?.did}
                  />
                ) : null}
              </View>
            ) : null}
          </ActivityArticleCard>
        </ActivityRowContent>
      ) : (
        <ActivityFootnote
          title={title}
          to={view?.uri}
          icon={recommendation ? RecommendIcon : ArticleIcon}
          iconColor={recommendation ? t.palette.primary_500 : undefined}
          actors={computedItemView.actors}
          action={recommendation ? l`recommended` : l`published`}
          timestamp={timestamp}
          app={
            publisher ? {name: publisher.name, to: publisher.url} : undefined
          }
          suffix={suffix}
          thumb={view?.thumb}
          actions={actions}>
          <ActivityCounts view={content.view} />
          {!recommendation && shares.length > 0 ? (
            <ShareSnippets
              shares={shares}
              hideActorMetadataForDid={author?.did}
            />
          ) : null}
          {view?.source ? (
            <InlineLinkText
              to={view.source.uri}
              label={view.source.title || view.source.uri}
              style={[a.text_xs, t.atoms.text_contrast_medium]}>
              {view.source.title || view.source.uri}
            </InlineLinkText>
          ) : null}
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
