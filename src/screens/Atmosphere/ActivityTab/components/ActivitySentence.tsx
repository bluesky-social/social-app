import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {makeActivityListLink} from '#/screens/Atmosphere/ActivityList/links'
import {useAtmosphereMetricContext} from '#/screens/Atmosphere/metrics/context'
import {atoms as a, useTheme} from '#/alf'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {place, site, social} from '#/lexicons'
import {type ActivityCardRow} from '../rows'
import {isLive} from './LivestreamCard'

/**
 * The "<actor> <did something>" sentence. Each case is a full sentence so
 * translators never have to stitch fragments together. The app it happened
 * on is shown with the time, not here.
 */
export function ActivitySentence({
  row,
  actor,
}: {
  row: ActivityCardRow
  /** The rendered actor name, linked to their profile. */
  actor: React.ReactNode
}) {
  const count = row.activityCount
  const others = row.otherActorCount

  switch (row.collection) {
    case site.standard.document.$type:
      return count > 1 ? (
        <Trans>
          {actor} published{' '}
          <ContentCount row={row}>
            <Plural value={count} one="# article" other="# articles" />
          </ContentCount>
        </Trans>
      ) : (
        <Trans>{actor} published an article</Trans>
      )

    case site.standard.graph.recommend.$type:
      if (others > 0) {
        return (
          <Trans>
            {actor} and{' '}
            <Strong>
              <Plural value={others} one="# other" other="# others" />
            </Strong>{' '}
            recommended an article
          </Trans>
        )
      }
      return count > 1 ? (
        <Trans>
          {actor} recommended{' '}
          <ContentCount row={row}>
            <Plural value={count} one="# article" other="# articles" />
          </ContentCount>
        </Trans>
      ) : (
        <Trans>{actor} recommended an article</Trans>
      )

    case site.standard.graph.subscription.$type:
      if (others > 0) {
        return (
          <Trans>
            {actor} and{' '}
            <Strong>
              <Plural value={others} one="# other" other="# others" />
            </Strong>{' '}
            subscribed to a publication
          </Trans>
        )
      }
      return count > 1 ? (
        <Trans>
          {actor} subscribed to{' '}
          <ContentCount row={row}>
            <Plural value={count} one="# publication" other="# publications" />
          </ContentCount>
        </Trans>
      ) : (
        <Trans>{actor} subscribed to a publication</Trans>
      )

    case social.grain.gallery.$type:
      return count > 1 ? (
        <Trans>
          {actor} posted{' '}
          <ContentCount row={row}>
            <Plural value={count} one="# gallery" other="# galleries" />
          </ContentCount>
        </Trans>
      ) : (
        <Trans>{actor} posted a gallery</Trans>
      )

    case place.stream.livestream.$type:
      if (row.content.type === 'livestream' && isLive(row.content.view)) {
        return count > 1 ? (
          <Trans>
            {actor} is live ·{' '}
            <ContentCount row={row}>
              <Plural value={count} one="# livestream" other="# livestreams" />
            </ContentCount>
          </Trans>
        ) : (
          <Trans>{actor} is live</Trans>
        )
      }
      return count > 1 ? (
        <Trans>
          {actor} was live{' '}
          <ContentCount row={row}>
            <Plural value={count} one="# time" other="# times" />
          </ContentCount>
        </Trans>
      ) : (
        <Trans>{actor} was live</Trans>
      )
  }
}

/** Opens the content in an actor group, not the people in a subject group. */
function ContentCount({
  row,
  children,
}: {
  row: ActivityCardRow
  children: React.ReactNode
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const ax = useAnalytics()
  const metricContext = useAtmosphereMetricContext()
  const {subjectUris} = row

  if (row.grouping !== 'actorGroup' || !subjectUris?.length) {
    return <Strong>{children}</Strong>
  }

  return (
    <InlineLinkText
      testID="activityGroupLink"
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
      style={[
        a.text_sm,
        a.font_semi_bold,
        a.leading_snug,
        {color: t.palette.primary_500},
      ]}>
      {children}
    </InlineLinkText>
  )
}

function Strong({children}: {children: React.ReactNode}) {
  return <Text style={a.font_semi_bold}>{children}</Text>
}
