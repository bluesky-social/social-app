import {NotImplementedError} from '../NotImplemented'
import {GooglePlayReferrerInfo} from './types'

// @ts-ignore throws
export function getGooglePlayReferrerInfoAsync(): Promise<GooglePlayReferrerInfo> {
  throw new NotImplementedError()
}
