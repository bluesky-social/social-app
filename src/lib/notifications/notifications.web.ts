// Web shim for #/lib/notifications/notifications. expo-notifications doesn't
// run on web, so all of these are no-ops; the corresponding native callers
// are gated by IS_NATIVE / Platform.OS, so on web they're never invoked.
//
// Keeping this file expo-notifications-free saves ~70KB on web.
import {type AtpAgent} from '@atproto/api'

export function useRegisterPushToken() {
  return () => {}
}

export function useGetAndRegisterPushToken() {
  return async () => undefined
}

export function useNotificationsRegistration() {}

export function useRequestNotificationsPermission() {
  return async (
    _context: 'StartOnboarding' | 'AfterOnboarding' | 'Login' | 'Home',
  ) => {}
}

export async function decrementBadgeCount(_by: number) {}

export async function resetBadgeCount() {}

export async function unregisterPushToken(_agents: AtpAgent[]) {}
