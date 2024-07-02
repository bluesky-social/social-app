import {NotImplementedError} from './NotImplemented'
import {BackgroundNotificationHandlerPreferences} from './types'

export function resetGenericCountAsync(): Promise<void> {
  throw new NotImplementedError()
}

export function maybeIncrementMessagesCountAsync(
  convoId: string,
): Promise<boolean> {
  throw new NotImplementedError({convoId})
}

export function maybeDecrementMessagesCountAsync(
  convoId: string,
): Promise<boolean> {
  throw new NotImplementedError({convoId})
}

export function getPrefsAsync(): Promise<BackgroundNotificationHandlerPreferences | null> {
  throw new NotImplementedError()
}
