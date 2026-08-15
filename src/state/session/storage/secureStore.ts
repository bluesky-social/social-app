/**
 * Native session storage layout over expo-secure-store.
 *
 * All reads and writes use the synchronous SecureStore variants. The agent
 * does not await its persist callback, so a token refresh must land in the
 * keychain before the OS can suspend the app; async writes could be dropped.
 *
 * Storage layout
 * - One index key (`SESSION_INDEX_KEY`) holds a JSON object listing the stored
 *   dids, the current did, and optional recovery journals.
 * - Each account stores three keys derived from sha256(did): a descriptor (the
 *   account minus its tokens), a refresh token, and an access token.
 *
 * The index is the commit point. An index that names a did is only valid if
 * that did's descriptor is present. Publishing the index last means an
 * interrupted write is either fully visible or invisible.
 *
 * Tombstoning writes an empty string rather than deleting a key. This keeps
 * every write a uniform synchronous `setItem` and never touches the async
 * delete path, which is the only delete SecureStore offers.
 *
 * Note that {@link readSessions} writes: it finishes any journaled tombstoning
 * before returning, so even a boot-time read can fail when the keychain is
 * unavailable.
 *
 * Crash-recovery protocol (readSessions):
 * - `revokedDids` still present in `dids` had a credential cleared while the
 *   account was kept; finish clearing their tokens.
 * - `retiredDids` no longer in `dids` were removed entirely; finish tombstoning
 *   the whole account.
 * - Then rewrite a clean index with the journals stripped.
 *
 * Write ordering (writeSessions), designed so a crash between any two steps
 * recovers to a valid state:
 * 1. If any credentials are being revoked, journal against the PREVIOUS index
 *    (its descriptors are all durably present) annotated with the retired and
 *    revoked dids. A crash here recovers to "previous state minus the revoked
 *    credentials", which is correct because the commit never reached its
 *    commit point. Journaling against `next` instead would let a same-commit
 *    account addition leave a did with no descriptor, which recovery reads as
 *    invalid-data and resets everything - the mass-logout bug this avoids.
 * 2. Write the changed credentials, then the changed descriptors, for every
 *    account in `next`.
 * 3. Publish the commit index (`next` plus the retired-did journal). This is
 *    the commit point. It is skipped only when nothing changed and an index
 *    already exists; the first-ever write must still create the index.
 * 4. If any accounts were retired, tombstone them, then publish a clean index.
 *
 * Accepted limitation: credentials written by a commit that fails at step 3
 * (before its index write) are orphaned across a process restart, because the
 * durable index never named them and the in-memory maybe-orphaned set is lost.
 * They are overwritten on the next login for that did and erased by a clear.
 */
import * as SecureStore from 'expo-secure-store'

import {type SessionAccount} from '#/state/session/types'
import {InvalidSessionStorageDataError} from './errors'
import {accountKeys, SESSION_INDEX_KEY, SESSION_INSTALL_KEY} from './keys'
import {
  type AccountDescriptor,
  descriptorSchema,
  EMPTY_SNAPSHOT,
  type SessionSnapshot,
  type StoredIndex,
  storedIndexSchema,
} from './schema'

/**
 * Keychain items default to `WHEN_UNLOCKED`, and the accessibility attribute
 * is stamped onto an item when it is written. The app can cold launch in the
 * background - handling a push notification, say - before the device has been
 * unlocked since boot, so session data has to survive that state.
 */
const WRITE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
}

/**
 * Whether a commit index exists. True once anything has been written, so it
 * marks the store as initialized - not as authoritative, and not as migrated.
 */
export function hasStoredIndex(): boolean {
  return SecureStore.getItem(SESSION_INDEX_KEY) !== null
}

/**
 * Read the stored snapshot, first completing any journaled tombstoning left by
 * an interrupted write. Throws {@link InvalidSessionStorageDataError} if the
 * index is missing, unparseable, or references a did whose descriptor is
 * absent.
 */
