/**
 * Importing these separately from `platform/detection` and `lib/app-info` to
 * avoid future conflicts and/or circular deps
 */

import {init} from '@sentry/react-native'

import pkgJson from '#/../package.json'

/**
 * Examples:
 * - `dev`
 * - `1.99.0`
 */
const release = process.env.SENTRY_RELEASE || pkgJson.version

/**
 * The latest deployed commit hash
 */
const dist = process.env.SENTRY_DIST || 'dev'

init({
  enabled: !__DEV__ && !!process.env.SENTRY_DSN,
  autoSessionTracking: false,
  dsn: process.env.SENTRY_DSN,
  debug: false, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
  environment: process.env.NODE_ENV,
  dist,
  release,
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
})
