import {NotImplementedError} from '../NotImplemented'
import {GooglePlayReferrerInfo, ReferrerInfo} from './types'

export function getGooglePlayReferrerInfoAsync(): Promise<GooglePlayReferrerInfo> {
  throw new NotImplementedError()
}

export function getReferrerInfo(): ReferrerInfo | null {
  throw new NotImplementedError()
}
