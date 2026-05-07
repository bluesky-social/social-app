/* eslint-disable @typescript-eslint/no-explicit-any */
import {useEffect, useRef} from 'react'
import {type QueryClient, useQueryClient} from '@tanstack/react-query'

import {PERSISTED_QUERY_ROOT} from '#/state/queries'
import {fetchRecordViaSlingshot} from './microcosm-fallback'

type Enrichment = {
  displayName: string
  description: string
  avatar: string | undefined
  banner: string | undefined
}

/**
 * A profile is "incomplete" when the appview has the account but hasn't
 * synced the profile record yet. Detection heuristics:
 * - No avatar at all, OR
 * - displayName is missing/empty, OR
 * - displayName equals the handle (appview echoes handle as displayName
 *   when the profile record hasn't synced)
 */
function isIncompleteProfile(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false
  if (typeof obj.did !== 'string' || !obj.did.startsWith('did:')) return false
  if (!('handle' in obj)) return false
  if (obj.__enriched || obj.__fallbackMode) return false

  const hasAvatar = !!obj.avatar
  const hasRealDisplayName = !!obj.displayName && obj.displayName !== obj.handle // appview echoes handle when unsynced

  // Incomplete if missing avatar AND missing a real display name
  if (!hasAvatar && !hasRealDisplayName) return true
  return false
}

/**
 * Walk any data structure and collect DIDs of incomplete profiles.
 */
function collectIncompleteProfileDids(
  data: any,
  dids: Set<string>,
  visited: WeakSet<object>,
  depth: number,
): void {
  if (!data || typeof data !== 'object' || depth > 12) return
  if (visited.has(data)) return
  visited.add(data)

  if (Array.isArray(data)) {
    for (const item of data) {
      collectIncompleteProfileDids(item, dids, visited, depth + 1)
    }
    return
  }

  if (isIncompleteProfile(data)) {
    dids.add(data.did)
  }

  for (const key of Object.keys(data)) {
    collectIncompleteProfileDids(data[key], dids, visited, depth + 1)
  }
}

/**
 * Fetch profile record from PDS via Slingshot.
 */
async function fetchProfileEnrichment(did: string): Promise<Enrichment | null> {
  try {
    const record = await fetchRecordViaSlingshot(
      `at://${did}/app.bsky.actor.profile/self`,
    )
    if (!record?.value) return null
    const v = record.value
    // Return enrichment if there's anything useful (displayName, avatar, or description)
    if (!v.displayName && !v.avatar && !v.description) return null
    return {
      displayName: v.displayName || '',
      description: v.description || '',
      avatar: v.avatar?.ref?.$link
        ? `https://cdn.bsky.app/img/avatar/plain/${did}/${v.avatar.ref.$link}@jpeg`
        : undefined,
      banner: v.banner?.ref?.$link
        ? `https://cdn.bsky.app/img/banner/plain/${did}/${v.banner.ref.$link}@jpeg`
        : undefined,
    }
  } catch {
    return null
  }
}

/**
 * Immutably deep-clone a data structure, enriching any profile objects
 * whose DID is in the enrichments map. Returns [cloned, changed].
 */
function deepEnrich(
  data: any,
  enrichments: Map<string, Enrichment>,
  visited: WeakSet<object>,
  depth: number,
): [any, boolean] {
  if (!data || typeof data !== 'object' || depth > 12) return [data, false]
  if (visited.has(data)) return [data, false]
  visited.add(data)

  if (Array.isArray(data)) {
    let changed = false
    const out = data.map(item => {
      const [next, c] = deepEnrich(item, enrichments, visited, depth + 1)
      if (c) changed = true
      return next
    })
    return changed ? [out, true] : [data, false]
  }

  // Check if this object is an enrichable profile
  let selfChanged = false
  let enriched = data
  if (
    typeof data.did === 'string' &&
    data.did.startsWith('did:') &&
    'handle' in data &&
    !data.__enriched &&
    enrichments.has(data.did)
  ) {
    const e = enrichments.get(data.did)!
    const patch: any = {__enriched: true}
    // Patch displayName if missing or if appview just echoed the handle
    if (
      e.displayName &&
      (!data.displayName || data.displayName === data.handle)
    )
      patch.displayName = e.displayName
    if (e.description && 'description' in data && !data.description)
      patch.description = e.description
    if (e.avatar && !data.avatar) patch.avatar = e.avatar
    if (e.banner && 'banner' in data && !data.banner) patch.banner = e.banner

    if (Object.keys(patch).length > 1) {
      // More than just __enriched
      enriched = {...data, ...patch}
      selfChanged = true
    } else {
      enriched = data
    }
  }

  // Recurse into children
  let childChanged = false
  const out: any = selfChanged ? {...enriched} : {}
  for (const key of Object.keys(enriched)) {
    const [next, c] = deepEnrich(enriched[key], enrichments, visited, depth + 1)
    if (c) {
      childChanged = true
      if (!selfChanged) {
        // Lazily copy all keys on first child change
        Object.assign(out, enriched)
      }
      out[key] = next
    } else if (selfChanged) {
      out[key] = enriched[key]
    }
  }

  if (childChanged && !selfChanged) {
    return [out, true]
  }
  if (selfChanged) {
    return [out, true]
  }
  return [data, false]
}

