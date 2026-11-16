import {Plural, Trans} from '@lingui/react/macro'

import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
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
          <Strong>
            <Plural value={count} one="# article" other="# articles" />
          </Strong>
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
          <Strong>
            <Plural value={count} one="# article" other="# articles" />
          </Strong>
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
          <Strong>
            <Plural value={count} one="# publication" other="# publications" />
          </Strong>
        </Trans>
      ) : (
        <Trans>{actor} subscribed to a publication</Trans>
      )

    case social.grain.gallery.$type:
      return count > 1 ? (
        <Trans>
          {actor} posted{' '}
          <Strong>
            <Plural value={count} one="# gallery" other="# galleries" />
          </Strong>
        </Trans>
      ) : (
        <Trans>{actor} posted a gallery</Trans>
      )

    case place.stream.livestream.$type:
      if (row.content.type === 'livestream' && isLive(row.content.view)) {
        return <Trans>{actor} is live</Trans>
      }
      return count > 1 ? (
        <Trans>
          {actor} was live{' '}
          <Strong>
            <Plural value={count} one="# time" other="# times" />
          </Strong>
        </Trans>
      ) : (
        <Trans>{actor} was live</Trans>
      )
  }
}

function Strong({children}: {children: React.ReactNode}) {
  return <Text style={a.font_semi_bold}>{children}</Text>
}
