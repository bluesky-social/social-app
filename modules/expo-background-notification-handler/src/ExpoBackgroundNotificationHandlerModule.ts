import {requireNativeModule} from 'expo-modules-core'

import {type ExpoBackgroundNotificationHandlerModule} from './ExpoBackgroundNotificationHandler.types'

export const BackgroundNotificationHandler =
  requireNativeModule<ExpoBackgroundNotificationHandlerModule>(
    'ExpoBackgroundNotificationHandler',
  )
