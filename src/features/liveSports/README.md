# Live sports widget

A horizontally-scrolling rail of match cards plus an expandable standings table,
rendered in the Discover (Explore) tab. It draws ALF-themed UI from the
football-data.org API, so it matches the app on every platform with no WebView.

Configure one tournament or a set of leagues via competition codes; the same
widget is reused across events. football-data.org's free tier covers the World
Cup with delayed scores. Get a token at
https://www.football-data.org/client/register.

## Layout

- `config.ts` - env vars plus presentation constants.
- `providers/footballData.ts` - fetch and normalize into the `types.ts` shapes.
- `queries.ts` - `useSportsFixturesQuery` and `useSportsStandingsQuery`.
- `parse.ts` - sort, window, and top-N helpers.
- `types.ts` - the normalized `SportsMatch` and `StandingRow` shapes.
- `components/` - the Explore module, match card, and standings table.

Wired into `Explore.tsx` as a `liveSportsWidget` item. The widget renders `null`
when disabled or empty, so it is always safe to include.

## Cards

Each card shows both teams, crests, and a state:

- upcoming: kickoff time.
- live: a LIVE/HT pill and the running score.
- finished: an FT/AET/PEN pill and the final score, winner bold.

A top-right line shows the stage, plus the competition name when several are
configured.

## Standings

A "Standings" toggle reveals a leaderboard, fetched lazily when expanded.
Grouped tournaments show one table per group; a plain league shows a single
top-N table.

## Configuration

| Var                                    | Purpose                            |
| -------------------------------------- | ---------------------------------- |
| `EXPO_PUBLIC_FOOTBALLDATA_TOKEN`       | API token (direct mode only)       |
| `EXPO_PUBLIC_FOOTBALLDATA_API_URL`     | base URL or first-party proxy      |
| `EXPO_PUBLIC_SPORTS_COMPETITION_CODES` | comma-separated codes (default WC) |
| `EXPO_PUBLIC_SPORTS_TITLE`             | module title override              |
| `EXPO_PUBLIC_ENABLE_SPORTS`            | kill switch (`false` to force off) |

Presentation constants (lookback, row count, group line) live at the bottom of
`config.ts`.

football-data.org needs an `X-Auth-Token` header. In dev, send it from the
client via `EXPO_PUBLIC_FOOTBALLDATA_TOKEN`. In production, point
`EXPO_PUBLIC_FOOTBALLDATA_API_URL` at the `football-data-worker/` proxy, which
holds the token server-side. The widget renders only with a token or proxy URL.
