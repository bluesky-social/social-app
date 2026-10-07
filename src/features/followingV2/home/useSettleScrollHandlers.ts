import {useCallback} from 'react'
import {type ScrollHandlers, useSharedValue} from 'react-native-reanimated'
import {type ReanimatedScrollEvent} from 'react-native-reanimated/lib/typescript/hook/commonTypes'
import {scheduleOnRN} from 'react-native-worklets'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {SETTLE_AT_TOP_LIMIT, type SettleAtTopHandlers} from './useSettleAtTop'

/**
 * The scroll handlers `inner`, such as those from context, for a list to take
 * from a `ScrollProvider` around it, with what {@link SettleAtTopHandlers}
 * need reported to them as well, on the JS thread. They're reported from each
 * event as the list sent it, whatever `inner` passes on. A scroll event is
 * reported only when it finds the list off the top where the last event found
 * it at the top, so not every frame, and a rest at the top is always followed
 * by a report of leaving it. Without `handlers`, they're `inner` as they are.
 */
export function useSettleScrollHandlers(
  inner: ScrollHandlers<Record<string, unknown>>,
  handlers: SettleAtTopHandlers | undefined,
): ScrollHandlers<Record<string, unknown>> {
  // Destructured outside the worklets, as `List` does (see #4108).
  const {
    onBeginDrag: onBeginDragInner,
    onEndDrag: onEndDragInner,
    onScroll: onScrollInner,
    onMomentumEnd: onMomentumEndInner,
  } = inner
  const isAtTop = useSharedValue(true)
  const onBeginDragJS = useNonReactiveCallback(handlers?.onBeginDrag)
  const onEndDragJS = useNonReactiveCallback(handlers?.onEndDrag)
  const onMomentumEndJS = useNonReactiveCallback(handlers?.onMomentumEnd)
  const onLeaveTopJS = useNonReactiveCallback(handlers?.onLeaveTop)

  const onBeginDrag = useCallback(
    (e: ReanimatedScrollEvent, ctx: Record<string, unknown>) => {
      'worklet'
      onBeginDragInner?.(e, ctx)
      scheduleOnRN(onBeginDragJS)
    },
    [onBeginDragInner, onBeginDragJS],
  )
  const onEndDrag = useCallback(
    (e: ReanimatedScrollEvent, ctx: Record<string, unknown>) => {
      'worklet'
      onEndDragInner?.(e, ctx)
      isAtTop.set(e.contentOffset.y <= SETTLE_AT_TOP_LIMIT)
      scheduleOnRN(onEndDragJS, e.contentOffset.y, e.velocity?.y ?? 0)
    },
    [onEndDragInner, isAtTop, onEndDragJS],
  )
  const onMomentumEnd = useCallback(
    (e: ReanimatedScrollEvent, ctx: Record<string, unknown>) => {
      'worklet'
      onMomentumEndInner?.(e, ctx)
      isAtTop.set(e.contentOffset.y <= SETTLE_AT_TOP_LIMIT)
      scheduleOnRN(onMomentumEndJS, e.contentOffset.y)
    },
    [onMomentumEndInner, isAtTop, onMomentumEndJS],
  )
  const onScroll = useCallback(
    (e: ReanimatedScrollEvent, ctx: Record<string, unknown>) => {
      'worklet'
      onScrollInner?.(e, ctx)
      const atTop = e.contentOffset.y <= SETTLE_AT_TOP_LIMIT
      if (atTop !== isAtTop.get()) {
        isAtTop.set(atTop)
        if (!atTop) {
          scheduleOnRN(onLeaveTopJS)
        }
      }
    },
    [onScrollInner, isAtTop, onLeaveTopJS],
  )

  if (!handlers) {
    return inner
  }
  return {onBeginDrag, onEndDrag, onMomentumEnd, onScroll}
}
