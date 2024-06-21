import {requireNativeModule} from 'expo'

import {GooglePlayReferrerInfo} from './types'

export const NativeModule = requireNativeModule('ExpoBlueskyReferrer')

export function getGooglePlayReferrerInfoAsync(): Promise<GooglePlayReferrerInfo> {
  return NativeModule.getGooglePlayReferrerInfoAsync()
}
