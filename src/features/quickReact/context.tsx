/*
 * Quick-react feature context.
 *
 * Mounted at the app root (see App.native.tsx / App.web.tsx). Owns a
 * per-postUri trailing-debounce scheduler that:
 *  1. Synchronously writes to MMKV and to the TanStack Query cache
 *     (optimistic, <100ms — AC-16).
 *  2. Schedules a trailing 2s flush (AC-17). Subsequent selections within
 *     the window reset the timer; only the final selection hits the
 *     mutation.
 *  3. On mutation failure, reverts both MMKV and the query cache to the
 *     pre-change value and shows a localized "Couldn't save reaction"
 *     toast. No retry (AC-16).
 *  4. On AppState background, flushes any pending timers immediately so
 *     the write isn't lost if the OS kills us.
 */

import {createContext, useContext, useEffect, useMemo, useRef} from 'react'
import {AppState, type AppStateStatus} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {useSession} from '#/state/session'
import * as Toast from '#/components/Toast'
import {useAnalytics} from '#/analytics'
import {DEBOUNCE_MS} from '#/features/quickReact/constants'
import {
  applyOptimisticWrite,
  revertOptimisticWrite,
  useWriteReactionMutation,
} from '#/features/quickReact/queries/reactions'
import {
  type ReactionEmoji,
  type ReactionRecord,
} from '#/features/quickReact/types'

type PendingEntry = {
  timer: ReturnType<typeof setTimeout> | null
  lastKnown: ReactionRecord | undefined
  lastKnownCaptured: boolean
  pendingEmoji: ReactionEmoji | null
}

export type QuickReactController = {
  schedule: (postUri: string, emoji: ReactionEmoji | null) => void
  cancel: (postUri: string) => void
  flushAll: () => void
}

const ControllerContext = createContext<QuickReactController | null>(null)

export function useQuickReactController(): QuickReactController {
  const ctx = useContext(ControllerContext)
  if (!ctx) {
    throw new Error(
      'useQuickReactController must be used inside <QuickReactProvider>',
    )
  }
  return ctx
}

export function QuickReactProvider({children}: {children: React.ReactNode}) {
  const queryClient = useQueryClient()
  const {currentAccount} = useSession()
  const did = currentAccount?.did ?? ''
  const mutation = useWriteReactionMutation()
  const ax = useAnalytics()
  const {_} = useLingui()

  const pendingRef = useRef<Map<string, PendingEntry>>(new Map())

  const flushOne = useMemo(
    () => (postUri: string) => {
      const pending = pendingRef.current.get(postUri)
      if (!pending) return
      if (pending.timer) {
        clearTimeout(pending.timer)
        pending.timer = null
      }
      const {lastKnown, pendingEmoji} = pending
      pendingRef.current.delete(postUri)

      mutation.mutate(
        {postUri, emoji: pendingEmoji, previous: lastKnown},
        {
          onError: () => {
            // Revert optimistic write on failure
            revertOptimisticWrite(did, postUri, lastKnown, queryClient)
            Toast.show(_(msg`Couldn't save reaction`), {type: 'warning'})
          },
        },
      )
    },
    [did, queryClient, mutation, _],
  )

  const schedule = useMemo(
    () => (postUri: string, emoji: ReactionEmoji | null) => {
      if (!did) return

      // Optimistic write: synchronous MMKV + query cache update
      const before = applyOptimisticWrite(did, postUri, emoji, queryClient)

      const existing = pendingRef.current.get(postUri)
      if (existing?.timer) clearTimeout(existing.timer)

      const entry: PendingEntry = existing ?? {
        timer: null,
        lastKnown: undefined,
        lastKnownCaptured: false,
        pendingEmoji: emoji,
      }

      if (!entry.lastKnownCaptured) {
        entry.lastKnown = before
        entry.lastKnownCaptured = true
      }
      entry.pendingEmoji = emoji
      entry.timer = setTimeout(() => flushOne(postUri), DEBOUNCE_MS)

      pendingRef.current.set(postUri, entry)

      // Emit analytics tracking the logical select/remove. Full surface/
      // entryPoint/logContext are added by callers via the dedicated
      // analytics helpers — the scheduler only exists to coalesce writes.
      // (Analytics emission lives closer to the gesture; see the components.)
      void ax
    },
    [did, queryClient, flushOne, ax],
  )

  const cancel = useMemo(
    () => (postUri: string) => {
      const entry = pendingRef.current.get(postUri)
      if (!entry) return
      if (entry.timer) clearTimeout(entry.timer)
      pendingRef.current.delete(postUri)
    },
    [],
  )

  const flushAll = useMemo(
    () => () => {
      const uris = Array.from(pendingRef.current.keys())
      for (const uri of uris) flushOne(uri)
    },
    [flushOne],
  )

  // Flush on background so OS kill doesn't drop pending writes.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') {
        flushAll()
      }
    })
    return () => sub.remove()
  }, [flushAll])

  // On sign-out (did becomes empty), cancel everything.
  useEffect(() => {
    if (did) return
    const uris = Array.from(pendingRef.current.keys())
    for (const uri of uris) {
      const entry = pendingRef.current.get(uri)
      if (entry?.timer) clearTimeout(entry.timer)
    }
    pendingRef.current.clear()
  }, [did])

  const controller = useMemo<QuickReactController>(
    () => ({schedule, cancel, flushAll}),
    [schedule, cancel, flushAll],
  )

  return (
    <ControllerContext.Provider value={controller}>
      {children}
    </ControllerContext.Provider>
  )
}
