import {type AtpAgent, AtUri} from '@atproto/api'
import {type QueryClient, useQuery} from '@tanstack/react-query'

import {TRUSTED_VERIFIER_LIST_URIS} from '#/lib/constants'
import {logger} from '#/logger'
import {STALE} from '#/state/queries'
import {getAllListMembers} from '#/state/queries/list-members'
import {createQueryKey} from '#/state/queries/util'
import {useAgent} from '#/state/session'

/**
 * The trust root for our on-protocol verification: the set of DIDs allowed to
 * issue verifications that this app honors. It is the union, across every
 * configured `app.bsky.graph.list`, of that list's members plus its creator,
 * fetched at runtime so the trust root can change without an app release.
 *
 * Today the brand ships a single default list, but the config and resolver are
 * already list-array shaped, so adding more brand lists (or, later, lists a user
 * subscribes to from a separate source) is just more entries to union.
 */
const trustedVerifiersQueryKeyRoot = 'trusted-verifiers'
export const createTrustedVerifiersQueryKey = (listUris: readonly string[]) =>
  createQueryKey(trustedVerifiersQueryKeyRoot, {listUris})

/**
 * The creator of a list is always trusted, even if they don't list themselves
 * as a member: an `app.bsky.graph.list` record lives in its creator's repo, so
 * the creator's DID is the authority of the list AT-URI - derivable without a
 * fetch.
 */
function listCreatorDid(listUri: string): string {
  return new AtUri(listUri).host
}

async function fetchTrustedVerifierDids(
  agent: AtpAgent,
  listUris: readonly string[],
): Promise<string[]> {
  const dids = new Set<string>()
  // Creators are trusted unconditionally and need no fetch, so add them first.
  for (const listUri of listUris) dids.add(listCreatorDid(listUri))

  // Resolve lists independently: trust is additive (a union of allowlists), so
  // one list failing must not discard the others - it can only make the set
  // smaller, never unsafe. A failed list still contributes its creator above.
  const results = await Promise.allSettled(
    // getAllListMembers caps at 300 members (6 pages x 50). Plenty for a
    // verifier list; members beyond 300 would silently stop being trusted.
    listUris.map(listUri => getAllListMembers(agent, listUri)),
  )
  let anyLoaded = false
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      anyLoaded = true
      for (const item of result.value) dids.add(item.subject.did)
    } else {
      logger.error('Failed to load a trusted verifier list', {
        safeMessage: result.reason,
        listUri: listUris[i],
      })
    }
  })

  // If every list failed we have only creators - a fully degraded set. Throw so
  // React Query doesn't cache it for an hour; the caller's catch returns the
  // same creators-only set without caching, so it retries and self-heals once
  // the network is back. A partial success is fine to cache: it's safe (additive
  // trust) and refetches at staleTime anyway.
  if (listUris.length > 0 && !anyLoaded) {
    throw new Error('all trusted verifier lists failed to load')
  }
  return Array.from(dids)
}

/**
 * Resolves the trusted-verifier DID set, going through the React Query cache so
 * every profile's verification lookup shares a single fetch (cached for an
 * hour). If the lists cannot be fetched we fall back to their creators alone
 * (the URI authorities, no network needed) rather than a hardcoded list: that
 * can never go stale and can never re-trust a verifier a creator has removed.
 * The cost is that other verifiers' badges are briefly absent until the lists
 * load.
 */
export async function ensureTrustedVerifierDids(
  qc: QueryClient,
  agent: AtpAgent,
): Promise<Set<string>> {
  try {
    const dids = await qc.ensureQueryData({
      queryKey: createTrustedVerifiersQueryKey(TRUSTED_VERIFIER_LIST_URIS),
      queryFn: () =>
        fetchTrustedVerifierDids(agent, TRUSTED_VERIFIER_LIST_URIS),
      staleTime: STALE.HOURS.ONE,
      // Queries default to retry:false app-wide (fail fast for user-facing
      // fetches). This one is background and has no user-facing retry control,
      // so a transient blip shouldn't drop everyone to creators-only - retry it.
      retry: 2,
    })
    return new Set(dids)
  } catch (err) {
    logger.error(
      'Failed to load trusted verifier lists, trusting creators only',
      {
        safeMessage: err,
      },
    )
    return new Set(TRUSTED_VERIFIER_LIST_URIS.map(listCreatorDid))
  }
}

/**
 * Hook form of the trusted-verifier set, for UI that needs to display or manage
 * the lists directly. The verification pipeline itself resolves the set lazily
 * via `ensureTrustedVerifierDids` inside `useMuVerificationQuery`.
 */
export function useTrustedVerifiersQuery() {
  const agent = useAgent()
  return useQuery({
    queryKey: createTrustedVerifiersQueryKey(TRUSTED_VERIFIER_LIST_URIS),
    queryFn: () => fetchTrustedVerifierDids(agent, TRUSTED_VERIFIER_LIST_URIS),
    staleTime: STALE.HOURS.ONE,
    retry: 2,
  })
}