export function readSessions(): SessionSnapshot {
  const rawIndex = SecureStore.getItem(SESSION_INDEX_KEY)
  if (rawIndex === null) {
    throw new InvalidSessionStorageDataError()
  }
  let index: StoredIndex
  try {
    index = storedIndexSchema.parse(JSON.parse(rawIndex))
  } catch {
    throw new InvalidSessionStorageDataError()
  }
  if (index.revokedDids?.length) {
    const activeDids = new Set(index.dids)
    index.revokedDids
      .filter(did => activeDids.has(did))
      .forEach(tombstoneCredentials)
  }
  if (index.retiredDids?.length) {
    const activeDids = new Set(index.dids)
    index.retiredDids
      .filter(did => !activeDids.has(did))
      .forEach(tombstoneAccount)
  }
  if (index.revokedDids?.length || index.retiredDids?.length) {
    const cleanedIndex = {
      version: index.version,
      currentDid: index.currentDid,
      dids: index.dids,
    } satisfies StoredIndex
    SecureStore.setItem(
      SESSION_INDEX_KEY,
      JSON.stringify(cleanedIndex),
      WRITE_OPTIONS,
    )
    index = cleanedIndex
  }
  if (index.currentDid && !index.dids.includes(index.currentDid)) {
    throw new InvalidSessionStorageDataError()
  }
  const accounts = index.dids.map(did => {
    const keys = accountKeys(did)
    const rawDescriptor = SecureStore.getItem(keys.descriptor)
    if (!rawDescriptor) {
      throw new InvalidSessionStorageDataError()
    }
    let descriptor: AccountDescriptor
    try {
      descriptor = descriptorSchema.parse(JSON.parse(rawDescriptor))
    } catch {
      throw new InvalidSessionStorageDataError()
    }
    if (descriptor.did !== did) {
      throw new InvalidSessionStorageDataError()
    }
    return {
      ...descriptor,
      refreshJwt: SecureStore.getItem(keys.refresh) || undefined,
      accessJwt: SecureStore.getItem(keys.access) || undefined,
    }
  })
  return {accounts, currentDid: index.currentDid}
}

/**
 * Persist the transition from `previous` to `next` following the four-step
 * ordering documented in the file header. `alsoRetire` names dids that a prior
 * failed write may have partially persisted, so they are tombstoned too when
 * absent from `next`. `forceIndex` publishes the index even when nothing
 * changed, used for the first write into an uninitialized store.
 */
export function writeSessions(
  previous: SessionSnapshot,
  next: SessionSnapshot,
  {
    alsoRetire = [],
    forceIndex = false,
  }: {alsoRetire?: string[]; forceIndex?: boolean} = {},
) {
  const previousByDid = new Map(previous.accounts.map(a => [a.did, a]))
  const nextDids = new Set<string>(next.accounts.map(a => a.did))
  const retiredDids = [
    ...new Set([
      ...previous.accounts
        .filter(account => !nextDids.has(account.did))
        .map(account => account.did),
      ...alsoRetire.filter(did => !nextDids.has(did)),
    ]),
  ]
  const revokedDids = next.accounts
    .filter(account => {
      const prior = previousByDid.get(account.did)
      return (
        (Boolean(prior?.refreshJwt) && !account.refreshJwt) ||
        (Boolean(prior?.accessJwt) && !account.accessJwt)
      )
    })
    .map(account => account.did)

  if (revokedDids.length) {
    /*
     * Journal against the previous index, whose descriptors are all durably
     * present. On interruption, readSessions finishes the tombstoning before
     * loading, recovering to the previous state minus the revoked credentials.
     */
    SecureStore.setItem(
      SESSION_INDEX_KEY,
      JSON.stringify(toStoredIndex(previous, retiredDids, revokedDids)),
      WRITE_OPTIONS,
    )
  }

  /*
   * Credentials go first. The agent does not await its persistence callback,
   * so these must complete synchronously before the app can be suspended.
   */
  for (const account of next.accounts) {
    const prior = previousByDid.get(account.did)
    const keys = accountKeys(account.did)
    /*
     * The absent-prior case must write, not skip. A caller that distrusts its
     * baseline passes an empty `previous` to force a full rewrite, and there
     * `undefined !== undefined` would skip an account whose token is absent -
     * leaving whatever the keychain still holds under that key to be read back
     * as a live credential under an index that names the did.
     */
    if (!prior || prior.refreshJwt !== account.refreshJwt) {
      SecureStore.setItem(keys.refresh, account.refreshJwt ?? '', WRITE_OPTIONS)
    }
    if (!prior || prior.accessJwt !== account.accessJwt) {
      SecureStore.setItem(keys.access, account.accessJwt ?? '', WRITE_OPTIONS)
    }
    const descriptor = canonicalJson(toDescriptor(account))
    if (canonicalJson(toDescriptor(prior)) !== descriptor) {
      SecureStore.setItem(keys.descriptor, descriptor, WRITE_OPTIONS)
    }
  }

  const changed =
    retiredDids.length > 0 ||
    revokedDids.length > 0 ||
    canonicalJson(previous) !== canonicalJson(next)
  if (forceIndex || changed) {
    /*
     * Publishing the index is the commit point. `retiredDids` keeps the token
     * cleanup recoverable if the process stops between these sync writes.
     */
    SecureStore.setItem(
      SESSION_INDEX_KEY,
      JSON.stringify(toStoredIndex(next, retiredDids)),
      WRITE_OPTIONS,
    )
  }

  if (retiredDids.length) {
    retiredDids.forEach(tombstoneAccount)
    SecureStore.setItem(
      SESSION_INDEX_KEY,
      JSON.stringify(toStoredIndex(next)),
      WRITE_OPTIONS,
    )
  }
}

