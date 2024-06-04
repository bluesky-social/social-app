import {
  ExpoGooglePlayReferrerModule,
  GooglePlayReferrerInfo,
} from './ExpoGooglePlayReferrer.types'

export const GooglePlayReferrerModule = {
  getReferrerInfoAsync(): Promise<GooglePlayReferrerInfo> {
    console.error('getReferrerInfoAsync is only available on Android')
    return Promise.reject('getReferrerInfoAsync is only available on Android')
  },
} as ExpoGooglePlayReferrerModule
