import {
  type DiagnosisInputs,
  type IdentityDiagnosis,
} from '#/features/invalidHandle/types'

/**
 * Recovers the handle an account is supposed to have from its DID document's
 * `alsoKnownAs` entries. This is the only way to learn the intended handle
 * when the AppView has already replaced it with `handle.invalid`.
 */
export function extractIntendedHandle(didDoc: unknown): string | undefined {
  if (!didDoc || typeof didDoc !== 'object') return undefined
  const aka = (didDoc as {alsoKnownAs?: unknown}).alsoKnownAs
  if (!Array.isArray(aka)) return undefined
  for (const entry of aka) {
    if (typeof entry === 'string' && entry.startsWith('at://')) {
      const handle = entry.slice('at://'.length)
      if (handle.includes('.')) {
        return handle
      }
    }
  }
  return undefined
}

/**
 * Whether the handle is under a domain provided by the user's hosting service
 * (e.g. `.bsky.social`). For these, resolution is handled by the service
 * itself, so DNS troubleshooting advice does not apply.
 */
export function isServiceHandle(
  handle: string,
  availableUserDomains: string[],
): boolean {
  return availableUserDomains.some(domain => {
    const suffix = domain.startsWith('.') ? domain : `.${domain}`
    return handle.endsWith(suffix)
  })
}

/**
 * Combines the individual check results into a single diagnosis. Priority:
 * a successful resolution (correct or wrong DID) is the strongest signal,
 * then service-provided handles (server-side issue), then resolution
 * failures, then failures of the checks themselves.
 */
export function pickDiagnosis({
  expectedDid,
  didDoc,
  isServiceHandle: isService,
  resolution,
}: DiagnosisInputs): IdentityDiagnosis {
  if (didDoc.status === 'network-error') {
    return {type: 'network-unavailable'}
  }
  if (didDoc.status === 'error') {
    return {type: 'inconclusive'}
  }

  const handle = didDoc.intendedHandle
  if (!handle) {
    return {type: 'no-aka-handle'}
  }

  if (resolution?.status === 'resolved') {
    if (resolution.did === expectedDid) {
      return {type: 'resolves-correctly', handle}
    }
    return {type: 'wrong-did', handle, found: resolution.did}
  }

  if (isService) {
    return {type: 'service-handle-issue', handle}
  }

  if (resolution?.status === 'not-resolving') {
    return {type: 'not-resolving', handle}
  }

  if (resolution?.status === 'network-error') {
    return {type: 'network-unavailable'}
  }

  return {type: 'inconclusive', handle}
}
