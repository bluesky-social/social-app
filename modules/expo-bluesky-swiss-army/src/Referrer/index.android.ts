import {requireNativeModule} from 'expo'

import {GooglePlayReferrerInfo, ReferrerInfo} from './types'

export const NativeModule = requireNativeModule('ExpoBlueskyReferrer')

export function getGooglePlayReferrerInfoAsync(): Promise<GooglePlayReferrerInfo | null> {
  return NativeModule.getGooglePlayReferrerInfoAsync()
}

export function getReferrerInfoAsync(): Promise<ReferrerInfo | null> {
  return NativeModule.getReferrerInfoAsync()
}
