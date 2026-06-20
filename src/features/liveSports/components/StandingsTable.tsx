import {Fragment} from 'react'
import {type TextStyle, View} from 'react-native'
import {Image} from 'expo-image'
import {Trans} from '@lingui/react/macro'

import {atoms as a, useGutters, useTheme} from '#/alf'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {
  SPORTS_GROUP_ADVANCE,
  STANDINGS_LIMIT,
} from '#/features/liveSports/config'
import {groupStandings, topStandings} from '#/features/liveSports/parse'
import {type StandingRow} from '#/features/liveSports/types'

const COL_NUM_WIDTH = 22
const COL_STAT_WIDTH = 26
const CREST_SIZE = 20

// Tabular figures so numeric columns stay aligned.
const TABULAR: TextStyle = {fontVariant: ['tabular-nums']}

export function StandingsTable({
  rows,
  isLoading,
}: {
  rows: StandingRow[] | undefined
  isLoading: boolean
}) {
  const gutters = useGutters([0, 'base'])

  if (isLoading) {
    return (
      <View style={[a.py_xl, a.align_center]}>
        <Loader size="md" />
      </View>
    )
  }

  if (!rows || rows.length === 0) return null

  // Grouped tournaments get one card per group; a plain league gets a single
  // card capped at the configured limit.
  const grouped = rows.some(r => r.group)

  return (
    <View style={[gutters, a.pt_sm, a.pb_md]}>
      {grouped ? (
        groupStandings(rows).map((section, i) => (
          <GroupSection
            key={section.group}
            title={section.group}
            rows={section.rows}
            first={i === 0}
          />
        ))
      ) : (
        <GroupSection first rows={topStandings(rows, STANDINGS_LIMIT)} />
      )}
    </View>
  )
}

function GroupSection({
  title,
  rows,
  first,
}: {
  title?: string
  rows: StandingRow[]
  first?: boolean
}) {
  const t = useTheme()
  return (
    <View
      style={[
        first ? a.pt_xs : a.pt_lg,
        // Faint divider between groups.
        !first && [a.border_t, t.atoms.border_contrast_low],
      ]}>
      {title && (
        <Text style={[a.text_md, a.font_bold, a.text_center, a.pb_sm]}>
          {title}
        </Text>
      )}
      <HeaderRow />
      {rows.map((row, i) => (
        <Fragment key={row.team.name}>
          <Row row={row} />
          {SPORTS_GROUP_ADVANCE > 0 &&
            i + 1 === SPORTS_GROUP_ADVANCE &&
            i + 1 < rows.length && <QualifyLine />}
        </Fragment>
      ))}
    </View>
  )
}

function HeaderRow() {
  const t = useTheme()
  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.pb_xs,
        a.border_b,
        t.atoms.border_contrast_low,
      ]}>
      {/* Spacer matching the rank column so "Team" sits over the team entries. */}
      <View style={{width: COL_NUM_WIDTH}} />
      <Text
        style={[
          a.flex_1,
          a.text_xs,
          a.font_medium,
          t.atoms.text_contrast_medium,
        ]}>
        <Trans comment="Standings column: team">Team</Trans>
      </Text>
      <StatText header>
        <Trans comment="Standings column: games played (abbreviation)">
          GP
        </Trans>
      </StatText>
      <StatText header>
        <Trans comment="Standings column: wins (abbreviation)">W</Trans>
      </StatText>
      <StatText header>
        <Trans comment="Standings column: draws (abbreviation)">D</Trans>
      </StatText>
      <StatText header>
        <Trans comment="Standings column: losses (abbreviation)">L</Trans>
      </StatText>
      <StatText header>
        <Trans comment="Standings column: goal difference (abbreviation)">
          GD
        </Trans>
      </StatText>
      <StatText header lead>
        <Trans comment="Standings column: points (abbreviation)">PTS</Trans>
      </StatText>
    </View>
  )
}

function QualifyLine() {
  const t = useTheme()
  return <View style={[a.border_b, t.atoms.border_contrast_low, a.my_xs]} />
}

function Row({row}: {row: StandingRow}) {
  const t = useTheme()

  return (
    <View style={[a.flex_row, a.align_center, a.py_sm]}>
      <Text
        style={[
          a.text_sm,
          a.font_bold,
          t.atoms.text_contrast_medium,
          TABULAR,
          {width: COL_NUM_WIDTH},
        ]}>
        {row.position}
      </Text>

      <View style={[a.flex_1, a.flex_row, a.align_center, a.gap_sm]}>
        <Crest uri={row.team.crest} />
        <Text
          style={[a.flex_shrink, a.text_sm, a.font_semi_bold]}
          numberOfLines={1}
          emoji>
          {row.team.name}
        </Text>
      </View>

      <StatText>{row.played}</StatText>
      <StatText>{row.won}</StatText>
      <StatText>{row.draw}</StatText>
      <StatText>{row.lost}</StatText>
      <StatText>{formatGoalDiff(row.goalDifference)}</StatText>
      <StatText bold lead>
        {row.points}
      </StatText>
    </View>
  )
}

function Crest({uri}: {uri?: string}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.rounded_full,
        a.overflow_hidden,
        t.atoms.bg_contrast_100,
        {width: CREST_SIZE, height: CREST_SIZE},
      ]}>
      {uri && (
        <Image
          source={{uri}}
          style={{width: CREST_SIZE, height: CREST_SIZE}}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
      )}
    </View>
  )
}

function StatText({
  children,
  bold,
  lead,
  header,
}: {
  children: React.ReactNode
  bold?: boolean
  lead?: boolean
  header?: boolean
}) {
  const t = useTheme()
  return (
    <Text
      style={[
        a.text_right,
        {width: COL_STAT_WIDTH},
        lead && {marginLeft: 10},
        header
          ? [a.text_xs, a.font_medium, t.atoms.text_contrast_medium]
          : [
              a.text_sm,
              bold ? a.font_bold : a.font_normal,
              t.atoms.text,
              TABULAR,
            ],
      ]}>
      {children}
    </Text>
  )
}

function formatGoalDiff(gd: number): string {
  return gd > 0 ? `+${gd}` : `${gd}`
}
