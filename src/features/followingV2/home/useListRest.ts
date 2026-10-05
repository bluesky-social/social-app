import {useCallback, useEffect, useRef} from 'react'
import {
  type ScrollEvent,
  type ScrollHandlers,
  useSharedValue,
} from 'react-native-reanimated'
import {scheduleOnRN} from 'react-native-worklets'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'

/**
 * How long a list has to go without a scroll event, with no finger on it, to
 * be at rest. Momentum and the corrections anchoring makes arrive as scroll
 * events, so it waits those out too. Provisional, to be measured on device
 * (APP-3159).
 */
export const LIST_REST_QUIET_MS = 120

/**
 * Tells when a list is at rest: it has laid out, no finger is dragging it, and
 * it hasn't sent a scroll event for {@link LIST_REST_QUIET_MS}. A list that
 * never scrolls is at rest from its first layout.
 *
 * The list reports to it through `onLayout`, and through `scrollHandlers`,
 * which are `inner` (such as those from context) keeping whether it's dragged
 * and when it last scrolled as well. They keep them on the UI thread for JS to
 * read when it checks, so the list only calls over to JS at the end of a drag.
 * Disabled, `scrollHandlers` are `inner` as they are.
 *
 * `atRest` resolves once the list is at rest: at once if it is, or else when it
 * comes to rest, however long that takes. Never once the view has unmounted.
 */
export function useListRest(
  inner: ScrollHandlers<Record<string, unknown>>,
  enabled: boolean,
) {
  // Destructured outside the worklets, as `List` does (see #4108).
  const {
    onBeginDrag: onBeginDragInner,
    onEndDrag: onEndDragInner,
    onScroll: onScrollInner,
    onMomentumEnd,
  } = inner
  const isDragging = useSharedValue(false)
  /** The `Date.now()` of the list's last scroll event, or 0 before its first. */
  const lastScrollAt = useSharedValue(0)
  const isLaidOut = useRef(false)
  /** What `atRest` hands out, until the list comes to rest. */
  const waiting = useRef<{promise: Promise<void>; resolve: () => void}>(
    undefined,
  )
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timeout.current), [])

  /**
   * Resolves `waiting` if the list is at rest. Moving without a finger on it,
   * it checks again once the list could have been still for long enough.
   * Otherwise the first layout or the end of the drag checks again.
   */
  const check = useNonReactiveCallback(() => {
    clearTimeout(timeout.current)
    if (!waiting.current || !isLaidOut.current || isDragging.get()) {
      return
    }
    const wait = lastScrollAt.get() + LIST_REST_QUIET_MS - Date.now()
    if (wait > 0) {
      timeout.current = setTimeout(check, wait)
      return
    }
    waiting.current.resolve()
    waiting.current = undefined
  })

  const onBeginDrag = useCallback(
    (e: ScrollEvent, ctx: Record<string, unknown>) => {
      'worklet'
      onBeginDragInner?.(e, ctx)
      isDragging.set(true)
    },
    [onBeginDragInner, isDragging],
  )
  const onEndDrag = useCallback(
    (e: ScrollEvent, ctx: Record<string, unknown>) => {
      'worklet'
      onEndDragInner?.(e, ctx)
      isDragging.set(false)
      lastScrollAt.set(Date.now())
      scheduleOnRN(check)
    },
    [onEndDragInner, isDragging, lastScrollAt, check],
  )
  const onScroll = useCallback(
    (e: ScrollEvent, ctx: Record<string, unknown>) => {
      'worklet'
      onScrollInner?.(e, ctx)
      lastScrollAt.set(Date.now())
    },
    [onScrollInner, lastScrollAt],
  )

  return {
    scrollHandlers: enabled
      ? {onBeginDrag, onEndDrag, onScroll, onMomentumEnd}
      : inner,
    onLayout: () => {
      isLaidOut.current = true
      check()
    },
    atRest: () => {
      if (!waiting.current) {
        let resolve = () => {}
        const promise = new Promise<void>(r => {
          resolve = r
        })
        waiting.current = {promise, resolve}
      }
      const {promise} = waiting.current
      check()
      return promise
    },
  }
}
