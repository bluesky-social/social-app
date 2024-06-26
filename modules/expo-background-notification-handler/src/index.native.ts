import {requireNativeModule} from 'expo'

import {BackgroundNotificationHandlerPreferences} from './ExpoBackgroundNotificationHandler.types'

const NativeModule = requireNativeModule('ExpoBackgroundNotificationHandler')

export function resetGenericCountAsync(): Promise<void> {
  NativeModule.resetGenericCountAsync()
}

export function maybeIncrementMessagesCountAsync(
  convoId: string,
): Promise<boolean> {
  NativeModule.incrementMessagesCountAsync(convoId)
}

export function maybeDecrementMessagesCountAsync(
  convoId: string,
): Promise<boolean> {
  NativeModule.decrementMessagesCountAsync(convoId)
}

export function getPrefsAsync(): Promise<BackgroundNotificationHandlerPreferences> {
  return NativeModule.getPrefsAsync()
}
