import {type PlausibleClient} from '#/analytics/plausible/shared'

/**
 * Native Plausible sink - disabled for now.
 *
 * Plausible is a web-analytics product and `@plausible-analytics/tracker` is
 * browser-only (it reads `location`, `document`, `ResizeObserver`, etc.), so it
 * cannot run on native. We previously posted goals to the Events API directly,
 * but for now native sends nothing to Plausible. The primary metrics pipeline
 * is unaffected and still captures everything on all platforms.
 *
 * To re-enable native, implement `track` here against the Events API:
 * https://plausible.io/docs/events-api
 */
export const plausible: PlausibleClient = {
  init() {},
  track() {},
}
