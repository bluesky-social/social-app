import {NotImplementedError} from './NotImplemented'
import {BackgroundNotificationHandlerPreferences} from './types'

export function resetGenericCountAsync(count: number): Promise<void> {
  throw new NotImplementedError({count})
}

export function incrementMessagesCountAsync(
  count: number,
  convoId: string,
): Promise<void> {
  throw new NotImplementedError({count, convoId})
}

export function decrementMessagesCountAsync(
  count: number,
  convoId: string,
): Promise<void> {
  throw new NotImplementedError({count, convoId})
}

export function getPrefsAsync(): Promise<BackgroundNotificationHandlerPreferences | null> {
  throw new NotImplementedError()
}
