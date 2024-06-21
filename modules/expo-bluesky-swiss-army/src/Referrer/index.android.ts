import {requireNativeModule} from 'expo'

import {GooglePlayReferrerInfo} from './types'

export const NativeModule = requireNativeModule('ExpoGooglePlayReferrer')

export function getGooglePlayReferrerInfoAsync(): Promise<GooglePlayReferrerInfo> {
  return NativeModule.getGooglePlayReferrerInfoAsync()
}