/**
 * Apply enrichments to all non-persisted queries in the cache.
 * Uses immutable updates so React detects the changes.
 */
function applyEnrichments(
  queryClient: QueryClient,
  enrichments: Map<string, Enrichment>,
): void {
  const queries = queryClient.getQueryCache().getAll()

  for (const query of queries) {
    const data = query.state.data
    if (!data) continue

    // Never touch persisted queries
    const qk = query.queryKey
    if (Array.isArray(qk) && qk[0] === PERSISTED_QUERY_ROOT) continue

    const [next, changed] = deepEnrich(data, enrichments, new WeakSet(), 0)
    if (changed) {
      suppressSubscriber = true
      queryClient.setQueryData(qk, next)
      suppressSubscriber = false
    }
  }
}

/**
 * Repair corrupted persisted query data.
 *
 * A previous bug converted arrays to plain objects via {...array}.
 * If we detect a persisted query whose data should be an array but
 * isn't, remove it so it gets re-fetched cleanly.
 */
function repairPersistedCache(queryClient: QueryClient): void {
  const queries = queryClient.getQueryCache().getAll()
  for (const query of queries) {
    const qk = query.queryKey
    if (!Array.isArray(qk) || qk[0] !== PERSISTED_QUERY_ROOT) continue

    const data = query.state.data
    if (!data) continue

    // Pinned/saved feed info queries return arrays.
    // If data is a plain object with numeric keys, it's corrupted.
    if (
      typeof data === 'object' &&
      !Array.isArray(data) &&
      '0' in (data as any)
    ) {
      console.warn('[ProfileEnrichment] Removing corrupted persisted query', qk)
      queryClient.removeQueries({queryKey: qk, exact: true})
    }
  }
}

// Module-level state
let suppressSubscriber = false
let enrichedDids = new Set<string>()
let inFlightDids = new Set<string>()
let pendingDids = new Set<string>()
let flushTimer: ReturnType<typeof setTimeout> | null = null
let currentQueryClient: QueryClient | null = null

function scheduleEnrichment(queryClient: QueryClient): void {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    const batch = pendingDids
    pendingDids = new Set()
    if (batch.size === 0) return
    processBatch(queryClient, batch)
  }, 50)
}

async function processBatch(
  queryClient: QueryClient,
  dids: Set<string>,
): Promise<void> {
  const CONCURRENCY = 8
  const didArray = [...dids]
  const enrichments = new Map<string, Enrichment>()

  for (let i = 0; i < didArray.length; i += CONCURRENCY) {
    const chunk = didArray.slice(i, i + CONCURRENCY)
    const results = await Promise.allSettled(
      chunk.map(async did => {
        const e = await fetchProfileEnrichment(did)
        return {did, enrichment: e}
      }),
    )

    for (const result of results) {
      if (result.status === 'fulfilled') {
        inFlightDids.delete(result.value.did)
        if (result.value.enrichment) {
          enrichments.set(result.value.did, result.value.enrichment)
        }
      }
    }
  }

  if (enrichments.size > 0) {
    applyEnrichments(queryClient, enrichments)
  }
}

function queueDids(queryClient: QueryClient, dids: Set<string>): void {
  let hasNew = false
  for (const did of dids) {
    if (!enrichedDids.has(did) && !inFlightDids.has(did)) {
      pendingDids.add(did)
      inFlightDids.add(did)
      enrichedDids.add(did)
      hasNew = true
    }
  }
  if (hasNew) {
    scheduleEnrichment(queryClient)
  }
}

/**
 * Global hook: enriches incomplete profiles via Slingshot.
 * Mount once in ShellInner.
 */
export function useProfileEnrichment(): void {
  const queryClient = useQueryClient()
  const qcRef = useRef(queryClient)
  qcRef.current = queryClient

  useEffect(() => {
    if (currentQueryClient !== queryClient) {
      enrichedDids = new Set()
      inFlightDids = new Set()
      pendingDids = new Set()
      currentQueryClient = queryClient
    }

    // Fix corrupted persisted data from previous bug
    repairPersistedCache(queryClient)

    const cache = queryClient.getQueryCache()

    // Initial scan
    const dids = new Set<string>()
    for (const query of cache.getAll()) {
      if (query.state.data) {
        collectIncompleteProfileDids(query.state.data, dids, new WeakSet(), 0)
      }
    }
    if (dids.size > 0) queueDids(queryClient, dids)

    // Subscribe to new data
    const unsubscribe = cache.subscribe(event => {
      if (suppressSubscriber) return
      if (event.type !== 'updated' || event.action?.type !== 'success') return
      const data = event.query.state.data
      if (!data) return

      const newDids = new Set<string>()
      collectIncompleteProfileDids(data, newDids, new WeakSet(), 0)
      if (newDids.size > 0) queueDids(qcRef.current, newDids)
    })

    return () => {
      unsubscribe()
      if (flushTimer) {
        clearTimeout(flushTimer)
        flushTimer = null
      }
    }
  }, [queryClient])
}
