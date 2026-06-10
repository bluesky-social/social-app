import {Platform} from 'react-native'

import {type Metadata} from '#/analytics/metadata'
import {type Metrics} from '#/analytics/metrics'
import * as env from '#/env'

/**
 * Platform-agnostic Plausible sink. The web and native implementations both
 * conform to this interface so the fan-out in `#/analytics` can call it without
 * knowing the platform. See `index.web.ts` (uses `@plausible-analytics/tracker`,
 * with pageviews auto-captured by the library) and `index.ts` (native, a no-op
 * for now).
 */
export interface PlausibleClient {
  /**
   * Initialize the sink. Safe to call when disabled (no domain configured) and
   * safe to call more than once. Must run before `track` does anything. On web
   * this sets up the tracker and enables history-based pageview auto-capture.
   */
  init(): void
  /**
   * Forward an allowlisted metric event to Plausible as a custom goal. The
   * payload is sanitized into low-cardinality string props first.
   */
  track(
    event: keyof Metrics,
    payload: Record<string, unknown>,
    metadata?: Partial<Metadata>,
  ): void
}

/**
 * Allowlist of high-level "goals" forwarded to Plausible. Plausible is built
 * for a small set of conversion goals, not the full ~250-event product stream,
 * so we deliberately forward only this curated subset. Everything else stays on
 * the primary MetricsClient sink only.
 *
 * Keep this list short and high-signal. Adding the full event stream would
 * blow past Plausible's goal model and make the dashboards unreadable.
 */
export const PLAUSIBLE_GOALS: ReadonlySet<keyof Metrics> = new Set<
  keyof Metrics
>([
  'account:create:success',
  'account:loggedIn',
  'signin:success',
  'onboarding:finished:nextPressed',
  'post:create',
  'thread:create',
  'profile:follow',
  'composer:open',
  'search:query',
  'starterPack:create',
  'verification:create',
  'chat:create',
])

/**
 * Payload keys that must never be forwarded to Plausible, either because they
 * identify a user/device/session or because they are high-cardinality values
 * (URIs, DIDs, handles) that would pollute Plausible's property breakdowns and
 * undermine its privacy model. Anything not on this list is still subject to
 * the primitive-only coercion in `buildProps`.
 */
const DENIED_PROP_KEYS: ReadonlySet<string> = new Set([
  'uri',
  'url',
  'authorDid',
  'followeeDid',
  'followerDid',
  'suggestedDid',
  'profileDid',
  'contextProfileDid',
  'userDid',
  'did',
  'deviceId',
  'sessionId',
  'feedUrl',
  'feedUri',
  'feedDescriptor',
  'starterPack',
  'starterPackUri',
  'starterPackCreator',
  'starterPackName',
  'subject',
  'recId',
  'handle',
  'domain',
])

/**
 * Plausible custom properties must be a flat `Record<string, string>`. This
 * coerces an event payload into safe, low-cardinality string props:
 * - drops identity / high-cardinality keys (see `DENIED_PROP_KEYS`)
 * - drops nullish values and any non-primitive (arrays/objects)
 * - coerces remaining primitives to strings
 * - merges in safe dimensions (platform, appVersion, countryCode)
 *
 * Identity fields like deviceId/sessionId/did are intentionally never sent;
 * Plausible's value is aggregate, privacy-first analytics.
 */
export function buildProps(
  payload: Record<string, unknown>,
  metadata?: Partial<Metadata>,
): Record<string, string> {
  const props: Record<string, string> = {
    platform: Platform.OS,
    appVersion: env.APP_VERSION,
  }

  const countryCode = metadata?.geolocation?.countryCode
  if (countryCode) {
    props.countryCode = countryCode
  }

  for (const [key, value] of Object.entries(payload)) {
    if (DENIED_PROP_KEYS.has(key)) continue
    // Coerce only primitives. Arrays/objects/nullish are dropped: they are not
    // meaningful as Plausible props.
    if (typeof value === 'string') {
      props[key] = value
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      props[key] = String(value)
    }
  }

  return props
}

/**
 * Debug helper used by both sinks when `PLAUSIBLE_DEBUG` is enabled. Prints the
 * event that would be sent to Plausible, with its sanitized props, and sends
 * nothing over the network. The `[plausible]` prefix makes it easy to filter in
 * the console.
 */
export function logEventToConsole(name: string, props: Record<string, string>) {
  console.info('[plausible]', name, props)
}
