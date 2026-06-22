/**
 * Provider-agnostic types for the live sports widget. Each data provider (see
 * ./providers/) normalizes its own API response into `SportsMatch`, so the
 * components and queries never depend on a specific provider's shape.
 */

export type MatchStatus = 'upcoming' | 'live' | 'finished' | 'other'

export type MatchTeam = {
  name: string
  crest?: string
  /** Goals scored, when the match has started. */
  score?: number
}

export type SportsMatch = {
  id: number
  /** ISO 8601 kickoff timestamp (UTC). */
  startingAt: string
  status: MatchStatus
  /** Short label for the live/finished state, e.g. "HT", "FT", "1st". */
  statusLabel?: string
  /** Competition name, e.g. "Premier League". */
  competition?: string
  /** Where in the competition this match sits, e.g. "Group A", "Round of 16". */
  stageLabel?: string
  home: MatchTeam
  away: MatchTeam
}

export type FetchFixturesArgs = {
  from: Date
  to: Date
  signal?: AbortSignal
}

export type StandingRow = {
  position: number
  team: MatchTeam
  played: number
  won: number
  draw: number
  lost: number
  goalDifference: number
  points: number
  /** Group/section this row belongs to, for grouped competitions (World Cup). */
  group?: string
}
