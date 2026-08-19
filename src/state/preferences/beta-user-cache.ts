import {account} from '#/storage'

const values = new Map<string, boolean | undefined>()
const listeners = new Map<string, Set<() => void>>()

/**
 * Returns the last known beta-user preference for an account.
 *
 * The first read for a DID in this process is hydrated synchronously from
 * persistent storage so cold starts retain the last value fetched from the
 * PDS. Subsequent reads, including request-header reads, stay in memory.
 */
export function getCachedIsBetaUser(did: string): boolean | undefined {
  if (!values.has(did)) {
    try {
      values.set(did, account.get([did, 'isBetaUser']))
    } catch {
      values.set(did, undefined)
    }
  }
  return values.get(did)
}

/**
 * Updates the runtime cache and its persistent cold-start snapshot.
 *
 * Call this only with a value confirmed by the PDS, which remains the source
 * of truth for the preference.
 */
export function setCachedIsBetaUser(did: string, value: boolean): void {
  if (getCachedIsBetaUser(did) === value) return
  account.set([did, 'isBetaUser'], value)
  values.set(did, value)
  listeners.get(did)?.forEach(listener => listener())
}

/**
 * Subscribe to runtime cache changes for one account.
 */
export function subscribeToCachedIsBetaUser(
  did: string,
  listener: () => void,
): () => void {
  let didListeners = listeners.get(did)
  if (!didListeners) {
    didListeners = new Set()
    listeners.set(did, didListeners)
  }
  didListeners.add(listener)

  return () => {
    didListeners.delete(listener)
    if (didListeners.size === 0) listeners.delete(did)
  }
}

/**
 * Drops the in-memory value so the next read rehydrates from persistence.
 * This is useful when persistence is changed outside this cache.
 */
export function invalidateCachedIsBetaUser(did: string): void {
  if (!values.delete(did)) return
  listeners.get(did)?.forEach(listener => listener())
}