/**
 * Erase every named did and reset the index to empty. Journals the removal
 * first so an interrupted erase is finished by the next read.
 */
export function eraseSessions(dids: string[]) {
  SecureStore.setItem(
    SESSION_INDEX_KEY,
    JSON.stringify(toStoredIndex(EMPTY_SNAPSHOT, dids)),
    WRITE_OPTIONS,
  )
  dids.forEach(tombstoneAccount)
  SecureStore.setItem(
    SESSION_INDEX_KEY,
    JSON.stringify(toStoredIndex(EMPTY_SNAPSHOT)),
    WRITE_OPTIONS,
  )
}

/** The install marker stored alongside the session data, if any. */
export function readInstallMarker(): string | null {
  return SecureStore.getItem(SESSION_INSTALL_KEY) || null
}

export function writeInstallMarker(id: string) {
  SecureStore.setItem(SESSION_INSTALL_KEY, id, WRITE_OPTIONS)
}

/**
 * `JSON.stringify` with object keys sorted at every depth, so two objects that
 * differ only in key order serialize identically.
 *
 * Load-bearing for every equality check in this module. A snapshot read back
 * through the schemas carries the schema's key order, while one built by the
 * session reducer carries its construction order, so a raw stringify would
 * report a change on the first write after every boot and rewrite the whole
 * store.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value))
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value === null || typeof value !== 'object') return value
  const source = value as Record<string, unknown>
  return Object.fromEntries(
    Object.keys(source)
      .sort()
      .map(key => [key, sortKeys(source[key])]),
  )
}

function toDescriptor(
  account: SessionAccount | undefined,
): AccountDescriptor | undefined {
  if (!account) return undefined
  const {
    accessJwt: _accessJwt,
    refreshJwt: _refreshJwt,
    ...descriptor
  } = account
  return descriptor
}

function toStoredIndex(
  snapshot: SessionSnapshot,
  retiredDids: string[] = [],
  revokedDids: string[] = [],
): StoredIndex {
  return {
    version: 1,
    currentDid: snapshot.currentDid,
    dids: snapshot.accounts.map(account => account.did),
    ...(retiredDids.length ? {retiredDids} : {}),
    ...(revokedDids.length ? {revokedDids} : {}),
  }
}

function tombstoneAccount(did: string) {
  tombstoneCredentials(did)
  const keys = accountKeys(did)
  SecureStore.setItem(keys.descriptor, '', WRITE_OPTIONS)
}

function tombstoneCredentials(did: string) {
  const keys = accountKeys(did)
  SecureStore.setItem(keys.refresh, '', WRITE_OPTIONS)
  SecureStore.setItem(keys.access, '', WRITE_OPTIONS)
}
