import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {type usePostFeedPrepend} from './queries/postFeed'
import {type useRevealTop} from './useRevealTop'
import {SETTLE_AT_TOP_LIMIT} from './useSettleAtTop'

/**
 * Whether the list is at its true top at `offsetY`: within
 * {@link SETTLE_AT_TOP_LIMIT} of it, as the settle and the pill judge it.
 */
export function isAtTop(offsetY: number) {
  return offsetY <= SETTLE_AT_TOP_LIMIT
}

/**
 * Takes a press of Home on a feed that stages new posts above the reader (see
 * `usePostFeedPrepend`), as anchored Following does, in two steps:
 *
 * - Below the top, it takes the reader up to it through what's loaded,
 *   including what's staged above them (see `useRevealTop`). It makes no
 *   request and writes nothing. Getting there reads what's staged, as
 *   scrolling there does.
 * - At the top (see {@link isAtTop}), it reads what's staged, which is in view
 *   there, and asks for what's newer with a prepend, or joins the one in
 *   progress, rather than refreshing. Once that has written, it jumps up to
 *   the new posts as they render. With nothing newer, it stays at the top and
 *   clears the Home dot, as nothing is new to the reader there. If they've
 *   left the top by the time the prepend writes, what it found stays staged
 *   above them, without a jump. A failed fetch leaves the feed as it was and
 *   the dot alone.
 *
 * Without a boundary to fetch above, as when the server didn't give one, it
 * refreshes from the top, as other feeds do.
 *
 * The press returns whether it took it. Disabled, it leaves it to the page.
 */
export function useHomePress({
  enabled,
  offsetY,
  prepend,
  revealTop,
  refresh,
  onHasNew,
  onFetch,
}: {
  /** Whether the feed stages new posts above the reader. */
  enabled: boolean
  /** The list's scroll offset. */
  offsetY: {get(): number}
  prepend: Pick<
    ReturnType<typeof usePostFeedPrepend>,
    'run' | 'isOwed' | 'markRead'
  >
  revealTop: ReturnType<typeof useRevealTop>
  /** Refreshes the feed from the top, and reveals its new top. */
  refresh: () => Promise<unknown>
  /** Sets the Home dot. */
  onHasNew?: (hasNew: boolean) => void
  /** A press asked for what's newer, for its metric. */
  onFetch?: () => void
}) {
  return useNonReactiveCallback((): boolean => {
    if (!enabled) {
      return false
    }
    if (!isAtTop(offsetY.get())) {
      revealTop.reveal()
      return true
    }
    onFetch?.()
    // A prepend in progress may replace what's staged, so it's left to finish.
    if (!prepend.isOwed()) {
      prepend.markRead()
    }
    // Right to the top, past anything staged behind the header.
    revealTop.reveal()
    // Not one the pill offers, as the press shows what it finds itself.
    const prepending = prepend.run('focus')
    if (!prepending) {
      void refresh()
      onHasNew?.(false)
      return true
    }
    void prepending.then(
      page => {
        if (!isAtTop(offsetY.get())) {
          return
        }
        if (page) {
          revealTop.onceRendered(page.fetchedAt)
        } else {
          onHasNew?.(false)
        }
      },
      e => {
        if (!isNetworkError(e)) {
          logger.error('Failed to fetch newer posts on a press of Home', {
            safeMessage: e,
          })
        }
      },
    )
    return true
  })
}
