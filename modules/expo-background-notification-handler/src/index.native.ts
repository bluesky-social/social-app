import {requireNativeModule} from 'expo'

import {BackgroundNotificationHandlerPreferences} from './ExpoBackgroundNotificationHandler.types'

const NativeModule = requireNativeModule('ExpoBackgroundNotificationHandler')

export function resetGenericCountAsync(count: number): Promise<void> {
  NativeModule.resetGenericCountAsync(count)
}

export function incrementMessagesCountAsync(
  count: number,
  convoId: string,
): Promise<void> {
  NativeModule.incrementMessagesCountAsync(count, convoId)
}

export function decrementMessagesCountAsync(
  count: number,
  convoId: string,
): Promise<void> {
  NativeModule.decrementMessagesCountAsync(count, convoId)
}

export function getPrefsAsync(): Promise<BackgroundNotificationHandlerPreferences> {
  return NativeModule.getPrefsAsync()
}
