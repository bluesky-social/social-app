import {useCallback} from 'react'

export function useNotificationsRegistration() {}

export function useRequestNotificationsPermission() {
  return async (
    _context: 'StartOnboarding' | 'AfterOnboarding' | 'Login' | 'Home',
  ) => {}
}

export function useGetAndRegisterPushToken() {
  return useCallback(async ({}: {} = {}) => {}, [])
}

export async function decrementBadgeCount(_by: number) {}

export async function resetBadgeCount() {}
