import {Fragment, useState} from 'react'
import {ScrollView, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import * as ModuleHeader from '#/screens/Search/components/ModuleHeader'
import {atoms as a, tokens, useGutters, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ChevronBottom_Stroke2_Corner0_Rounded as ChevronDown} from '#/components/icons/Chevron'
import {ChevronTop_Stroke2_Corner0_Rounded as ChevronUp} from '#/components/icons/Chevron'
import {Trophy_Stroke2_Corner2_Rounded as TrophyIcon} from '#/components/icons/Trophy'
import {Text} from '#/components/Typography'
import {
  SPORTS_ENABLED,
  SPORTS_PREVIEW_LIVE,
  SPORTS_TITLE_OVERRIDE,
} from '#/features/liveSports/config'
import {sortMatches, toLocalDayKey} from '#/features/liveSports/parse'
import {
  useSportsFixturesQuery,
  useSportsStandingsQuery,
} from '#/features/liveSports/queries'
import {type SportsMatch} from '#/features/liveSports/types'
import {CARD_WIDTH, MatchCard} from './MatchCard'
import {StandingsTable} from './StandingsTable'

const SKELETON_COUNT = 4

type DayGroup = {label: string; matches: SportsMatch[]}

export function ExploreLiveSportsWidget() {
  if (!SPORTS_ENABLED) return null
  return <Inner />
}

function Inner() {
  const {t: l} = useLingui()
  const t = useTheme()
  const [expanded, setExpanded] = useState(false)
  const {data, isLoading, error} = useSportsFixturesQuery()
  const standings = useSportsStandingsQuery({enabled: expanded})

  // One rail: today then yesterday, each labeled inline.
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const matchesOn = (key: string) =>
    data
      ? sortMatches(
          data.filter(m => toLocalDayKey(new Date(m.startingAt)) === key),
        )
      : []
  const groups: DayGroup[] = [
    {label: l`Today`, matches: matchesOn(toLocalDayKey(now))},
    {label: l`Yesterday`, matches: matchesOn(toLocalDayKey(yesterday))},
  ].filter(g => g.matches.length > 0)

  // Dev preview only; see SPORTS_PREVIEW_LIVE.
  if (SPORTS_PREVIEW_LIVE && groups[0]?.matches.length) {
    const [first, ...rest] = groups[0].matches
    groups[0] = {
      ...groups[0],
      matches: [{...first, status: 'live', statusLabel: 'LIVE'}, ...rest],
    }
  }

  if (error) return null
  if (!isLoading && groups.length === 0) return null

  const title = SPORTS_TITLE_OVERRIDE ?? l`Football`

  return (
    <View style={[a.pb_xl, a.border_b, t.atoms.border_contrast_low]}>
      <ModuleHeader.Container>
        <ModuleHeader.Icon icon={TrophyIcon} />
        <ModuleHeader.TitleText>{title}</ModuleHeader.TitleText>
        <Button
          label={expanded ? l`Hide the rankings` : l`Show the rankings`}
          size="tiny"
          variant="ghost"
          color="secondary"
          onPress={() => setExpanded(v => !v)}>
          <ButtonText>{l`Rankings`}</ButtonText>
          <ButtonIcon icon={expanded ? ChevronUp : ChevronDown} />
        </Button>
      </ModuleHeader.Container>

      <MatchRail groups={isLoading && !data ? undefined : groups} />

      {expanded && (
        <StandingsTable rows={standings.data} isLoading={standings.isLoading} />
      )}
    </View>
  )
}

function MatchRail({groups}: {groups?: DayGroup[]}) {
  const gutters = useGutters([0, 'base'])
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={CARD_WIDTH + tokens.space.sm}>
      <View
        style={[
          a.flex_row,
          a.gap_sm,
          a.pt_sm,
          {
            paddingLeft: gutters.paddingLeft,
            paddingRight: gutters.paddingRight,
          },
        ]}>
        {groups
          ? groups.map(group => (
              <Fragment key={group.label}>
                <DayLabel label={group.label} />
                {group.matches.map(match => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </Fragment>
            ))
          : Array.from({length: SKELETON_COUNT}).map((_, i) => (
              <MatchCardSkeleton key={i} />
            ))}
      </View>
    </ScrollView>
  )
}

function DayLabel({label}: {label: string}) {
  const t = useTheme()
  return (
    <View style={[a.justify_center]}>
      <Text
        style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium]}
        numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}

function MatchCardSkeleton() {
  const t = useTheme()
  return (
    <View
      style={[
        {width: CARD_WIDTH, height: 96},
        a.rounded_md,
        a.border,
        // Borrow the same low-contrast surface as a loaded card.
        {opacity: 0.5},
        t.atoms.bg_contrast_25,
        t.atoms.border_contrast_low,
      ]}
    />
  )
}
