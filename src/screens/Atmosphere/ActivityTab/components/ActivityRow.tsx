import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {makeActivityListLink} from '#/screens/Atmosphere/ActivityList/links'
import {useAtmosphereFeedback} from '#/screens/Atmosphere/feedback'
import {getContentMetricContextProps} from '#/screens/Atmosphere/metrics/content'
import {
  AtmosphereContentItem,
  useAtmosphereMetricContext,
  useLogContentPress,
} from '#/screens/Atmosphere/metrics/context'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {
  Document,
  type DocumentRecommenders,
} from '#/components/atmosphere/SiteStandard/Document'
import {PublicationCard} from '#/components/atmosphere/SiteStandard/Publication'
import {ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon} from '#/components/icons/Arrow'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {site} from '#/lexicons'
import {
  type ActivityCardRow,
  type ActivityContent,
  type ActivityRow as ActivityRowModel,
} from '../rows'
import {ActivityContentHider} from './ActivityContentHider'
import {ActivityHeader} from './ActivityHeader'
import {GalleryCard} from './GalleryCard'
import {LivestreamCard} from './LivestreamCard'

export function ActivityRow({
  row,
  position,
}: {
  row: ActivityRowModel
  /** 0-based, in the list. */
  position: number
}) {
  const t = useTheme()
  return (
    <View
      testID={row.kind === 'card' ? 'activityRow' : 'activityWarningRow'}
      style={[a.gap_md, a.p_lg, a.border_b, t.atoms.border_contrast_low]}>
      {row.kind === 'card' ? (
        <ActivityCard row={row} position={position} />
      ) : (
        <ActivityWarning />
      )}
    </View>
  )
}

function ActivityCard({
  row,
  position,
}: {
  row: ActivityCardRow
  position: number
}) {
  return (
    <>
      <ActivityHeader row={row} />
      <ActivityContentHider moderation={row.moderation}>
        <AtmosphereContentItem
          item={getContentMetricContextProps(
            row.content.type,
            row.content.view,
            {
              position,
              activityReferrerCollection: row.collection,
              activityReferrerGrouping: row.grouping,
            },
          )}>
          <ActivityContentCard
            content={row.content}
            recommenders={row.related.find(
              related =>
                related.collection === site.standard.graph.recommend.$type,
            )}
          />
        </AtmosphereContentItem>
      </ActivityContentHider>
      <ViewAllLink row={row} />
    </>
  )
}

export function ActivityWarning() {
  return (
    <Admonition type="warning">
      <Trans>This activity can’t be shown right now.</Trans>
    </Admonition>
  )
}

export function ActivityContentCard({
  content,
  recommenders,
}: {
  content: ActivityContent
  /** Shown in an article's social proof. */
  recommenders?: DocumentRecommenders
}) {
  const logPress = useLogContentPress()
  const sendFeedback = useAtmosphereFeedback()
  const onPress = (source: 'card' | 'cta') => {
    logPress('external', source)
    sendFeedback?.('app.bsky.feed.defs#clickthroughItem')
  }
  const onShare = () => sendFeedback?.('app.bsky.feed.defs#interactionShare')
  switch (content.type) {
    case 'article':
      return (
        <Document
          variant="compact"
          view={content.view}
          recommenders={recommenders}
          hideMeta
          onPressCallback={onPress}
          onShareCallback={onShare}
        />
      )
    case 'publication':
      return (
        <PublicationCard
          view={content.view}
          onPressCallback={onPress}
          onShareCallback={onShare}
        />
      )
    case 'gallery':
      return <GalleryCard content={content} />
    case 'livestream':
      return <LivestreamCard content={content} />
  }
}

/** Opens what every activity in an actor group targets as a list. */
function ViewAllLink({row}: {row: ActivityCardRow}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const ax = useAnalytics()
  const metricContext = useAtmosphereMetricContext()
  const subjectUris = row.subjectUris
  if (!subjectUris) return null
  return (
    <Link
      testID="activityViewAll"
      to={makeActivityListLink(subjectUris)}
      label={l`View all activity`}
      onPress={() => {
        if (!metricContext) return
        ax.metric('atmosphere:activity:viewAll', {
          ...metricContext,
          subjectCount: subjectUris.length,
          collection: row.collection,
        })
      }}
      style={[a.flex_row, a.align_center, a.gap_xs, a.self_start]}>
      <Text style={[a.text_sm, a.font_medium, {color: t.palette.primary_500}]}>
        <Trans>View all</Trans>
      </Text>
      <ArrowRightIcon size="sm" fill={t.palette.primary_500} />
    </Link>
  )
}
