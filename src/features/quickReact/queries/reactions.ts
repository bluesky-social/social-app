/*
 * TanStack Query layer for the quick-react feature.
 *
 * Source of truth is MMKV (src/features/quickReact/storage.ts). This query
 * holds a reactive projection of the per-account reactions map, keyed by
 * (queryKey, did). Per-post consumers use `select: map => map[postUri]`.
 *
 * v0: queryFn reads from MMKV. useWriteReactionMutation is a no-op on the
 *     network; v1 will swap the mutationFn to a server call without touching
 *     any consumer.
 */

import {useEffect} from 'react'
import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useSession} from '#/state/session'
import {
  deleteAccountReaction,
  readAccountReactions,
  restoreAccountReaction,
  subscribeToReactions,
  writeAccountReaction,
} from '#/features/quickReact/storage'
import {
  type ReactionEmoji,
  type ReactionRecord,
  type ReactionsMap,
} from '#/features/quickReact/types'

const viewerReactionsQueryKeyRoot = 'quickReact:viewerReactions'

export const createViewerReactionsQueryKey = (args: {did: string}) =>
  createQueryKey(viewerReactionsQueryKeyRoot, args)

/**
 * Single per-account query returning the full map. Consumers typically use
 * `useViewerReaction({postUri})` below, which adds a `select`.
 */
export function useViewerReactionsQuery() {
  const {currentAccount} = useSession()
  const did = currentAccount?.did ?? ''
  const queryClient = useQueryClient()

  // Keep the cache in sync with MMKV writes from other subscribers (the
  // debounce scheduler, or a different component on the same post).
  useEffect(() => {
    if (!did) return
    const unsub = subscribeToReactions(did, () => {
      queryClient.setQueryData<ReactionsMap>(
        createViewerReactionsQueryKey({did}),
        readAccountReactions(did),
      )
    })
    return unsub
  }, [did, queryClient])

  return useQuery<ReactionsMap>({
    queryKey: createViewerReactionsQueryKey({did}),
    queryFn: async () => readAccountReactions(did),
    staleTime: STALE.INFINITY,
    enabled: !!did,
  })
}

/**
 * Write (or delete if emoji is null) a viewer's reaction for a postUri.
 *
 * v0: writes to MMKV synchronously (already done optimistically by the
 * scheduler) and is a no-op on the network. The mutation exists so v1 can
 * swap in a server call without touching consumers.
 */
export function useWriteReactionMutation() {
  const {currentAccount} = useSession()
  const did = currentAccount?.did ?? ''

  return useMutation<
    {postUri: string; emoji: ReactionEmoji | null},
    Error,
    {postUri: string; emoji: ReactionEmoji | null; previous?: ReactionRecord}
  >({
    mutationFn: async ({postUri, emoji}) => {
      if (!did) throw new Error('No session')
      // v0: no network. The scheduler has already written to MMKV.
      return {postUri, emoji}
    },
  })
}

/**
 * Imperative helpers used by the scheduler to apply and revert optimistic
 * writes. Not a hook — the scheduler lives outside React.
 */
export function applyOptimisticWrite(
  did: string,
  postUri: string,
  emoji: ReactionEmoji | null,
  queryClient: QueryClient,
): ReactionRecord | undefined {
  if (!did) return undefined
  const before = readAccountReactions(did)[postUri]
  if (emoji === null) {
    deleteAccountReaction(did, postUri)
  } else {
    writeAccountReaction(did, postUri, emoji)
  }
  queryClient.setQueryData<ReactionsMap>(
    createViewerReactionsQueryKey({did}),
    readAccountReactions(did),
  )
  return before
}

export function revertOptimisticWrite(
  did: string,
  postUri: string,
  previous: ReactionRecord | undefined,
  queryClient: QueryClient,
): void {
  if (!did) return
  if (previous) {
    restoreAccountReaction(did, previous)
  } else {
    deleteAccountReaction(did, postUri)
  }
  queryClient.setQueryData<ReactionsMap>(
    createViewerReactionsQueryKey({did}),
    readAccountReactions(did),
  )
}
