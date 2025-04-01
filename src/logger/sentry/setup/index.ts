/**
 * Importing these separately from `platform/detection` and `lib/app-info` to
 * avoid future conflicts and/or circular deps
 */

import {init} from '@sentry/react-native'

import {version} from '#/../package.json'

/**
 * Examples:
 * - `dev`
 * - `1.99.0`
 */
const release = process.env.SENTRY_RELEASE || version

/**
 * The latest deployed commit hash
 */
const dist = process.env.SENTRY_DIST || 'dev'

init({
  enabled: !__DEV__,
  autoSessionTracking: false,
  dsn: process.env.SENTRY_DSN,
  debug: false, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
  environment: process.env.NODE_ENV,
  dist,
  release,
  ignoreErrors: [`t is not defined`, `Can't find variable: t`],
})
