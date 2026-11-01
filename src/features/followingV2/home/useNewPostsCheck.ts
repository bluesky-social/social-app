import {useEffect, useRef, useState} from 'react'

import {
  getCurrentState,
  useAppState,
  useOnAppReturnedFromBackground,
} from '#/lib/appState'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'

/** How old the clock must be for a view becoming active to check. APP-3159. */
export const FOCUS_CHECK_AFTER = 60 * 1000

/** How old the clock must be for a return to the app to check. APP-3159. */
export const RETURN_STALE_AFTER = 2 * 60 * 1000

/** What prompted a check, for the surface to decide how to show its find. */
export type NewPostsCheckTrigger = 'focus' | 'return' | 'interval'

type LastCheck = {
  /** When it started. */
  at: number
  /** The `fetchedAt` of the top page it checked. */
  top: number
  outcome: 'nothing' | 'found' | 'failed'
}

/**
 * Decides when one view of a feed checks for posts newer than its top page,
 * and hands what a check finds to `onFound`. Nothing is shared between views.
 *
 * The clock is the later of the top page's `fetchedAt` and this view's last
 * successful check of that page, so a check that finds nothing advances it and
 * one that fails doesn't.
 *
 * - Focus: becoming active checks if the clock is {@link FOCUS_CHECK_AFTER}
 *   old, or at any age if the feed is empty.
 * - Return: a real return to the app while active (see
 *   `onAppReturnedFromBackground`) checks if the clock is
 *   {@link RETURN_STALE_AFTER} old. One that comes while the view is busy or
 *   checking is judged once that's done.
 * - Interval: with `interval`, checks one interval after the clock, or after a
 *   failed check. It pauses once something is found, until a new top page.
 *
 * Only an active view checks, only while the app is in the foreground, never
 * while the view is busy, and one check of a top page at a time.
 */
export function useNewPostsCheck<T>({
  topFetchedAt,
  isEmpty,
  isActive,
  isBusy,
  interval,
  check,
  onFound,
}: {
  /** The `fetchedAt` of the feed's top page, if it has one yet. */
  topFetchedAt: number | undefined
  /** Whether the feed has no posts to show, which lets every focus check. */
  isEmpty: boolean
  /** Whether this view is the one being shown. */
  isActive: boolean
  /** Whether the view's refresh or restore is in progress. */
  isBusy: boolean
  /** How long after the clock to check again, if at all. */
  interval?: number
  /**
   * Resolves to what is newer than the top page, or a falsy value if nothing
   * is. Rejects if it can't tell, which leaves the clock alone. It's told what
   * prompted it, for a surface that checks differently on a return.
   */
  check: (
    trigger: NewPostsCheckTrigger,
  ) => Promise<T | false | null | undefined>
  /** What a check found, unless a new top page has replaced the one checked. */
  onFound: (result: T, trigger: NewPostsCheckTrigger) => void
}) {
  const [last, setLast] = useState<LastCheck>()
  /** The top page a check in flight is checking. */
  const checking = useRef<number>(undefined)
  /** The latest return while active, and the last one judged. */
  const [returnId, setReturnId] = useState<number>()
  const judgedReturnId = useRef<number>(undefined)
  const appState = useAppState()

  const isOfTop = last !== undefined && last.top === topFetchedAt
  const clock = Math.max(
    topFetchedAt ?? 0,
    isOfTop && last.outcome !== 'failed' ? last.at : 0,
  )
  const intervalDueAt =
    interval !== undefined &&
    isActive &&
    !isBusy &&
    appState === 'active' &&
    topFetchedAt !== undefined &&
    !(isOfTop && last.outcome === 'found')
      ? Math.max(clock, last?.at ?? 0) + interval
      : undefined

  /*
   * Not `useEffectEvent`, which React 19.2 never updates in `memo()` and
   * `forwardRef()` components (react/react#35187), as feed views are.
   */
  const run = useNonReactiveCallback(async (trigger: NewPostsCheckTrigger) => {
    const top = topFetchedAt
    if (
      !isActive ||
      isBusy ||
      top === undefined ||
      checking.current === top ||
      getCurrentState() !== 'active'
    ) {
      return
    }
    checking.current = top
    const at = Date.now()
    let result: T | false | null | undefined
    let outcome: LastCheck['outcome'] = 'failed'
    try {
      result = await check(trigger)
      outcome = result ? 'found' : 'nothing'
    } catch (e) {
      if (!isNetworkError(e)) {
        logger.warn('Failed to check for new posts', {safeMessage: e})
      }
    }
    if (checking.current === top) checking.current = undefined
    settle({at, top, outcome}, result ? {result, trigger} : undefined)
  })

  const settle = useNonReactiveCallback(
    (
      lastCheck: LastCheck,
      found?: {result: T; trigger: NewPostsCheckTrigger},
    ) => {
      setLast(lastCheck)
      if (found && lastCheck.top === topFetchedAt) {
        onFound(found.result, found.trigger)
      }
    },
  )

  const onBecomeActive = useNonReactiveCallback(() => {
    if (isEmpty || Date.now() - clock >= FOCUS_CHECK_AFTER) void run('focus')
  })
  useEffect(() => {
    if (isActive) onBecomeActive()
  }, [isActive, onBecomeActive])

  useOnAppReturnedFromBackground(appReturn => {
    if (isActive) setReturnId(appReturn.id)
  })
  const judgeReturn = useNonReactiveCallback(() => {
    const isChecking =
      topFetchedAt !== undefined && checking.current === topFetchedAt
    if (returnId === judgedReturnId.current || isBusy || isChecking) return
    judgedReturnId.current = returnId
    if (Date.now() - clock >= RETURN_STALE_AFTER) void run('return')
  })
  // Judges a return at once, or once the view's work or a check is done.
  useEffect(() => {
    judgeReturn()
  }, [returnId, isBusy, last, judgeReturn])

  useEffect(() => {
    if (intervalDueAt === undefined) return
    const timeout = setTimeout(
      () => void run('interval'),
      Math.max(0, intervalDueAt - Date.now()),
    )
    return () => clearTimeout(timeout)
  }, [intervalDueAt, run])
}
