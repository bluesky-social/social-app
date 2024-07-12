import {Platform} from 'react-native'

import {NotImplementedError} from '../NotImplemented'
import {GooglePlayReferrerInfo, ReferrerInfo} from './types'

export function getGooglePlayReferrerInfoAsync(): Promise<GooglePlayReferrerInfo> {
  throw new NotImplementedError()
}

export function getReferrerInfoAsync(): Promise<ReferrerInfo | null> {
  // Returning a promise to match the functionality on native
  return new Promise(resolve => {
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
          resolve({
            referrer: url.href,
            hostname: url.hostname,
          })
        }
      } catch {
        // If something happens to the URL parsing, we don't want to actually cause any problems for the user. Just
        // log the error so we might catch it
        console.error('Failed to parse referrer URL')
      }
    }
    resolve(null)
  })
}
