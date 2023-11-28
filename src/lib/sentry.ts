/**
 * Importing these separately from `platform/detection` and `lib/app-info` to
 * avoid future conflicts and/or circular deps
 */

import {Platform} from 'react-native'
import app from 'react-native-version-number'
import * as info from 'expo-updates'
import {init} from 'sentry-expo'

/**
 * Matches the build profile `channel` props in `eas.json`
 */
const buildChannel = (info.channel || 'development') as
  | 'development'
  | 'preview'
  | 'production'

/**
 * Examples:
 * - `ios@1.57.0(3)`
 * - `android@1.57.0(46)`
 */
const appVersion = `${Platform.OS}@${app.appVersion}(${app.buildVersion})`

init({
  dsn: 'https://05bc3789bf994b81bd7ce20c86ccd3ae@o4505071687041024.ingest.sentry.io/4505071690514432',
  debug: false, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
  enableInExpoDevelopment: true,
  environment: buildChannel,
  dist: appVersion,
})
