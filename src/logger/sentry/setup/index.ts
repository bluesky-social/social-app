import {
  getGlobalScope,
  init,
  reactNativeTracingIntegration,
} from '@sentry/react-native'

import {featureFlagsIntegration} from '#/logger/sentry/featureFlags'
import {dropExpectedNetworkErrors} from '#/logger/sentry/network-errors'
import * as env from '#/env'

init({
  enabled: !env.IS_DEV && !!env.SENTRY_DSN,
  enableAutoSessionTracking: false,
  enableTombstone: true,
  dsn: env.SENTRY_DSN,
  sendDefaultPii: true,
  debug: false, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
  environment: env.ENV,
  dist: env.BUNDLE_IDENTIFIER,
  release: env.SENTRY_RELEASE,
  beforeSend: dropExpectedNetworkErrors,
  integrations: [
    featureFlagsIntegration,
    /*
     * Setting tracesSampleRate adds this integration by default, which wraps
     * every XHR/fetch in a span. Our only spans are the manual video ones,
     * which are inactive, so request spans almost never have a parent and get
     * discarded on device (millions a day as no_parent_span) after the work
     * of creating them. Overriding it by name keeps the rest of the
     * integration but skips request instrumentation.
     */
    reactNativeTracingIntegration({traceFetch: false, traceXHR: false}),
  ],
  /*
   * On native the SDK defaults this to match every URL, which adds
   * sentry-trace and baggage headers (release, environment, public key) to
   * requests to every host, including third-party PDSes and CDNs. None of our
   * backends read them, so propagate to nothing.
   */
  tracePropagationTargets: [],
  ignoreErrors: [
    /*
     * Unknown internals errors
     */
    `t is not defined`,
    `Can't find variable: t`,
  ],
  /**
   * Does not affect traces of error events or other logs, just disables
   * automatically attaching stack traces to events. This helps us group events
   * and prevents explosions of separate issues.
   *
   * @see https://docs.sentry.io/platforms/react-native/configuration/options/#attach-stacktrace
   */
  attachStacktrace: false,
  sampleRate: env.IS_INTERNAL ? 1.0 : 0.1,
  /**
   * Sample rate for performance spans (video playback, video upload). Setting
   * this also enables the SDK's default stall and slow/frozen frame tracking,
   * whose measurements attach to every root span.
   */
  tracesSampleRate: env.IS_INTERNAL ? 1.0 : 0.01,
})

/*
 * Events already carry react_native_context.fabric, but a tag is easier to
 * filter and dashboard on. Detection matches the SDK's own isFabricEnabled.
 */
getGlobalScope().setTag(
  'new_arch',
  (global as {nativeFabricUIManager?: unknown}).nativeFabricUIManager != null,
)
