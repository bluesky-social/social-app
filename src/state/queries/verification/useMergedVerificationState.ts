import {type AppBskyActorDefs} from '@atproto/api'

import {VERIFICATION_DENYLIST_DIDS} from '#/lib/constants'
import {useMuVerificationQuery} from '#/state/queries/verification/useMuVerificationQuery'
import type * as bsky from '#/types/bsky'

/**
 * Combines our on-protocol verification (issued by our trusted verifiers,
 * resolved via Constellation) with Bluesky's own server-computed verification.
 *
 * Ours takes precedence: if a trusted verifier in our set has verified the
 * account it counts as verified regardless of Bluesky, and our verifiers head
 * the list. Bluesky's verifications are still shown, additively.
 *
 * Returns the same `VerificationState` shape the rest of the app already
 * consumes, so every badge/dialog keeps working unchanged. Returns undefined
 * when neither source has anything, matching the prior "no verification" path.
 * While our query is loading we fall back to Bluesky-only and upgrade once it
 * resolves.
 */
export function useMergedVerificationState({
  profile,
}: {
  profile?: bsky.profile.AnyProfileView
}): AppBskyActorDefs.VerificationState | undefined {
  const {data: mu} = useMuVerificationQuery({did: profile?.did})

  // Never surface verification for denylisted accounts, regardless of what
  // Bluesky or our trusted verifiers say. Returning undefined matches the
  // "no verification" path, so every badge/dialog treats them as unverified.
  if (profile?.did && VERIFICATION_DENYLIST_DIDS.has(profile.did)) {
    return undefined
  }

  const bskyState = profile?.verification
  const ours = mu?.verifications ?? []
  const isVerifier = mu?.isVerifier ?? false

  if (!bskyState && ours.length === 0 && !isVerifier) {
    return undefined
  }

  // Dedupe by record URI in case one of our verifiers is also honored by
  // Bluesky and the same record shows up in both sources.
  const seen = new Set(ours.map(v => v.uri))
  const verifications = [
    ...ours,
    ...(bskyState?.verifications ?? []).filter(v => !seen.has(v.uri)),
  ]

  return {
    verifications,
    verifiedStatus:
      ours.length > 0 ? 'valid' : (bskyState?.verifiedStatus ?? 'none'),
    trustedVerifierStatus: isVerifier
      ? 'valid'
      : (bskyState?.trustedVerifierStatus ?? 'none'),
  }
}
