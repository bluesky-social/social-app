import {View} from 'react-native'
import {Trans} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {DocumentCompactCard} from '#/components/atmosphere/SiteStandard/DocumentCompact'
import {PublicationCard} from '#/components/atmosphere/SiteStandard/Publication'
import {ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon} from '#/components/icons/Arrow'
import {Text} from '#/components/Typography'
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
      style={[
        a.gap_md,
        a.px_lg,
        a.py_lg,
        a.border_b,
        t.atoms.border_contrast_low,
      ]}>
      {row.kind === 'card' ? (
        <ActivityCard row={row} />
      ) : (
        <Admonition type="warning">
          <Trans>This activity can’t be shown right now.</Trans>
        </Admonition>
      )}
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
      {row.activityCount > 1 && <ViewAllLink />}
    </>
  )
}

function ActivityContentCard({content}: {content: ActivityContent}) {
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

/** Styled only; the destination comes later. */
function ViewAllLink() {
  const t = useTheme()
  return (
    <View
      testID="activityV1ViewAll"
      style={[a.flex_row, a.align_center, a.gap_xs]}>
      <Text style={[a.text_md, a.font_medium, {color: t.palette.primary_500}]}>
        <Trans>View all</Trans>
      </Text>
      <ArrowRightIcon size="sm" fill={t.palette.primary_500} />
    </View>
  )
}
