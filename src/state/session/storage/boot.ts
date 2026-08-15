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
}

export type BootDecision = {
  source: BootSource
  /** The snapshot to adopt, set only when booting from the secure store. */
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
    adopt: bootSecure ? secureSnapshot : undefined,
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
    },
  }
}

function hasCreds(snapshot: SessionSnapshot): boolean {
  return snapshot.accounts.some(account => Boolean(account.refreshJwt))
}

function countCreds(snapshot: SessionSnapshot): number {
  return snapshot.accounts.filter(account => Boolean(account.refreshJwt)).length
}
