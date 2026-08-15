import {jwtDecode} from 'jwt-decode'

import {type SessionAccount} from '#/state/session/types'
import {type SessionSnapshot} from './schema'

/** Which store the app boots its session state from. */
export type BootSource = 'secure' | 'legacy'

export type SecureReadStatus =
  'ok' | 'missing' | 'invalid' | 'unavailable' | 'foreign-install'

export type SecureRead =
  | {status: 'ok'; snapshot: SessionSnapshot}
  | {status: Exclude<SecureReadStatus, 'ok'>}

/**
 * Emitted once per boot. While the read gate is off this is the measurement:
 * `legacy-lost` is the signature of the corruption this module exists to fix,
 * and its rate is what says whether the gate is worth turning on.
 */
export type SessionStorageBootReport = {
  source: BootSource
  gateEnabled: boolean
  secureStatus: SecureReadStatus
  divergence: 'none' | 'legacy-lost' | 'secure-behind'
  secureAccountsWithCreds: number
  legacyAccountsWithCreds: number
  /**
   * How many accounts in the adopted snapshot took their credentials from the
   * legacy blob, i.e. how often the secure store held a stale or missing token
   * that would have been adopted as-is. Always 0 when not booting from the
   * secure store.
   */
  adoptTokensFromLegacy: number
}

export type BootDecision = {
  source: BootSource
  /**
   * The snapshot to adopt, set only when booting from the secure store. It is
   * the secure snapshot merged with the legacy blob, not the secure snapshot
   * itself - see {@link mergeFreshestCredentials}.
   */
  adopt: SessionSnapshot | undefined
  backfill: 'none' | 'secure-from-legacy'
  /** Publish an index even if the backfill changes nothing. */
  forceIndex: boolean
  report: SessionStorageBootReport
}

/**
 * Decide which store the session boots from, and what the secure store needs
 * written back to it. Pure, so the whole matrix is testable without mocks.
 *
 * The secure store only wins when the gate is on, it read cleanly, and it is
 * not obviously behind the legacy blob. "Behind" means the legacy blob holds
 * credentials and the secure store does not, which is what silently failing
 * mirror writes look like - booting from the secure store there would log the
 * user out. A real logout clears the credentials in both stores, so it does
 * not trip the guard.
 *
 * That guard is whole-store, so winning the boot does not mean the secure
 * snapshot is adopted verbatim: it is merged per account against the blob by
 * {@link mergeFreshestCredentials}, which is what keeps a single failed mirror
 * write from dropping an account or reinstating a spent refresh token.
 */
export function decideBootSource({
  gateEnabled,
  secure,
  legacy,
}: {
  gateEnabled: boolean
  secure: SecureRead
  legacy: SessionSnapshot
}): BootDecision {
  const secureSnapshot = secure.status === 'ok' ? secure.snapshot : undefined
  const secureHasCreds = secureSnapshot ? hasCreds(secureSnapshot) : false
  const legacyHasCreds = hasCreds(legacy)

  const bootSecure =
    gateEnabled &&
    secureSnapshot !== undefined &&
    (secureHasCreds || !legacyHasCreds)
  const merged =
    bootSecure && secureSnapshot
      ? mergeFreshestCredentials(secureSnapshot, legacy)
      : undefined

  let backfill: BootDecision['backfill'] = 'none'
  let forceIndex = false
  switch (secure.status) {
    case 'unavailable':
      /*
       * Nothing can be written either, and an attempt would only add another
       * failure. The next boot reads again.
       */
      break
    case 'missing':
    case 'invalid':
    case 'foreign-install':
      backfill = 'secure-from-legacy'
      forceIndex = true
      break
    case 'ok':
      /*
       * Booting from legacy means legacy is authoritative for this run, so the
       * secure store is brought level with it. The write is diff-aware and
       * no-ops when the two already agree, which is the steady state.
       */
      backfill = bootSecure ? 'none' : 'secure-from-legacy'
      break
  }

  return {
    source: bootSecure ? 'secure' : 'legacy',
    adopt: merged?.snapshot,
    backfill,
    forceIndex,
    report: {
      source: bootSecure ? 'secure' : 'legacy',
      gateEnabled,
      secureStatus: secure.status,
      divergence:
        secureSnapshot === undefined
          ? 'none'
          : secureHasCreds && !legacyHasCreds
            ? 'legacy-lost'
            : !secureHasCreds && legacyHasCreds
              ? 'secure-behind'
              : 'none',
      secureAccountsWithCreds: secureSnapshot ? countCreds(secureSnapshot) : 0,
      legacyAccountsWithCreds: countCreds(legacy),
      adoptTokensFromLegacy: merged?.tokensFromLegacy ?? 0,
    },
  }
}

