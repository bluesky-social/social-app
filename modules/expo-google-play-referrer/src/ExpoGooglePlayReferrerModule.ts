import {
  ExpoGooglePlayReferrerModule,
  GooglePlayReferrerInfo,
} from './ExpoGooglePlayReferrer.types'

export const GooglePlayReferrerModule = {
  getReferrerInfoAsync(): Promise<GooglePlayReferrerInfo | null> {
    console.error('getReferrerInfoAsync is only available on Android')
    return Promise.resolve(null)
  },
} as ExpoGooglePlayReferrerModule
