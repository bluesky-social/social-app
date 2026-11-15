import {Platform} from 'react-native'

import {NotImplementedError} from '../NotImplemented'
import {type GooglePlayReferrerInfo, type ReferrerInfo} from './types'

export function getGooglePlayReferrerInfoAsync(): Promise<GooglePlayReferrerInfo> {
  throw new NotImplementedError()
}

/*
 * Promise-returning for parity with Android, whose native referrer API only
 * exposes a promise.
 */
export function getReferrerInfo(): Promise<ReferrerInfo | null> {
  return Promise.resolve(getReferrerInfoSync())
}

function getReferrerInfoSync(): ReferrerInfo | null {
  if (
    Platform.OS === 'web' &&
    // for ssr
    typeof document !== 'undefined' &&
    document != null &&
    document.referrer
  ) {
    try {
      const url = new URL(document.referrer)
      if (url.hostname !== 'bsky.app') {
        return {
          referrer: url.href,
          hostname: url.hostname,
        }
      }
    } catch {
      // If something happens to the URL parsing, we don't want to actually cause any problems for the user. Just
      // log the error so we might catch it
      console.error('Failed to parse referrer URL')
    }
  }
  return null
}
