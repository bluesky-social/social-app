import {useCallback} from 'react'
import {type ScrollHandlers, useSharedValue} from 'react-native-reanimated'
import {type ReanimatedScrollEvent} from 'react-native-reanimated/lib/typescript/hook/commonTypes'

import {useScrollHandlers} from '#/lib/ScrollContext'
import {
  absorbAnchorCorrection,
  INITIAL_ANCHOR_CORRECTION_STATE,
  type ScrollEventKind,
} from './anchorCorrection'

/**
 * The scroll handlers from context, for a list with
 * `maintainVisibleContentPosition` to take from a `ScrollProvider` around it,
 * reporting offsets with its anchor corrections taken out during a drag and
 * the momentum after it.
 *
 * A correction moves the offset by however much the content above the anchor
 * changed, in a scroll event of its own. `MainScrollProvider` would read that
 * as the user dragging, and hide or show the Home header for it. With each
 * correction taken off (see `absorbAnchorCorrection`), it only sees the user's
 * own movement. Disabled, they're the handlers from context as they are.
 */
export function useAnchorCorrectionScrollHandlers(
  enabled: boolean,
): ScrollHandlers<Record<string, unknown>> {
  const context = useScrollHandlers()
  // Destructured outside the worklets, as `List` does (see #4108).
  const {
    onBeginDrag: onBeginDragFromContext,
    onEndDrag: onEndDragFromContext,
    onScroll: onScrollFromContext,
    onMomentumEnd: onMomentumEndFromContext,
  } = context
  const state = useSharedValue(INITIAL_ANCHOR_CORRECTION_STATE)

  const absorb = useCallback(
    (
      kind: ScrollEventKind,
      e: ReanimatedScrollEvent,
    ): ReanimatedScrollEvent => {
      'worklet'
      const next = absorbAnchorCorrection(state.get(), kind, e)
      state.set(next.state)
      if (next.offsetY === e.contentOffset.y) {
        return e
      }
      return {...e, contentOffset: {x: e.contentOffset.x, y: next.offsetY}}
    },
    [state],
  )

  const onBeginDrag = useCallback(
    (e: ReanimatedScrollEvent, ctx: Record<string, unknown>) => {
      'worklet'
      const absorbed = absorb('beginDrag', e)
      onBeginDragFromContext?.(absorbed, ctx)
    },
    [onBeginDragFromContext, absorb],
  )
  const onEndDrag = useCallback(
    (e: ReanimatedScrollEvent, ctx: Record<string, unknown>) => {
      'worklet'
      const absorbed = absorb('endDrag', e)
      onEndDragFromContext?.(absorbed, ctx)
    },
    [onEndDragFromContext, absorb],
  )
  const onMomentumEnd = useCallback(
    (e: ReanimatedScrollEvent, ctx: Record<string, unknown>) => {
      'worklet'
      const absorbed = absorb('momentumEnd', e)
      onMomentumEndFromContext?.(absorbed, ctx)
    },
    [onMomentumEndFromContext, absorb],
  )
  const onScroll = useCallback(
    (e: ReanimatedScrollEvent, ctx: Record<string, unknown>) => {
      'worklet'
      const absorbed = absorb('scroll', e)
      onScrollFromContext?.(absorbed, ctx)
    },
    [onScrollFromContext, absorb],
  )

  if (!enabled) {
    return context
  }
  return {onBeginDrag, onEndDrag, onMomentumEnd, onScroll}
}
