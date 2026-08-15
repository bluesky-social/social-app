/**
 * Native session storage: a mirror of the session state held in the persisted
 * blob, kept in the system keychain.
 *
 * Every native install writes both stores. Which one the app boots from is
 * decided per launch by `decideBootSource`, gated on a device flag cached from
 * a feature gate on the previous run. Nothing here throws, and nothing here is
 * awaited: a keychain failure must never keep the app from booting.
 *
 * This module must not import `./gate-sync` or anything from `#/analytics`.
 * Doing so pulls GrowthBook's module-scope initialization into the session
 * provider's module graph.
 */
import uuid from 'react-native-uuid'

import * as persisted from '#/state/persisted'
import {device} from '#/storage'
import {
  type BootDecision,
  decideBootSource,
  type SecureRead,
  type SessionStorageBootReport,
} from './boot'
import {
  InvalidSessionStorageDataError,
  logStorageError,
  storageError,
} from './errors'
import {EMPTY_SNAPSHOT, type SessionSnapshot} from './schema'
import {
  canonicalJson,
  eraseSessions,
  hasStoredIndex,
  readInstallMarker,
  readSessions,
  writeInstallMarker,
  writeSessions,
} from './secureStore'
import {createSessionStorageStore} from './store'

const store = createSessionStorageStore()
let bootReport: SessionStorageBootReport | undefined

/**
 * Read both stores, decide which one wins, and bring the loser level with it.
 * Call once during bootstrap, after `persisted.init()` has resolved and before
 * anything reads the session.
 *
 * When the secure store wins, its snapshot is adopted by writing it back into
 * the persisted state. `persisted.write` updates its in-memory copy
 * synchronously before awaiting storage, so every existing reader - the
 * session store constructor, the last-active-account lookup, the expiry rescue
 * path - sees the adopted data with no seam of its own. It also means the
 * legacy blob stays current, so turning the gate back off is safe.
 */
export function initSessionStorage(): void {
  try {
    const legacy = toSnapshot(persisted.get('session'))
    let secure = readSecure()

    /*
     * The keychain outlives an uninstall on iOS while device storage dies with
     * the app container, so a stored marker that does not match the device's
     * is data from a previous install of the app. Only meaningful once there
     * is an index to have been read.
     */
    const storedInstallId = device.get(['sessionSecureStorageInstallId'])
    const installId = storedInstallId ?? uuid.v4()
    if (!storedInstallId) {
      device.set(['sessionSecureStorageInstallId'], installId)
    }
    if (secure.status === 'ok' || secure.status === 'invalid') {
      if (!storedInstallId || readInstallMarker() !== storedInstallId) {
        const dids =
          secure.status === 'ok'
            ? secure.snapshot.accounts.map(account => account.did)
            : []
        try {
          eraseSessions(dids)
        } catch (cause) {
          logStorageError(storageError('clear', cause))
        }
        secure = {status: 'foreign-install'}
      }
    }

    const decision = decideBootSource({
      gateEnabled: device.get(['sessionSecureStorageReadEnabled']) ?? false,
      secure,
      legacy,
    })

    if (decision.adopt) {
      adopt(decision.adopt)
    }
    store.setDurable(secure.status === 'ok' ? secure.snapshot : EMPTY_SNAPSHOT)
    if (decision.backfill === 'secure-from-legacy') {
      backfill(legacy, decision, installId)
    }

    bootReport = decision.report
  } catch (cause) {
    logStorageError(storageError('init', cause))
  }
}

/**
 * Mirror the session state the reducer just persisted. Fire-and-forget: a
 * failure is logged and retried in the background, and never surfaces here.
 */
export function mirrorSessionSnapshot(data: persisted.Schema['session']): void {
  store.write(toSnapshot(data))
}

/** Erase all stored session data, including any orphaned leftovers. */
export function clearSessionStorage(): void {
  store.clear()
}

/**
 * The boot report, once. Emitted as a metric by `SecureSessionStorageGateSync`
 * as soon as an analytics context exists, which is long after boot.
 */
export function consumeSessionStorageBootReport():
  SessionStorageBootReport | undefined {
  const report = bootReport
  bootReport = undefined
  return report
}

function readSecure(): SecureRead {
  try {
    if (!hasStoredIndex()) return {status: 'missing'}
    return {status: 'ok', snapshot: readSessions()}
  } catch (cause) {
    if (cause instanceof InvalidSessionStorageDataError) {
      return {status: 'invalid'}
    }
    logStorageError(storageError('init', cause))
    return {status: 'unavailable'}
  }
}

function adopt(snapshot: SessionSnapshot) {
  const {accounts, currentDid} = snapshot
  const next = {
    accounts,
    currentAccount: accounts.find(account => account.did === currentDid),
  }
  if (canonicalJson(next) === canonicalJson(persisted.get('session'))) return
  void persisted.write('session', next)
}

function backfill(
  legacy: SessionSnapshot,
  decision: BootDecision,
  installId: string,
) {
  try {
    if (decision.forceIndex) {
      /*
       * Written before the index so a failure here can only produce a marker
       * with no session data, which the next boot backfills over. The reverse
       * order could leave stored sessions looking foreign.
       */
      writeInstallMarker(installId)
    }
    writeSessions(store.getDurable(), legacy, {forceIndex: decision.forceIndex})
    store.setDurable(legacy)
  } catch (cause) {
    /*
     * No retry: the next boot attempts the backfill again, and in the meantime
     * every mirrored write converges the store on its own.
     */
    logStorageError(storageError('backfill', cause))
  }
}

/**
 * Drop a current account that names no stored account. Both stores allow that
 * state, but an index whose current did is absent fails validation on read,
 * which would discard every account's credentials rather than one field.
 */
function toSnapshot(data: persisted.Schema['session']): SessionSnapshot {
  const currentDid = data.currentAccount?.did
  return {
    accounts: data.accounts,
    currentDid: data.accounts.some(account => account.did === currentDid)
      ? currentDid
      : undefined,
  }
}
