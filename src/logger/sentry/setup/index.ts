/**
 * Importing these separately from `platform/detection` and `lib/app-info` to
 * avoid future conflicts and/or circular deps
 */

import {Platform} from 'react-native'
import {nativeApplicationVersion, nativeBuildVersion} from 'expo-application'
import {init} from '@sentry/react-native'

import {IS_TESTFLIGHT} from '#/lib/app-info'

/**
 * Examples:
 * - `dev`
 * - `1.57.0`
 */
const release = nativeApplicationVersion ?? 'dev'

/**
 * Examples:
 * - `web.dev`
 * - `ios.dev`
 * - `android.dev`
 * - `web.1.57.0`
 * - `ios.1.57.0.3`
 * - `android.1.57.0.46`
 */
const dist = `${Platform.OS}.${nativeBuildVersion}.${
  IS_TESTFLIGHT ? 'tf' : ''
}${__DEV__ ? 'dev' : ''}`

init({
  enabled: !__DEV__,
  autoSessionTracking: false,
  dsn: 'https://05bc3789bf994b81bd7ce20c86ccd3ae@o4505071687041024.ingest.sentry.io/4505071690514432',
  debug: false, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
  environment: process.env.NODE_ENV,
  dist,
  release,
})