/**
 * Merge the two stores account by account, taking the freshest credentials for
 * each did, so that adopting the secure store cannot lose what only the blob
 * holds. A mirror write can fail for one account - a login whose write failed
 * and whose in-memory retry died with the process, or a token rotation that
 * never landed - while the rest of the store looks perfectly healthy, which is
 * exactly what the whole-store guard cannot see.
 *
 * Ties and unprovable comparisons go to the blob: it is the historical write of
 * record, and the secure store is the mirror on trial.
 *
 * Deliberate asymmetry: this can resurrect a credential the other store
 * recorded as revoked, e.g. a logout only one of the two writes captured. That
 * is accepted. A token the server has already revoked self-corrects on first
 * use with a re-login prompt, while a valid token dropped here logs the user
 * out of an account with no way back - the failure this module exists to
 * prevent.
 */
function mergeFreshestCredentials(
  secure: SessionSnapshot,
  legacy: SessionSnapshot,
): {snapshot: SessionSnapshot; tokensFromLegacy: number} {
  const legacyByDid = new Map(legacy.accounts.map(a => [a.did, a]))
  const secureDids = new Set(secure.accounts.map(a => a.did))
  let tokensFromLegacy = 0

  const accounts = [
    ...secure.accounts.map(account => {
      const other = legacyByDid.get(account.did)
      if (!other) return account
      if (freshest(account, other) === 'secure') return account
      if (other.refreshJwt) tokensFromLegacy += 1
      return other
    }),
    /*
     * Accounts the secure store never received. The blob is the only copy, so
     * dropping them here is the multi-account logout this merge exists to stop.
     */
    ...legacy.accounts.filter(account => {
      if (secureDids.has(account.did)) return false
      if (account.refreshJwt) tokensFromLegacy += 1
      return true
    }),
  ]

  const dids = new Set<string>(accounts.map(account => account.did))
  const currentDid = secure.currentDid ?? legacy.currentDid
  return {
    snapshot: {
      accounts,
      currentDid: currentDid && dids.has(currentDid) ? currentDid : undefined,
    },
    tokensFromLegacy,
  }
}

/**
 * Which store holds the newer refresh token for one account. The caller takes
 * the winner's account object whole, so its tokens and descriptor fields stay
 * coherent with each other.
 */
function freshest(
  secure: SessionAccount,
  legacy: SessionAccount,
): 'secure' | 'legacy' {
  if (secure.refreshJwt === legacy.refreshJwt) return 'secure'
  if (!legacy.refreshJwt) return 'secure'
  if (!secure.refreshJwt) return 'legacy'
  const secureIssuedAt = issuedAt(secure.refreshJwt)
  const legacyIssuedAt = issuedAt(legacy.refreshJwt)
  if (secureIssuedAt === undefined || legacyIssuedAt === undefined) {
    return 'legacy'
  }
  return secureIssuedAt > legacyIssuedAt ? 'secure' : 'legacy'
}

/** A token's `iat` claim, or undefined if it cannot be read. */
function issuedAt(token: string): number | undefined {
  try {
    const {iat} = jwtDecode(token)
    return typeof iat === 'number' ? iat : undefined
  } catch {
    return undefined
  }
}

function hasCreds(snapshot: SessionSnapshot): boolean {
  return snapshot.accounts.some(account => Boolean(account.refreshJwt))
}

function countCreds(snapshot: SessionSnapshot): number {
  return snapshot.accounts.filter(account => Boolean(account.refreshJwt)).length
}
