import {requireNativeModule} from 'expo-modules-core'

import {ExpoGetReferrerModule} from './ExpoGetReferrer.types'

const NativeModule =
  requireNativeModule<ExpoGetReferrerModule>('ExpoGetReferrer')

export const GetReferrerModule: ExpoGetReferrerModule = {
  getGooglePlayReferrerInfoAsync: async () => {
    console.error('getGooglePlayReferrerInfo is only available on Android')
    throw new Error('getGooglePlayReferrerInfo is only available on Android')
  },
  getReferrerInfoAsync: NativeModule.getReferrerInfoAsync,
}
