/** Optional fields sent by Ozone before the updated inbox Lexicons are published. */
export type AccountPreview = {handle?: string; profile?: unknown}
export type AccountEnforcement = {
  state: 'none' | 'suspended' | 'takendown'
  expiresAt?: string
}

export function getHasActiveStrikes(data: unknown): boolean | undefined {
  if (!data || typeof data !== 'object' || !('hasActiveStrikes' in data)) return
  return typeof data.hasActiveStrikes === 'boolean'
    ? data.hasActiveStrikes
    : undefined
}

export function getAccountPreview(data: unknown): AccountPreview | undefined {
  if (!data || typeof data !== 'object' || !('account' in data)) return
  const account = data.account
  if (!account || typeof account !== 'object') return
  return {
    handle:
      'handle' in account && typeof account.handle === 'string'
        ? account.handle
        : undefined,
    profile: 'profile' in account ? account.profile : undefined,
  }
}

export function getAccountEnforcement(
  data: unknown,
): AccountEnforcement | undefined {
  if (!data || typeof data !== 'object' || !('enforcement' in data)) return
  const value = data.enforcement
  if (!value || typeof value !== 'object' || !('state' in value)) return
  if (
    value.state !== 'none' &&
    value.state !== 'suspended' &&
    value.state !== 'takendown'
  )
    return
  const expiresAt =
    'expiresAt' in value &&
    typeof value.expiresAt === 'string' &&
    Number.isFinite(Date.parse(value.expiresAt))
      ? value.expiresAt
      : undefined
  return {state: value.state, expiresAt}
}
