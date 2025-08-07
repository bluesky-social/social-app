import {requireNativeModule} from 'expo'

import {GooglePlayReferrerInfo, ReferrerInfo} from './types'

export const NativeModule = requireNativeModule('ExpoGanderReferrer')

export function getGooglePlayReferrerInfoAsync(): Promise<GooglePlayReferrerInfo | null> {
  return NativeModule.getGooglePlayReferrerInfoAsync()
}

export function getReferrerInfo(): Promise<ReferrerInfo | null> {
  return NativeModule.getReferrerInfo()
}
