import {getGlobalScope, init} from '@sentry/react-native'

import * as env from '#/env'

init({
  enabled: !env.IS_DEV && !!env.SENTRY_DSN,
  enableAutoSessionTracking: false,
  dsn: env.SENTRY_DSN,
  debug: false, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
  environment: env.ENV,
  dist: env.BUNDLE_IDENTIFIER,
  release: env.RELEASE_VERSION,
  ignoreErrors: [
    /*
     * Unknown internals errors
     */
    `t is not defined`,
    `Can't find variable: t`,
    /*
     * Un-useful errors
     */
    `Network request failed`,
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
