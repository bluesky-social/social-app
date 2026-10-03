import {useCallback} from 'react'
import {
  type ScrollHandlers,
  type SharedValue,
  useSharedValue,
} from 'react-native-reanimated'
import {type ReanimatedScrollEvent} from 'react-native-reanimated/lib/typescript/hook/commonTypes'
import {scheduleOnRN} from 'react-native-worklets'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {useScrollHandlers} from '#/lib/ScrollContext'
import {SETTLE_AT_TOP_LIMIT, type SettleAtTopHandlers} from './useSettleAtTop'

/**
 * What the list reports on the JS thread: what {@link SettleAtTopHandlers}
 * need, and when it reaches its top, which the restore pill needs.
 */
export type ListScrollReports = SettleAtTopHandlers & {
  /** A scroll event found the list at the top where the last one didn't. */
  onReachTop: () => void
}

/**
 * The scroll handlers from context, for a list to take from a
 * `ScrollProvider` around it, with what `handlers` need reported to them as
 * well, on the JS thread, and `offsetY` kept at the list's offset. A scroll
 * event is reported only when it finds the list at the top, or off it, where
 * the last event didn't, so not every frame, and a rest at the top is always
 * followed by a report of leaving it. Without `handlers`, they're the handlers
 * from context as they are.
 */
export function useSettleScrollHandlers(
  handlers: ListScrollReports | undefined,
  offsetY: SharedValue<number>,
): ScrollHandlers<Record<string, unknown>> {
  const context = useScrollHandlers()
  // Destructured outside the worklets, as `List` does (see #4108).
  const {
    onBeginDrag: onBeginDragFromContext,
    onEndDrag: onEndDragFromContext,
    onScroll: onScrollFromContext,
    onMomentumEnd: onMomentumEndFromContext,
  } = context
  const isAtTop = useSharedValue(true)
  const onBeginDragJS = useNonReactiveCallback(handlers?.onBeginDrag)
  const onEndDragJS = useNonReactiveCallback(handlers?.onEndDrag)
  const onMomentumEndJS = useNonReactiveCallback(handlers?.onMomentumEnd)
  const onLeaveTopJS = useNonReactiveCallback(handlers?.onLeaveTop)
  const onReachTopJS = useNonReactiveCallback(handlers?.onReachTop)

  const onBeginDrag = useCallback(
    (e: ReanimatedScrollEvent, ctx: Record<string, unknown>) => {
      'worklet'
      onBeginDragFromContext?.(e, ctx)
      offsetY.set(e.contentOffset.y)
      scheduleOnRN(onBeginDragJS)
    },
    [onBeginDragFromContext, offsetY, onBeginDragJS],
  )
  const onEndDrag = useCallback(
    (e: ReanimatedScrollEvent, ctx: Record<string, unknown>) => {
      'worklet'
      onEndDragFromContext?.(e, ctx)
      offsetY.set(e.contentOffset.y)
      const atTop = e.contentOffset.y <= SETTLE_AT_TOP_LIMIT
      if (atTop && !isAtTop.get()) {
        scheduleOnRN(onReachTopJS)
      }
      isAtTop.set(atTop)
      scheduleOnRN(onEndDragJS, e.contentOffset.y, e.velocity?.y ?? 0)
    },
    [onEndDragFromContext, offsetY, isAtTop, onReachTopJS, onEndDragJS],
  )
  const onMomentumEnd = useCallback(
    (e: ReanimatedScrollEvent, ctx: Record<string, unknown>) => {
      'worklet'
      onMomentumEndFromContext?.(e, ctx)
      offsetY.set(e.contentOffset.y)
      const atTop = e.contentOffset.y <= SETTLE_AT_TOP_LIMIT
      if (atTop && !isAtTop.get()) {
        scheduleOnRN(onReachTopJS)
      }
      isAtTop.set(atTop)
      scheduleOnRN(onMomentumEndJS, e.contentOffset.y)
    },
    [onMomentumEndFromContext, offsetY, isAtTop, onReachTopJS, onMomentumEndJS],
  )
  const onScroll = useCallback(
    (e: ReanimatedScrollEvent, ctx: Record<string, unknown>) => {
      'worklet'
      onScrollFromContext?.(e, ctx)
      offsetY.set(e.contentOffset.y)
      const atTop = e.contentOffset.y <= SETTLE_AT_TOP_LIMIT
      if (atTop !== isAtTop.get()) {
        isAtTop.set(atTop)
        scheduleOnRN(atTop ? onReachTopJS : onLeaveTopJS)
      }
    },
    [onScrollFromContext, offsetY, isAtTop, onReachTopJS, onLeaveTopJS],
  )

  if (!handlers) {
    return context
  }
  return {onBeginDrag, onEndDrag, onMomentumEnd, onScroll}
}
