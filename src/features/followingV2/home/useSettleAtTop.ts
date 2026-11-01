import {useEffect, useRef} from 'react'
import {useQueryClient} from '@tanstack/react-query'

import {
  type FeedDescriptor,
  type FeedParams,
  type PostFeedData,
  RQKEY,
  usePostFeedSettle,
} from './queries/postFeed'

/**
 * How close to its resting offset counts as the top of the list. That offset
 * is 0 where the header's space is padding in the content, and negative where
 * the platform applies it as an inset, so a small positive bound reads as the
 * top under both. Provisional, to be measured on device.
 */
export const SETTLE_AT_TOP_LIMIT = 5

/**
 * How long the list has to stay at the top after coming to rest there before
 * the feed settles. A correction to the list's offset, as a prepend's commit
 * makes, arrives as a scroll event after the rest it follows, and leaving the
 * top in the meantime calls the settle off. Provisional, to be measured on
 * device.
 */
export const SETTLE_QUIET_MS = 250

/** What the list reports for {@link useSettleAtTop}. */
export type SettleAtTopHandlers = {
  /** A finger started dragging the list. */
  onBeginDrag: () => void
  /** The finger let go, at `offsetY`, with the list moving at `velocityY`. */
  onEndDrag: (offsetY: number, velocityY: number) => void
  /** The list stopped after the momentum a drag gave it, at `offsetY`. */
  onMomentumEnd: (offsetY: number) => void
  /** A scroll event found the list somewhere other than at the top. */
  onLeaveTop: () => void
}

/**
 * Settles the feed (see {@link usePostFeedSettle}) when the reader brings the
 * list to rest at its true top: at the end of a drag that leaves it still, or
 * at the end of the momentum after one, at the top, and still there
 * {@link SETTLE_QUIET_MS} later.
 *
 * Only the reader's own movement counts, so neither where the list was first
 * put nor where a correction moved it is a rest. The settle depends on the
 * data as it was when the list came to rest, and gives way to anything that
 * has replaced the pages it would keep since, as a prepend's commit does. It's
 * called off by another drag, by the list leaving the top, and by unmounting.
 * `onRestAtTop` is told when it settles, whether or not that writes anything.
 */
export function useSettleAtTop(
  feedDesc: FeedDescriptor,
  params: FeedParams | undefined,
  {
    enabled,
    onRestAtTop,
  }: {
    enabled: boolean
    /** The reader has come to rest at the true top. */
    onRestAtTop?: () => void
  },
): SettleAtTopHandlers {
  const queryClient = useQueryClient()
  const settle = usePostFeedSettle(feedDesc, params)
  const queryKey = RQKEY(feedDesc, params)
  const isDragging = useRef(false)
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  const cancel = () => {
    clearTimeout(timeout.current)
    timeout.current = undefined
  }
  useEffect(() => cancel, [])

  const onRest = (offsetY: number) => {
    cancel()
    if (!enabled || isDragging.current || offsetY > SETTLE_AT_TOP_LIMIT) {
      return
    }
    const before = queryClient.getQueryData<PostFeedData>(queryKey)
    timeout.current = setTimeout(() => {
      timeout.current = undefined
      onRestAtTop?.()
      void settle(before)
    }, SETTLE_QUIET_MS)
  }

  return {
    onBeginDrag: () => {
      isDragging.current = true
      cancel()
    },
    onEndDrag: (offsetY, velocityY) => {
      isDragging.current = false
      // Moving, it comes to rest at the end of its momentum instead.
      if (!velocityY) {
        onRest(offsetY)
      }
    },
    onMomentumEnd: onRest,
    onLeaveTop: cancel,
  }
}
