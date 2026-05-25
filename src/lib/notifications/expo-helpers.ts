// Thin wrapper around expo-notifications APIs called outside the dedicated
// notifications hooks. The .web.ts variant stubs these out so we don't pull
// expo-notifications into the web bundle.
import * as Notifications from 'expo-notifications'

export function getLastNotificationResponse() {
  return Notifications.getLastNotificationResponse()
}

export function clearLastNotificationResponse() {
  return Notifications.clearLastNotificationResponse()
}

export function getPermissionsAsync() {
  return Notifications.getPermissionsAsync()
}

export function requestPermissionsAsync() {
  return Notifications.requestPermissionsAsync()
}

export type NotificationPermissionsStatus =
  Notifications.NotificationPermissionsStatus
