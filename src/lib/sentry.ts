/**
 * Importing these separately from `platform/detection` and `lib/app-info` to
 * avoid future conflicts and/or circular deps
 */

import {Platform} from 'react-native'
import {nativeApplicationVersion} from 'expo-application'
import {isEmbeddedLaunch} from 'expo-updates'
import * as Sentry from '@sentry/react-native'

import {BUILD_ENV, BUNDLE_IDENTIFIER, IS_TESTFLIGHT} from 'lib/app-info'

/**
 * Examples:
 * - `dev`
 * - `1.57.0`
 */
const release = nativeApplicationVersion ?? 'dev'

/**
 * Examples:
 * - web.e93024c8
 * - web.dev
 * - ios.e93024c8
 * - ios.dev
 * - android.e93024c8
 * - android.dev
 */
const dist = `${Platform.OS}.${BUNDLE_IDENTIFIER ?? 'dev'}`

Sentry.init({
  autoSessionTracking: false,
  dsn: 'https://05bc3789bf994b81bd7ce20c86ccd3ae@o4505071687041024.ingest.sentry.io/4505071690514432',
  debug: false, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
  environment: BUILD_ENV ?? 'development',
  dist,
  release,
  tracesSampleRate: 0.25,
})

Sentry.configureScope(scope => {
  scope.setTag('updates-channel', IS_TESTFLIGHT ? 'testflight' : 'production')
  scope.setTag('updates-is-embedded', isEmbeddedLaunch)
  scope.setTag('updates-identifier', BUNDLE_IDENTIFIER)
})
