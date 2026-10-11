import {useEffect, useRef} from 'react'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'

/**
 * How far below the true top of the list, in points, revealing the top still
 * animates there. From further down it jumps instead: an animation that long
 * has the list lay out the rows it passes, which can stall it, and the
 * prototype crashed scrolling 96k points up. A little under four phone
 * screens, which is about as much as the list keeps rendered above the one on
 * screen. Provisional, to be measured on device (APP-3159).
 */
export const ANIMATED_REVEAL_LIMIT = 3000

/**
 * Takes the reader up to the true top of a list that holds on to the row
 * they're on when posts go above it, as anchored Following's does (see
 * `PostFeed`).
 *
 * `reveal` takes them up through what's loaded, from where the list is:
 * animated from up to {@link ANIMATED_REVEAL_LIMIT} below the top, and with a
 * jump from further down. `onceRendered` jumps there once the top page fetched
 * at `fetchedAt` has rendered, as after a write from this view that put it on
 * top, which the list would otherwise keep above the reader. That jump isn't
 * animated, as the new page can be long, and the offset the list last
 * reported doesn't include it yet.
 *
 * A jump arrives at once, which `onJump` is told. An animated scroll reports
 * its arrival as the list does, at the end of it.
 */
export function useRevealTop({
  topFetchedAt,
  offsetY,
  scrollToTop,
  onJump,
}: {
  /** The `fetchedAt` of the top page as rendered, if there is one. */
  topFetchedAt: number | undefined
  /** The list's scroll offset. */
  offsetY: {get(): number}
  /** Scrolls the list to its true top. */
  scrollToTop: (animated: boolean) => void
  /** The list has jumped to its true top. */
  onJump?: () => void
}) {
  /** The top page as of the last render that committed. */
  const rendered = useRef(topFetchedAt)
  /** The top page to jump to once it renders. */
  const pending = useRef<number>(undefined)

  const jump = useNonReactiveCallback(() => {
    scrollToTop(false)
    onJump?.()
  })

  useEffect(() => {
    rendered.current = topFetchedAt
    if (topFetchedAt !== undefined && topFetchedAt === pending.current) {
      pending.current = undefined
      jump()
    }
  }, [topFetchedAt, jump])

  return {
    reveal: useNonReactiveCallback(() => {
      if (offsetY.get() > ANIMATED_REVEAL_LIMIT) {
        jump()
      } else {
        scrollToTop(true)
      }
    }),
    onceRendered: useNonReactiveCallback((fetchedAt: number) => {
      if (rendered.current === fetchedAt) {
        jump()
      } else {
        pending.current = fetchedAt
      }
    }),
  }
}
