import {SharedPrefs} from '../../index'
import {NotImplementedError} from '../NotImplemented'
import {GooglePlayReferrerInfo, ReferrerInfo} from './types'

export function getGooglePlayReferrerInfoAsync(): Promise<GooglePlayReferrerInfo> {
  throw new NotImplementedError()
}

export function getReferrerInfo(): ReferrerInfo | null {
  const referrer = SharedPrefs.getString('referrer')
  if (referrer) {
    SharedPrefs.removeValue('referrer')
    try {
      const url = new URL(referrer)
      return {
        referrer,
        hostname: url.hostname,
      }
    } catch (e) {
      return {
        referrer,
        hostname: referrer,
      }
    }
  }

  const referrerApp = SharedPrefs.getString('referrerApp')
  if (referrerApp) {
    SharedPrefs.removeValue('referrerApp')
    return {
      referrer: referrerApp,
      hostname: referrerApp,
    }
  }

  return null
}
