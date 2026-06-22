import {useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {
  FIXTURE_LOOKBACK_DAYS,
  SPORTS_COMPETITIONS_KEY,
  SPORTS_ENABLED,
} from '#/features/liveSports/config'
import {
  fetchFootballDataFixtures,
  fetchFootballDataStandings,
} from '#/features/liveSports/providers/footballData'

const sportsFixturesQueryKeyRoot = 'sportsFixtures'
const sportsStandingsQueryKeyRoot = 'sportsStandings'

export const createSportsFixturesQueryKey = (args: {competitions: string}) =>
  createQueryKey(sportsFixturesQueryKeyRoot, args)

export const createSportsStandingsQueryKey = (args: {competitions: string}) =>
  createQueryKey(sportsStandingsQueryKeyRoot, args)

export function useSportsFixturesQuery() {
  return useQuery({
    enabled: SPORTS_ENABLED,
    queryKey: createSportsFixturesQueryKey({
      competitions: SPORTS_COMPETITIONS_KEY,
    }),
    queryFn: async ({signal}) => {
      // Day-align the window to whole days so fixtures early in the day aren't
      // dropped before the rail buckets them by local day.
      const from = new Date()
      from.setHours(0, 0, 0, 0)
      from.setDate(from.getDate() - FIXTURE_LOOKBACK_DAYS)
      const to = new Date()
      to.setHours(23, 59, 59, 999)
      return fetchFootballDataFixtures({from, to, signal})
    },
    // Scores move quickly while matches are live; keep this short so the rail
    // stays current without hammering the API.
    staleTime: STALE.MINUTES.ONE,
    // Only poll while something is in play; no need to refetch a static rail.
    refetchInterval: query => {
      const matches = query.state.data
      const hasLive = matches?.some(m => m.status === 'live')
      return hasLive ? 30 * 1000 : false
    },
  })
}

/** Standings are fetched lazily, only when the leaderboard is expanded. */
export function useSportsStandingsQuery({enabled}: {enabled: boolean}) {
  return useQuery({
    enabled: SPORTS_ENABLED && enabled,
    queryKey: createSportsStandingsQueryKey({
      competitions: SPORTS_COMPETITIONS_KEY,
    }),
    queryFn: ({signal}) => fetchFootballDataStandings({signal}),
    staleTime: STALE.MINUTES.FIVE,
  })
}
