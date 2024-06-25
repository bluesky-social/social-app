import {requireNativeModule} from 'expo'

import {NotImplementedError} from '../NotImplemented'
import {GooglePlayReferrerInfo, ReferrerInfo} from './types'

export const NativeModule = requireNativeModule('ExpoBlueskyReferrer')

export function getGooglePlayReferrerInfoAsync(): Promise<GooglePlayReferrerInfo> {
  throw new NotImplementedError()
}

export function getReferrerInfoAsync(): Promise<ReferrerInfo | null> {
  return NativeModule.getReferrerInfoAsync()
}
