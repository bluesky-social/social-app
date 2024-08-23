import {Platform} from 'react-native'

import {NotImplementedError} from '../NotImplemented'
import {GooglePlayReferrerInfo, ReferrerInfo} from './types'

export function getGooglePlayReferrerInfoAsync(): Promise<GooglePlayReferrerInfo> {
  throw new NotImplementedError()
}

export function getReferrerInfo(): ReferrerInfo | null {
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
