import {View} from 'react-native'
import {Image} from 'expo-image'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {SPORTS_MULTI_COMPETITION} from '#/features/liveSports/config'
import {type MatchTeam, type SportsMatch} from '#/features/liveSports/types'

export const CARD_WIDTH = 220

type TeamResult = 'win' | 'loss' | 'none'

/**
 * Top-right context line. With one competition the header already names it, so
 * we show only the stage. With several, we prepend the competition name.
 */
function contextLabel(match: SportsMatch): string | undefined {
  if (SPORTS_MULTI_COMPETITION) {
    return [match.competition, match.stageLabel].filter(Boolean).join(' · ')
  }
  return match.stageLabel
}

export function MatchCard({match}: {match: SportsMatch}) {
  const t = useTheme()
  const {home, away} = match
  const accessibilityLabel = useAccessibilityLabel(match)
  const context = contextLabel(match)

  const finished = match.status === 'finished'
  const decided =
    finished && typeof home.score === 'number' && typeof away.score === 'number'
  const homeResult: TeamResult = decided
    ? home.score! > away.score!
      ? 'win'
      : home.score! < away.score!
        ? 'loss'
        : 'none'
    : 'none'
  const awayResult: TeamResult =
    homeResult === 'win' ? 'loss' : homeResult === 'loss' ? 'win' : 'none'

  return (
    // The card is informational, not interactive, so a hint would be noise.
    // eslint-disable-next-line react-native-a11y/has-accessibility-hint
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel}
      style={[
        {width: CARD_WIDTH},
        a.rounded_md,
        a.border,
        a.p_md,
        a.gap_sm,
        t.atoms.border_contrast_low,
        t.atoms.bg_contrast_25,
      ]}>
      <View style={[a.flex_row, a.align_center, a.justify_between, a.gap_sm]}>
        <Kickoff match={match} />
        {context && (
          <Text
            style={[
              a.flex_shrink,
              a.text_xs,
              a.font_medium,
              t.atoms.text_contrast_medium,
            ]}
            numberOfLines={1}>
            {context}
          </Text>
        )}
      </View>
      <View style={[a.gap_xs]}>
        <TeamRow team={home} result={homeResult} />
        <TeamRow team={away} result={awayResult} />
      </View>
    </View>
  )
}

function Kickoff({match}: {match: SportsMatch}) {
  const t = useTheme()
  const kickoff = useKickoffLabel(match.startingAt)
  const statusLabel = useStatusLabel(match.statusLabel)

  if (match.status === 'live') {
    return (
      <Text style={[a.text_xs, a.font_bold, {color: t.palette.negative_500}]}>
        {statusLabel}
      </Text>
    )
  }

  return (
    <Text style={[a.text_xs, a.font_medium, t.atoms.text_contrast_medium]}>
      {match.status === 'finished' ? statusLabel : kickoff}
    </Text>
  )
}

function TeamRow({team, result}: {team: MatchTeam; result: TeamResult}) {
  const t = useTheme()
  const hasScore = typeof team.score === 'number'
  // Emphasize the winner, dim the loser; leave draws and pre-match neutral.
  const dimmed = result === 'loss'

  return (
    <View style={[a.flex_row, a.align_center, a.gap_sm]}>
      <View
        style={[
          a.rounded_full,
          a.overflow_hidden,
          t.atoms.bg_contrast_100,
          {width: 22, height: 22},
          dimmed && {opacity: 0.6},
        ]}>
        {team.crest && (
          <Image
            source={{uri: team.crest}}
            style={{width: 22, height: 22}}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        )}
      </View>
      <Text
        style={[
          a.flex_1,
          a.text_sm,
          a.leading_tight,
          result === 'win' ? a.font_bold : a.font_semi_bold,
          dimmed && t.atoms.text_contrast_medium,
        ]}
        numberOfLines={1}
        emoji>
        {team.name}
      </Text>
      {hasScore && (
        <Text
          style={[
            a.text_sm,
            result === 'win' ? a.font_bold : a.font_semi_bold,
            dimmed ? t.atoms.text_contrast_medium : t.atoms.text,
          ]}>
          {team.score}
        </Text>
      )}
    </View>
  )
}

/**
 * Kickoff time, scaled to how far out the match is: time today, weekday and time
 * within the week, otherwise a date. Uses i18n.date so it re-localizes.
 */
function useKickoffLabel(startingAt: string): string {
  const {i18n} = useLingui()
  const date = new Date(startingAt)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  const withinWeek =
    date.getTime() > now.getTime() &&
    date.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000

  if (sameDay) {
    return i18n.date(date, {hour: 'numeric', minute: '2-digit'})
  }
  if (withinWeek) {
    return i18n.date(date, {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    })
  }
  return i18n.date(date, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function useStatusLabel(raw?: string): string {
  const {t: l} = useLingui()
  switch (raw) {
    case 'LIVE':
      return l`LIVE`
    case 'HT':
      return l({message: 'HT', comment: 'Abbreviation for "half time"'})
    case 'FT':
      return l({
        message: 'Final',
        comment: 'Label on a finished match, i.e. full time',
      })
    case 'AET':
      return l({
        message: 'AET',
        comment: 'Abbreviation for "after extra time"',
      })
    case 'PEN':
      return l({
        message: 'PEN',
        comment: 'Abbreviation for a match decided on penalties',
      })
    default:
      return raw ?? l`LIVE`
  }
}

function useAccessibilityLabel(match: SportsMatch): string {
  const {t: l} = useLingui()
  const {home, away} = match
  const kickoff = useKickoffLabel(match.startingAt)
  const context = contextLabel(match)
  const prefix = context ? `${context}. ` : ''

  if (match.status === 'upcoming') {
    return prefix + l`${home.name} versus ${away.name}, ${kickoff}`
  }

  const score = l`${home.name} ${home.score ?? 0}, ${away.name} ${away.score ?? 0}`
  if (match.status === 'live') {
    return prefix + l`${score}, live`
  }
  return prefix + l`${score}, full time`
}
