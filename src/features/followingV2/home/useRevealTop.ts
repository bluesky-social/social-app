import {useEffect, useRef} from 'react'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'

/**
 * Furthest from the top, in points, that a reveal animates; further down it
 * jumps, since animating past unrendered rows makes the list lay them all out.
 * About what windowSize keeps rendered above. Provisional (APP-3159).
 */
export const ANIMATED_REVEAL_LIMIT = 3000

/**
 * Scrolls an anchored list to its true top, which anchoring won't do by itself
 * after posts are written above the reader.
 */
export function useRevealTop({
  topFetchedAt,
  offsetY,
  scrollToTop,
  onJump,
}: {
  /** The `fetchedAt` of the top page as rendered, if there is one. */
  topFetchedAt: number | undefined
  offsetY: {get(): number}
  /** Scrolls the list to its true top. */
  scrollToTop: (animated: boolean) => void
  /** Called after a jump; an animated scroll doesn't call it. */
  onJump?: () => void
}) {
  /** The top page as of the last render that committed. */
  const rendered = useRef(topFetchedAt)
  /** The top page to jump to once it renders. */
  const pending = useRef<{fetchedAt: number; shouldJump?: () => boolean}>(
    undefined,
  )

  const jump = useNonReactiveCallback((shouldJump?: () => boolean) => {
    if (shouldJump && !shouldJump()) {
      return
    }
    scrollToTop(false)
    onJump?.()
  })

  useEffect(() => {
    rendered.current = topFetchedAt
    const waiting = pending.current
    if (topFetchedAt !== undefined && topFetchedAt === waiting?.fetchedAt) {
      pending.current = undefined
      jump(waiting.shouldJump)
    }
  }, [topFetchedAt, jump])

  return {
    /** Animated within {@link ANIMATED_REVEAL_LIMIT} of the top, else a jump. */
    reveal: useNonReactiveCallback(() => {
      if (offsetY.get() > ANIMATED_REVEAL_LIMIT) {
        jump()
      } else {
        scrollToTop(true)
      }
    }),
    /**
     * Jumps once the page fetched at `fetchedAt` is the rendered top, at once
     * if it already is, unless `shouldJump` says no by then. Never animated:
     * the offset doesn't include the new page yet.
     */
    onceRendered: useNonReactiveCallback(
      (fetchedAt: number, shouldJump?: () => boolean) => {
        if (rendered.current === fetchedAt) {
          jump(shouldJump)
        } else {
          pending.current = {fetchedAt, shouldJump}
        }
      },
    ),
  }
}
