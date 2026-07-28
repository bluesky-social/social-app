/**
 * Native session storage layout over expo-secure-store.
 *
 * All reads and writes use the synchronous SecureStore variants. AtpAgent does
 * not await its persist callback, so a token refresh must land in the keychain
 * before the OS can suspend the app; async writes could be dropped.
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
 * delete path.
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
 * They are overwritten on the next login for that did and erased by clear().
 */
import * as SecureStore from 'expo-secure-store'
import {z} from 'zod'

import {InvalidSessionStorageDataError} from './errors'
import {accountKeys, SESSION_INDEX_KEY} from './keys'
import {
  type SessionAccount,
  sessionAccountSchema,
  type SessionSnapshot,
} from './schema'

const indexSchema = z.object({
  version: z.literal(1),
  currentDid: z.string().optional(),
  dids: z.array(z.string()),
  retiredDids: z.array(z.string()).optional(),
  revokedDids: z.array(z.string()).optional(),
})
const descriptorSchema = sessionAccountSchema.omit({
  accessJwt: true,
  refreshJwt: true,
})

type StoredIndex = z.infer<typeof indexSchema>
type AccountDescriptor = Omit<SessionAccount, 'accessJwt' | 'refreshJwt'>

const EMPTY_SNAPSHOT: SessionSnapshot = {accounts: [], currentDid: undefined}

/** Whether a durable index has been committed. */
export function indexExists(): boolean {
  return SecureStore.getItem(SESSION_INDEX_KEY) !== null
}

/**
 * Read the stored snapshot, first completing any journaled tombstoning left by
 * an interrupted write. Throws InvalidSessionStorageDataError if the index is
 * missing, unparseable, or references a did whose descriptor is absent.
 */
export function readSessions(): SessionSnapshot {
  const rawIndex = SecureStore.getItem(SESSION_INDEX_KEY)
  if (rawIndex === null) {
    throw new InvalidSessionStorageDataError()
  }
  let index: StoredIndex
  try {
    index = indexSchema.parse(JSON.parse(rawIndex))
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
    SecureStore.setItem(SESSION_INDEX_KEY, JSON.stringify(cleanedIndex))
    index = cleanedIndex
  }
  if (index.currentDid && !index.dids.includes(index.currentDid)) {
    throw new InvalidSessionStorageDataError()
  }
  const accounts = index.dids.map(did => {
    const keys = accountKeys(did)
    const rawDescriptor = SecureStore.getItem(keys.descriptor)
    if (rawDescriptor === null) {
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
 * changed, used for the first-ever write.
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
  const nextDids = new Set(next.accounts.map(a => a.did))
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
    )
  }

  /*
   * Credentials go first. AtpAgent does not await its persistence callback, so
   * these must complete synchronously before the app can be suspended.
   */
  for (const account of next.accounts) {
    const prior = previousByDid.get(account.did)
    const keys = accountKeys(account.did)
    if (prior?.refreshJwt !== account.refreshJwt) {
      SecureStore.setItem(keys.refresh, account.refreshJwt ?? '')
    }
    if (prior?.accessJwt !== account.accessJwt) {
      SecureStore.setItem(keys.access, account.accessJwt ?? '')
    }
    const descriptor = toDescriptor(account)
    if (JSON.stringify(toDescriptor(prior)) !== JSON.stringify(descriptor)) {
      SecureStore.setItem(keys.descriptor, JSON.stringify(descriptor))
    }
  }

  const changed =
    retiredDids.length > 0 ||
    revokedDids.length > 0 ||
    JSON.stringify(previous) !== JSON.stringify(next)
  if (forceIndex || changed) {
    // Publishing the index is the commit point. `retiredDids` keeps the token
    // cleanup recoverable if the process stops between these sync writes.
    SecureStore.setItem(
      SESSION_INDEX_KEY,
      JSON.stringify(toStoredIndex(next, retiredDids)),
    )
  }

  if (retiredDids.length) {
    retiredDids.forEach(tombstoneAccount)
    SecureStore.setItem(SESSION_INDEX_KEY, JSON.stringify(toStoredIndex(next)))
  }
}

/**
 * Erase every named did and reset the index to empty. Journals the removal
 * first so an interrupted erase is finished by the next readSessions.
 */
export function eraseSessions(dids: string[]) {
  SecureStore.setItem(
    SESSION_INDEX_KEY,
    JSON.stringify(toStoredIndex(EMPTY_SNAPSHOT, dids)),
  )
  dids.forEach(tombstoneAccount)
  SecureStore.setItem(
    SESSION_INDEX_KEY,
    JSON.stringify(toStoredIndex(EMPTY_SNAPSHOT)),
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
  SecureStore.setItem(keys.descriptor, '')
}

function tombstoneCredentials(did: string) {
  const keys = accountKeys(did)
  SecureStore.setItem(keys.refresh, '')
  SecureStore.setItem(keys.access, '')
}
