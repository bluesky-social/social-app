/**
 * Importing these separately from `platform/detection` and `lib/app-info` to
 * avoid future conflicts and/or circular deps
 */

import {Platform} from 'react-native'
import {init} from '@sentry/react-native'

import {appVersion,IS_TESTFLIGHT} from '#/lib/app-info'

/**
 * Examples:
 * - `dev`
 * - `1.99.0`
 */
const release = appVersion ?? 'dev'

/**
 * Examples:
 * - `web.dev`
 * - `ios.dev`
 * - `android.dev`
 * - `web.1.99.0`
 * - `ios.1.99.0`
 * - `android.1.99.0`
 */
const dist = `${Platform.OS}.${appVersion}${IS_TESTFLIGHT ? '.tf' : ''}${
  __DEV__ ? '.dev' : ''
}`

init({
  enabled: !__DEV__,
  autoSessionTracking: false,
  dsn: 'https://8fb55ba4807fca137eedfc8403ee27ba@o4505071687041024.ingest.us.sentry.io/4508807082278912',
  debug: false, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
  environment: process.env.NODE_ENV,
  dist,
  release,
  ignoreErrors: [`t is not defined`, `Can't find variable: t`],
})
