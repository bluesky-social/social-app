/**
 * Live sports widget configuration.
 *
 * football-data.org requires an X-Auth-Token header. Sending it from the client
 * exposes it, so production should point FOOTBALLDATA_API_URL at the proxy in
 * services/footballData/, which injects the token server-side. Direct mode sends
 * FOOTBALLDATA_TOKEN from the client and is fine for local dev.
 */

const FOOTBALLDATA_DIRECT_URL = 'https://api.football-data.org/v4'

function csv(value: string | undefined): string[] {
  return (value || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

/** football-data.org API token, used only in direct mode. */
export const FOOTBALLDATA_TOKEN =
  process.env.EXPO_PUBLIC_FOOTBALLDATA_TOKEN || ''

/** Base URL for football-data.org, or a first-party proxy in front of it. */
export const FOOTBALLDATA_API_URL =
  process.env.EXPO_PUBLIC_FOOTBALLDATA_API_URL || FOOTBALLDATA_DIRECT_URL

/** Comma-separated football-data.org competition codes. Defaults to the World Cup. */
export const SPORTS_COMPETITION_CODES = csv(
  process.env.EXPO_PUBLIC_SPORTS_COMPETITION_CODES || 'WC',
)

/** Module title override. When unset, the widget uses a localized default. */
export const SPORTS_TITLE_OVERRIDE =
  process.env.EXPO_PUBLIC_SPORTS_TITLE || undefined

/*
 * The remaining values are intentionally module constants rather than env vars:
 * they tune presentation, not deployment identity, so they don't need to vary
 * between builds. Edit them here if a deployment ever needs different behavior.
 */

/** Stable key identifying the configured competitions (for query keys). */
export const SPORTS_COMPETITIONS_KEY = SPORTS_COMPETITION_CODES.join(',')

/** True when more than one competition is configured. */
export const SPORTS_MULTI_COMPETITION = SPORTS_COMPETITION_CODES.length > 1

const usingProxy = FOOTBALLDATA_API_URL !== FOOTBALLDATA_DIRECT_URL

/**
 * Whether the widget should render. Requires a data source and respects an
 * explicit kill switch (EXPO_PUBLIC_ENABLE_SPORTS=false).
 */
export const SPORTS_ENABLED =
  process.env.EXPO_PUBLIC_ENABLE_SPORTS !== 'false' &&
  SPORTS_COMPETITION_CODES.length > 0 &&
  (!!FOOTBALLDATA_TOKEN || usingProxy)

/** Days back the rail keeps showing finished fixtures. */
export const FIXTURE_LOOKBACK_DAYS = 1

/** Cap on matches kept from the fetch window, with headroom over what's shown. */
export const MAX_MATCHES = 60

/** Number of rows to show in the expandable standings leaderboard. */
export const STANDINGS_LIMIT = 10

/**
 * Dev-only: render the most recent match as live, so the live card styling can
 * be designed when nothing is in play. Gated on __DEV__ so it can't ship on.
 */
export const SPORTS_PREVIEW_LIVE =
  __DEV__ && process.env.EXPO_PUBLIC_SPORTS_PREVIEW_LIVE === 'true'

/**
 * Draws a qualification line in grouped standings after this many rows. Off by
 * default because the data source has no qualification status, so any line is a
 * fixed guess. Set to 2 for a "top two advance" marker.
 */
export const SPORTS_GROUP_ADVANCE = 0
