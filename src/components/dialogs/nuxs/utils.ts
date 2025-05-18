const ONE_DAY = 1000 * 60 * 60 * 24

export function isDaysOld(days: number, createdAt?: string) {
  /*
   * Should never happen because we gate NUXs to only accounts with a valid
   * profile and a `createdAt` (see `nuxs/index.tsx`). But if it ever did, the
   * account is either old enough to be pre-onboarding, or some failure happened
   * during account creation. Fail closed. - esb
   */
  if (!createdAt) return false

  const now = Date.now()
  const then = new Date(createdAt).getTime()
  const isOldEnough = then + ONE_DAY * days < now

  if (isOldEnough) return true
  return false
}
