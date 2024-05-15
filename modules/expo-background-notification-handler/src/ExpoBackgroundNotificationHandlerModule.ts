import {requireNativeModule} from 'expo-modules-core'

import {ExpoBackgroundNotificationHandlerModule} from './ExpoBackgroundNotificationHandler.types'

export const BackgroundNotificationHandler =
  requireNativeModule<ExpoBackgroundNotificationHandlerModule>(
    'ExpoBackgroundNotificationHandler',
  )
