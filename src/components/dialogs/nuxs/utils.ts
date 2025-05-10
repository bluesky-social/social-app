const ONE_DAY = 1000 * 60 * 60 * 24

export function isDaysOld(days: number, createdAt?: string) {
  /*
   * Should never happen, but if it does, the account is likely quite old
   */
  if (!createdAt) return true

  const now = Date.now()
  const then = new Date(createdAt).getTime()
  const isOldEnough = then + ONE_DAY * days < now

  if (isOldEnough) return true
  return false
}
