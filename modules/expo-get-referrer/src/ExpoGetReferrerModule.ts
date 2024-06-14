import {requireNativeModule} from 'expo-modules-core'

import {ExpoGetReferrerModule} from './ExpoGetReferrer.types'

const NativeModule =
  requireNativeModule<ExpoGetReferrerModule>('ExpoGetReferrer')

export const GetReferrerModule: ExpoGetReferrerModule = {
  getGooglePlayReferrerInfoAsync: NativeModule.getGooglePlayReferrerInfoAsync,
  getReferrerInfoAsync: NativeModule.getReferrerInfoAsync,
}
