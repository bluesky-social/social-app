import {requireNativeModule} from 'expo-modules-core'

import {ExpoGooglePlayReferrerModule} from './ExpoGooglePlayReferrer.types'

export const BackgroundNotificationHandler =
  requireNativeModule<ExpoGooglePlayReferrerModule>('ExpoGooglePlayReferrer')
