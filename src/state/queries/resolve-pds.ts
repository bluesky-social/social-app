import {useQuery} from '@tanstack/react-query'

import {resolvePdsForHandle} from '#/lib/api/resolve-pds'
import {STALE} from '#/state/queries'

const RQKEY_ROOT = 'resolve-pds'
export const RQKEY = (handle: string) => [RQKEY_ROOT, handle]

function normalizeHandle(handle: string) {
  return handle.trim().replace(/^@/, '').toLowerCase()
}

/**
 * Whether the input is worth resolving. Only resolve when it looks like a full
 * handle or a DID. Skip emails (contain `@`) so legacy email-login users keep
 * going to the default service.
 */
export function looksResolvable(handle: string) {
  const normalized = normalizeHandle(handle)
  return (
    !normalized.includes('@') &&
    (normalized.startsWith('did:') || normalized.includes('.'))
  )
}

/**
 * Shared query config so the background hook and any imperative `fetchQuery`
 * (e.g. resolving on form submit) use the same key, cache, and options.
 */
export function resolvePdsQueryOptions(handle: string) {
  const normalized = normalizeHandle(handle)
  return {
    queryKey: RQKEY(normalized),
    queryFn: () => resolvePdsForHandle(normalized),
    staleTime: STALE.MINUTES.FIVE,
    // Don't retry — failures fall back to manual server entry, no point hammering.
    retry: false as const,
  }
}

export function useResolvePdsQuery(handle: string, opts?: {enabled?: boolean}) {
  return useQuery({
    ...resolvePdsQueryOptions(handle),
    enabled: (opts?.enabled ?? true) && looksResolvable(handle),
  })
}
