import {NotImplementedError} from '../NotImplemented'
import {type GooglePlayReferrerInfo, type ReferrerInfo} from './types'

export function getGooglePlayReferrerInfoAsync(): Promise<GooglePlayReferrerInfo> {
  throw new NotImplementedError()
}

export function getReferrerInfo(): Promise<ReferrerInfo | null> {
  throw new NotImplementedError()
}
