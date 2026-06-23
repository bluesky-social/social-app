import {
  init as plausibleInit,
  track as plausibleTrack,
} from '@plausible-analytics/tracker'

import {Logger} from '#/logger'
import {
  buildProps,
  logEventToConsole,
  type PlausibleClient,
} from '#/analytics/plausible/shared'
import * as env from '#/env'

const logger = Logger.create(Logger.Context.Metric)

let initialized = false

export const plausible: PlausibleClient = {
  init() {
    if (initialized) return
    if (!env.PLAUSIBLE_DOMAIN) return
    try {
      plausibleInit({
        domain: env.PLAUSIBLE_DOMAIN,
        endpoint: `${env.PLAUSIBLE_API_HOST}/api/event`,
        // Use Plausible's standard history-based pageview auto-capture. On web
        // React Navigation updates the URL via the History API, so the library
        // records a pageview on every route change without us driving it.
        // By default Plausible drops events on localhost. Enable capture in dev
        // builds so the integration can be exercised locally; production builds
        // are never on localhost, so this has no effect there.
        captureOnLocalhost: __DEV__,
      })
      initialized = true
    } catch (e) {
      logger.warn('Plausible init failed', {
        safeMessage: e instanceof Error ? e.message : String(e),
      })
    }
  },

  track(event, payload, metadata) {
    const props = buildProps(payload, metadata)
    if (env.PLAUSIBLE_DEBUG) {
      logEventToConsole(event, props)
      return
    }
    if (!initialized) return
    try {
      plausibleTrack(event, {props})
    } catch {
      // best-effort; the primary metrics sink already captured this event
    }
  },
}
