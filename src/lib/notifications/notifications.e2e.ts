export function useNotificationsRegistration() {}

export function useRequestNotificationsPermission() {
  return async (
    _context: 'StartOnboarding' | 'AfterOnboarding' | 'Login' | 'Home',
  ) => {}
}

export async function decrementBadgeCount(_by: number) {}

export async function resetBadgeCount() {}
