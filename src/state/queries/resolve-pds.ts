import {useQuery} from '@tanstack/react-query'

import {resolvePdsForHandle} from '#/lib/api/resolve-pds'
import {STALE} from '#/state/queries'

const RQKEY_ROOT = 'resolve-pds'
export const RQKEY = (handle: string) => [RQKEY_ROOT, handle]

export function useResolvePdsQuery(handle: string, opts?: {enabled?: boolean}) {
  const normalized = handle.trim().replace(/^@/, '').toLowerCase()
  // Only auto-resolve when the input looks like a full handle or a DID.
  // Skip emails (contain `@`) so legacy email-login users keep going to the
  // default service.
  const looksResolvable =
    !normalized.includes('@') &&
    (normalized.startsWith('did:') || normalized.includes('.'))
  return useQuery({
    enabled: (opts?.enabled ?? true) && looksResolvable,
    queryKey: RQKEY(normalized),
    queryFn: () => resolvePdsForHandle(normalized),
    staleTime: STALE.MINUTES.FIVE,
    // Don't retry — failures fall back to manual server entry, no point hammering.
    retry: false,
  })
}
