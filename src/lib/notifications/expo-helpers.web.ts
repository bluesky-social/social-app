// Web stubs. None of these are called on web (callers gate via IS_NATIVE /
// IS_WEB), but the imports must resolve to keep expo-notifications out of the
// web bundle.

export function getLastNotificationResponse(): null {
  return null
}

export function clearLastNotificationResponse(): void {}

export type NotificationPermissionsStatus = {
  status: 'granted' | 'denied' | 'undetermined'
  granted: boolean
  canAskAgain: boolean
  expires: 'never' | number
}

const denied: NotificationPermissionsStatus = {
  status: 'denied',
  granted: false,
  canAskAgain: false,
  expires: 'never',
}

export async function getPermissionsAsync(): Promise<NotificationPermissionsStatus> {
  return denied
}

export async function requestPermissionsAsync(): Promise<NotificationPermissionsStatus> {
  return denied
}
