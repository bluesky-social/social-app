import {isWeb} from 'platform/detection'
import {ExpoGetReferrerModule} from './ExpoGetReferrer.types'

export const GetReferrerModule: ExpoGetReferrerModule = {
  getGooglePlayReferrerInfoAsync: async () => {
    console.error('getReferrerInfoAsync is only available on Android')
    throw new Error('getGooglePlayReferrerInfo is only available on Android')
  },
  getReferrerInfoAsync: async () => {
    try {
      if (
        isWeb &&
        typeof document !== 'undefined' &&
        document != null &&
        document.referrer
      ) {
        const url = new URL(document.referrer)
        if (url.hostname !== 'bsky.app') {
          return {
            referrer: url.href,
            hostname: url.hostname,
          }
        }
      }
    } catch {
      return null
    }
    return null
  },
}
