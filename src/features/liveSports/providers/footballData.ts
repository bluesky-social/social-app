import {
  FOOTBALLDATA_API_URL,
  FOOTBALLDATA_TOKEN,
  MAX_MATCHES,
  SPORTS_COMPETITION_CODES,
} from '#/features/liveSports/config'
import {withinWindow} from '#/features/liveSports/parse'
import {
  type FetchFixturesArgs,
  type MatchStatus,
  type SportsMatch,
  type StandingRow,
} from '#/features/liveSports/types'

/* Raw football-data.org v4 match shapes (only the slice we consume). */

type RawTeam = {
  name?: string | null
  crest?: string | null
}

type RawMatch = {
  id: number
  utcDate?: string | null
  status?: string | null
  stage?: string | null
  group?: string | null
  homeTeam?: RawTeam | null
  awayTeam?: RawTeam | null
  score?: {
    duration?: string | null
    fullTime?: {home?: number | null; away?: number | null} | null
  } | null
  competition?: {name?: string | null} | null
}

type RawMatchesResponse = {matches?: RawMatch[]; message?: string}

export function mapStatus(
  status?: string | null,
  duration?: string | null,
): {status: MatchStatus; statusLabel?: string} | null {
  switch ((status || '').toUpperCase()) {
    case 'SCHEDULED':
    case 'TIMED':
      return {status: 'upcoming'}
    case 'IN_PLAY':
      return {status: 'live', statusLabel: 'LIVE'}
    case 'PAUSED':
      return {status: 'live', statusLabel: 'HT'}
    case 'FINISHED':
    case 'AWARDED': {
      const d = (duration || '').toUpperCase()
      const label =
        d === 'PENALTY_SHOOTOUT' ? 'PEN' : d === 'EXTRA_TIME' ? 'AET' : 'FT'
      return {status: 'finished', statusLabel: label}
    }
    // POSTPONED / SUSPENDED / CANCELLED: drop from the rail.
    default:
      return null
  }
}

function titleCase(code: string): string {
  // Split on underscores and whitespace so both "GROUP_A" and "Group A" work.
  return code
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}

export function stageLabel(
  stage?: string | null,
  group?: string | null,
): string | undefined {
  if (group) return titleCase(group) // "GROUP_A" -> "Group A"
  switch ((stage || '').toUpperCase()) {
    case 'LAST_16':
      return 'Round of 16'
    case 'QUARTER_FINALS':
      return 'Quarter-final'
    case 'SEMI_FINALS':
      return 'Semi-final'
    case 'THIRD_PLACE':
      return 'Third place'
    case 'FINAL':
      return 'Final'
    case 'GROUP_STAGE':
    case 'REGULAR_SEASON':
    case '':
      return undefined
    default:
      return titleCase(stage || '')
  }
}

export function normalizeMatch(match: RawMatch): SportsMatch | null {
  const home = match.homeTeam
  const away = match.awayTeam
  if (!home?.name || !away?.name || !match.utcDate) return null

  const mapped = mapStatus(match.status, match.score?.duration)
  if (!mapped) return null

  const {status, statusLabel} = mapped
  const started = status === 'live' || status === 'finished'
  const ft = match.score?.fullTime

  return {
    id: match.id,
    startingAt: match.utcDate,
    status,
    statusLabel,
    competition: match.competition?.name ?? undefined,
    stageLabel: stageLabel(match.stage, match.group),
    home: {
      name: home.name,
      crest: home.crest ?? undefined,
      score: started && typeof ft?.home === 'number' ? ft.home : undefined,
    },
    away: {
      name: away.name,
      crest: away.crest ?? undefined,
      score: started && typeof ft?.away === 'number' ? ft.away : undefined,
    },
  }
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {Accept: 'application/json'}
  // Proxy mode injects the token; only send it in direct mode.
  if (FOOTBALLDATA_TOKEN) {
    headers['X-Auth-Token'] = FOOTBALLDATA_TOKEN
  }
  return headers
}

async function fetchCompetition(
  code: string,
  signal?: AbortSignal,
): Promise<RawMatch[]> {
  const url = `${FOOTBALLDATA_API_URL}/competitions/${code}/matches`
  const res = await fetch(url, {headers: authHeaders(), signal})
  if (!res.ok) {
    throw new Error(`football-data request failed with status ${res.status}`)
  }
  const json: RawMatchesResponse = await res.json()
  return json.matches ?? []
}

export async function fetchFootballDataFixtures({
  from,
  to,
  signal,
}: FetchFixturesArgs): Promise<SportsMatch[]> {
  // One call per competition returns the full season schedule, sidestepping the
  // free tier's date-range limits. We window client-side instead.
  const perCompetition = await Promise.all(
    SPORTS_COMPETITION_CODES.map(code => fetchCompetition(code, signal)),
  )

  const matches = perCompetition
    .flat()
    .map(normalizeMatch)
    .filter((m): m is SportsMatch => m !== null)
    .filter(m => withinWindow(m, from, to))

  // Chronological so the widget can bucket by day (yesterday -> today).
  matches.sort((a, b) => a.startingAt.localeCompare(b.startingAt))
  return matches.slice(0, MAX_MATCHES)
}

/* Standings */

type RawStandingRow = {
  position?: number
  team?: RawTeam | null
  playedGames?: number
  won?: number
  draw?: number
  lost?: number
  goalDifference?: number
  points?: number
}

type RawStandingsResponse = {
  standings?: {
    type?: string | null
    group?: string | null
    table?: RawStandingRow[]
  }[]
}

function normalizeStandingRow(
  row: RawStandingRow,
  group?: string | null,
): StandingRow | null {
  if (!row.team?.name || typeof row.position !== 'number') return null
  return {
    position: row.position,
    team: {
      name: row.team.name,
      crest: row.team.crest ?? undefined,
    },
    played: row.playedGames ?? 0,
    won: row.won ?? 0,
    draw: row.draw ?? 0,
    lost: row.lost ?? 0,
    goalDifference: row.goalDifference ?? 0,
    points: row.points ?? 0,
    group: group ? titleCase(group) : undefined,
  }
}

async function fetchCompetitionStandings(
  code: string,
  signal?: AbortSignal,
): Promise<StandingRow[]> {
  const url = `${FOOTBALLDATA_API_URL}/competitions/${code}/standings`
  const res = await fetch(url, {headers: authHeaders(), signal})
  if (!res.ok) {
    throw new Error(`football-data request failed with status ${res.status}`)
  }
  const json: RawStandingsResponse = await res.json()
  // TOTAL is the combined table; per-group entries carry a `group` label.
  return (json.standings ?? [])
    .filter(s => (s.type || 'TOTAL').toUpperCase() === 'TOTAL')
    .flatMap(s => (s.table ?? []).map(r => normalizeStandingRow(r, s.group)))
    .filter((r): r is StandingRow => r !== null)
}

export async function fetchFootballDataStandings({
  signal,
}: {
  signal?: AbortSignal
}): Promise<StandingRow[]> {
  const perCompetition = await Promise.all(
    SPORTS_COMPETITION_CODES.map(code =>
      fetchCompetitionStandings(code, signal),
    ),
  )
  return perCompetition.flat()
}
