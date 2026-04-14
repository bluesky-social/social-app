/*
 * Quick-react storage module.
 *
 * Thin wrapper over the account-scoped MMKV Storage instance
 * (src/storage/index.ts account store). Exposes a per-DID key/value API over
 * the viewer's own reactions map.
 *
 * v0 is client-only; v1 may swap to a server-backed store.
 */

import {
  MAX_RECORDS,
  PRUNE_COUNT,
  REACTIONS_STORE_VERSION,
} from '#/features/quickReact/constants'
import {
  type ReactionEmoji,
  type ReactionRecord,
  type ReactionsMap,
  type ReactionsStore,
} from '#/features/quickReact/types'
import {account} from '#/storage'

function defensiveRead(did: string): ReactionsStore {
  try {
    const raw = account.get([did, 'quickReactions'])
    if (!raw) return emptyStore()
    if (typeof raw !== 'object') return emptyStore()
    if (raw.version !== REACTIONS_STORE_VERSION) {
      return emptyStore()
    }
    const reactions =
      raw.reactions && typeof raw.reactions === 'object' ? raw.reactions : {}
    return {
      version: REACTIONS_STORE_VERSION,
      reactions,
      lastPrunedAt: raw.lastPrunedAt,
    }
  } catch {
    return emptyStore()
  }
}

function emptyStore(): ReactionsStore {
  return {version: REACTIONS_STORE_VERSION, reactions: {}}
}

export function readAccountReactions(did: string): ReactionsMap {
  return defensiveRead(did).reactions
}

/**
 * Write (or overwrite) a reaction record for a single postUri.
 * Enforces a MAX_RECORDS cap by evicting the oldest PRUNE_COUNT by updatedAt.
 */
export function writeAccountReaction(
  did: string,
  postUri: string,
  emoji: ReactionEmoji,
  now: number = Date.now(),
): ReactionRecord {
  const store = defensiveRead(did)
  const record: ReactionRecord = {postUri, emoji, updatedAt: now}
  const next: ReactionsMap = {...store.reactions, [postUri]: record}

  let lastPrunedAt = store.lastPrunedAt
  const keys = Object.keys(next)
  if (keys.length > MAX_RECORDS) {
    const sorted = keys
      .map(k => next[k])
      .sort((a, b) => a.updatedAt - b.updatedAt)
    const evict = sorted.slice(0, PRUNE_COUNT)
    for (const r of evict) {
      delete next[r.postUri]
    }
    lastPrunedAt = now
  }

  account.set([did, 'quickReactions'], {
    version: REACTIONS_STORE_VERSION,
    reactions: next,
    lastPrunedAt,
  })
  return record
}

export function deleteAccountReaction(did: string, postUri: string): void {
  const store = defensiveRead(did)
  if (!(postUri in store.reactions)) return
  const next = {...store.reactions}
  delete next[postUri]
  account.set([did, 'quickReactions'], {
    version: REACTIONS_STORE_VERSION,
    reactions: next,
    lastPrunedAt: store.lastPrunedAt,
  })
}

/**
 * Restore a prior record verbatim. Used by the debounce scheduler on
 * mutation failure to revert an optimistic write.
 */
export function restoreAccountReaction(
  did: string,
  record: ReactionRecord,
): void {
  const store = defensiveRead(did)
  const next: ReactionsMap = {...store.reactions, [record.postUri]: record}
  account.set([did, 'quickReactions'], {
    version: REACTIONS_STORE_VERSION,
    reactions: next,
    lastPrunedAt: store.lastPrunedAt,
  })
}

/**
 * Subscribe to account-scoped reactions changes. Returns an unsubscribe fn.
 */
export function subscribeToReactions(did: string, cb: () => void): () => void {
  const sub = account.addOnValueChangedListener([did, 'quickReactions'], cb)
  return () => sub.remove()
}
