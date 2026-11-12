import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {makeActivityListLink} from '#/screens/Atmosphere/ActivityList/links'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {DocumentCompactCard} from '#/components/atmosphere/SiteStandard/DocumentCompact'
import {PublicationCard} from '#/components/atmosphere/SiteStandard/Publication'
import {ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon} from '#/components/icons/Arrow'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {site} from '#/lexicons'
import {
  type ActivityCardRow,
  type ActivityContent,
  type ActivityRow as ActivityRowModel,
} from '../rows'
import {ActivityHeader} from './ActivityHeader'
import {GalleryCard} from './GalleryCard'
import {LivestreamCard} from './LivestreamCard'
import {RelatedActivityPill} from './RelatedActivityPill'

export function ActivityRow({row}: {row: ActivityRowModel}) {
  const t = useTheme()
  return (
    <View
      testID={row.kind === 'card' ? 'activityV1Row' : 'activityV1WarningRow'}
      style={[a.gap_sm, a.p_lg, a.border_b, t.atoms.border_contrast_low]}>
      {row.kind === 'card' ? <ActivityCard row={row} /> : <ActivityWarning />}
    </View>
  )
}

function ActivityCard({row}: {row: ActivityCardRow}) {
  return (
    <>
      <ActivityHeader row={row} />
      <ActivityContentCard content={row.content} />
      {row.related.map(related => (
        <RelatedActivityPill key={related.collection} related={related} />
      ))}
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

export function ActivityContentCard({content}: {content: ActivityContent}) {
  switch (content.type) {
    case 'article':
      return <DocumentCompactCard view={content.view} />
    case 'publication':
      return <PublicationCard view={content.view} />
    case 'gallery':
      return <GalleryCard content={content} />
    case 'livestream':
      return <LivestreamCard content={content} />
  }
}

/** Opens every activity in an actor group as a list. */
function ViewAllLink({row}: {row: ActivityCardRow}) {
  const {t: l} = useLingui()
  const t = useTheme()
  if (!row.uris) return null
  /*
   * Recommend and subscription groups only carry the URIs of those graph
   * records, not the articles or publications they point at, so there's
   * nothing to list until the timeline returns their subjects.
   */
  if (
    row.collection === site.standard.graph.recommend.$type ||
    row.collection === site.standard.graph.subscription.$type
  ) {
    return null
  }
  return (
    <Link
      testID="activityV1ViewAll"
      to={makeActivityListLink(row.uris)}
      label={l`View all activity`}
      style={[a.flex_row, a.align_center, a.gap_xs, a.self_start]}>
      <Text style={[a.text_sm, a.font_medium, {color: t.palette.primary_500}]}>
        <Trans>View all</Trans>
      </Text>
      <ArrowRightIcon size="sm" fill={t.palette.primary_500} />
    </Link>
  )
}
