/**
 * The likely cause of an invalid handle, as determined by server-side
 * resolution checks. See `README.md` and `diagnostics.ts` for how each case is
 * derived.
 */
export type IdentityDiagnosis =
  | {
      /** Offline or the PDS could not be reached, so no checks could run. */
      type: 'network-unavailable'
    }
  | {
      /** The DID document does not declare an `at://` handle at all. */
      type: 'no-aka-handle'
    }
  | {
      /**
       * The server now resolves the intended handle back to this account, so
       * the handle is likely fixed and just needs a refresh to propagate.
       */
      type: 'resolves-correctly'
      handle: string
    }
  | {
      /** The intended handle resolves, but to a different account's DID. */
      type: 'wrong-did'
      handle: string
      found: string
    }
  | {
      /**
       * The server cannot resolve the intended handle at all: missing DNS TXT
       * record, multiple TXT records, expired domain, missing well-known
       * file, etc. The client cannot distinguish these, so the FAQ covers
       * the possible causes.
       */
      type: 'not-resolving'
      handle: string
    }
  | {
      /**
       * The handle is under a domain provided by the user's hosting service
       * (e.g. `.bsky.social`), so resolution is the server's responsibility
       * and DNS advice does not apply.
       */
      type: 'service-handle-issue'
      handle: string
    }
  | {
      /** Checks ran but did not produce a definite answer. */
      type: 'inconclusive'
      handle?: string
    }

/**
 * Result of fetching the account's DID document via
 * `com.atproto.repo.describeRepo`.
 */
export type DidDocCheck =
  | {status: 'ok'; intendedHandle: string | undefined}
  | {status: 'network-error'}
  | {status: 'error'}

/**
 * Result of asking the server to resolve the intended handle via
 * `com.atproto.identity.resolveHandle`.
 */
export type ResolutionCheck =
  | {status: 'resolved'; did: string}
  | {status: 'not-resolving'}
  | {status: 'network-error'}
  | {status: 'error'}

export type DiagnosisInputs = {
  /** The current account's DID, which the handle should resolve to. */
  expectedDid: string
  didDoc: DidDocCheck
  /**
   * Whether the intended handle is under one of the PDS's
   * `availableUserDomains`.
   */
  isServiceHandle: boolean
  /** Undefined when no intended handle was found to resolve. */
  resolution?: ResolutionCheck
}

export type DiagnosticsReport = {
  /**
   * The handle this account is supposed to have, recovered from the DID
   * document's `alsoKnownAs`. Undefined if it could not be determined.
   */
  intendedHandle?: string
  diagnosis: IdentityDiagnosis
  /** Raw check results, retained for the dev-mode debug dump. */
  raw: {
    didDoc?: unknown
    handleIsCorrect?: boolean
    resolvedDid?: string
    resolveError?: string
  }
}
