import {
  type MatchStatus,
  type SportsMatch,
  type StandingRow,
} from '#/features/liveSports/types'

const STATUS_ORDER: Record<MatchStatus, number> = {
  live: 0,
  finished: 1,
  upcoming: 2,
  other: 3,
}

/**
 * Live matches first, then the most recent results, then upcoming kickoffs.
 * Shared across providers. Mutates and returns the array.
 */
export function sortMatches(matches: SportsMatch[]): SportsMatch[] {
  return matches.sort((a, b) => {
    const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    if (byStatus !== 0) return byStatus
    // Finished: most recent first. Live and upcoming: soonest first.
    if (a.status === 'finished') return b.startingAt.localeCompare(a.startingAt)
    return a.startingAt.localeCompare(b.startingAt)
  })
}

/** Keep a match only if its kickoff falls within [from, to]. */
export function withinWindow(
  match: SportsMatch,
  from: Date,
  to: Date,
): boolean {
  const t = new Date(match.startingAt).getTime()
  return t >= from.getTime() && t <= to.getTime()
}

/** Local-time YYYY-MM-DD key, so day filtering matches the viewer's calendar. */
export function toLocalDayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Flatten standings into a single leaderboard ranked by points, then goal
 * difference, then wins. Returns the top `limit`.
 */
export function topStandings(
  rows: StandingRow[],
  limit: number,
): StandingRow[] {
  return [...rows]
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.won - a.won,
    )
    .slice(0, limit)
}

/**
 * Split standings into sections by group, each ordered by table position.
 * Groups are returned in name order. Used for tournament group stages.
 */
export function groupStandings(
  rows: StandingRow[],
): {group: string; rows: StandingRow[]}[] {
  const byGroup = new Map<string, StandingRow[]>()
  for (const row of rows) {
    const key = row.group ?? ''
    const bucket = byGroup.get(key)
    if (bucket) bucket.push(row)
    else byGroup.set(key, [row])
  }
  return [...byGroup.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([group, groupRows]) => ({
      group,
      rows: [...groupRows].sort((a, b) => a.position - b.position),
    }))
}
