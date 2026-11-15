import {requireNativeModule} from 'expo'

import {type GooglePlayReferrerInfo, type ReferrerInfo} from './types'

export const NativeModule = requireNativeModule('ExpoBlueskyReferrer')

export function getGooglePlayReferrerInfoAsync(): Promise<GooglePlayReferrerInfo | null> {
  return NativeModule.getGooglePlayReferrerInfoAsync()
}

export function getReferrerInfo(): Promise<ReferrerInfo | null> {
  return NativeModule.getReferrerInfo()
}
